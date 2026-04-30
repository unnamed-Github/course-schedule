import { supabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo, ScheduleOverride } from './types'
import { COURSES, SCHEDULES } from './seed-data'
import { setSemesterCache } from './semester'
import type { Holiday, MakeupDay } from './semester'

// Local in-memory storage for data when Supabase is unavailable
let localStorage: {
  assignments: Assignment[]
  memos: Memo[]
  scheduleOverrides: ScheduleOverride[]
} = {
  assignments: [],
  memos: [],
  scheduleOverrides: []
}

const DEFAULT_HOLIDAYS: Holiday[] = [
  { name: '清明节', start: '2026-04-05', end: '2026-04-05' },
  { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
  { name: '端午节', start: '2026-06-19', end: '2026-06-19' },
]

const DEFAULT_MAKEUP_DAYS: MakeupDay[] = [
  { date: '2026-02-28', replacesDayOfWeek: 1, weekType: 'all' },
  { date: '2026-05-09', replacesDayOfWeek: 2, weekType: 'odd' },
]

// ---- Cache layer ----
const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, { data: unknown; ts: number }>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T
  cache.delete(key)
  return null
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() })
}

function invalidateCache(prefix: string) {
  for (const key of cache.keys()) { if (key.startsWith(prefix)) cache.delete(key) }
}

function genId() { return crypto.randomUUID() }

async function ensureSeedData() {
  try {
    const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true })
    if (count === 0) {
      await supabase.from('courses').insert(COURSES)
      await supabase.from('course_schedules').insert(SCHEDULES)
      await supabase.from('semester_config').insert([
        { key: 'semester_start', value: '2026-02-25' },
        { key: 'teaching_weeks', value: '15' },
        { key: 'exam_weeks', value: '2' },
        { key: 'holidays', value: JSON.stringify(DEFAULT_HOLIDAYS) },
        { key: 'makeup_days', value: JSON.stringify(DEFAULT_MAKEUP_DAYS) },
      ])
      await supabase.from('site_config').insert([
        { key: 'password_hash', value: 'f0e4c2f76c58916ec258f246851bea091d14d4247a2fc3e18694461b1816c757' },
      ])
    }
    await loadSemesterConfigToCache()
  } catch (e) {
    console.warn('Supabase unavailable, using local fallback')
    setSemesterCache({
      semesterStart: '2026-02-25',
      teachingWeeks: 15,
      examWeeks: 2,
      holidays: DEFAULT_HOLIDAYS,
      makeupDays: DEFAULT_MAKEUP_DAYS,
    })
  }
}

async function loadSemesterConfigToCache() {
  try {
    const { data } = await supabase.from('semester_config').select('key, value')
    if (!data || data.length === 0) return
    const map = new Map(data.map((r: { key: string; value: string }) => [r.key, r.value]))
    setSemesterCache({
      semesterStart: map.get('semester_start') ?? '2026-02-25',
      teachingWeeks: parseInt(map.get('teaching_weeks') ?? '15'),
      examWeeks: parseInt(map.get('exam_weeks') ?? '2'),
      holidays: JSON.parse(map.get('holidays') ?? '[]') as Holiday[],
      makeupDays: JSON.parse(map.get('makeup_days') ?? '[]') as MakeupDay[],
    })
  } catch (e) {
    console.warn('Failed to load semester config from Supabase')
  }
}

// ---------- Courses ----------

export async function getCourses(): Promise<Course[]> {
  const cached = getCached<Course[]>('courses')
  if (cached) return cached
  await ensureSeedData()
  try {
    const { data } = await supabase.from('courses').select('*').order('id')
    const result = data ?? COURSES
    setCache('courses', result)
    return result
  } catch (e) {
    console.warn('Using local courses data')
    setCache('courses', COURSES)
    return COURSES
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    const { data } = await supabase.from('courses').select('*').eq('id', id).single()
    return data
  } catch (e) {
    return COURSES.find(c => c.id === id) || null
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  try {
    const { data } = await supabase.from('courses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (data) invalidateCache('courses')
    return data
  } catch (e) {
    console.error('updateCourse error:', e)
    return null
  }
}

export async function deleteCourse(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (!error) invalidateCache('courses')
    return !error
  } catch (e) {
    console.error('deleteCourse error:', e)
    return false
  }
}

export async function createCourse(input: Omit<Course, 'id'>): Promise<Course | null> {
  try {
    const record = { ...input, id: genId() }
    const { data, error } = await supabase.from('courses').insert(record).select().single()
    if (error) { console.error('createCourse error:', error); return null }
    invalidateCache('courses')
    return data
  } catch (e) {
    console.error('createCourse error:', e)
    return null
  }
}

// ---------- Schedules ----------

export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  const cacheKey = courseId ? `schedules_${courseId}` : 'schedules_all'
  const cached = getCached<CourseSchedule[]>(cacheKey)
  if (cached) return cached
  await ensureSeedData()
  try {
    let query = supabase.from('course_schedules').select('*')
    if (courseId) query = query.eq('course_id', courseId)
    const { data } = await query
    const result = data ?? SCHEDULES
    setCache(cacheKey, result)
    return result
  } catch (e) {
    console.warn('Using local schedules data')
    const result = courseId ? SCHEDULES.filter(s => s.course_id === courseId) : SCHEDULES
    setCache(cacheKey, result)
    return result
  }
}

export async function createSchedule(input: Omit<CourseSchedule, 'id'>): Promise<CourseSchedule | null> {
  try {
    const record = { ...input, id: genId() }
    const { data, error } = await supabase.from('course_schedules').insert(record).select().single()
    if (error) { console.error('createSchedule error:', error); return null }
    invalidateCache('schedules')
    return data
  } catch (e) {
    console.error('createSchedule error:', e)
    return null
  }
}

export async function updateSchedule(id: string, updates: Partial<CourseSchedule>): Promise<CourseSchedule | null> {
  try {
    const { data } = await supabase.from('course_schedules').update(updates).eq('id', id).select().single()
    if (data) invalidateCache('schedules')
    return data
  } catch (e) {
    console.error('updateSchedule error:', e)
    return null
  }
}

export async function deleteSchedule(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('course_schedules').delete().eq('id', id)
    if (!error) invalidateCache('schedules')
    return !error
  } catch (e) {
    console.error('deleteSchedule error:', e)
    return false
  }
}

// ---------- Assignments ----------

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  const cacheKey = courseId ? `assignments_${courseId}` : 'assignments_all'
  const cached = getCached<Assignment[]>(cacheKey)
  if (cached) return cached
  try {
    let query = supabase.from('assignments').select('*').order('due_date', { ascending: true })
    if (courseId) query = query.eq('course_id', courseId)
    const { data } = await query
    const result = data ?? []
    setCache(cacheKey, result)
    return result
  } catch (e) {
    console.warn('Using local assignments data')
    const result = courseId ? localStorage.assignments.filter(a => a.course_id === courseId) : localStorage.assignments
    setCache(cacheKey, result)
    return result
  }
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment | null> {
  try {
    const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('assignments').insert(record).select().single()
    if (error) { console.error('createAssignment error:', error); return null }
    invalidateCache('assignments')
    return data
  } catch (e) {
    const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    localStorage.assignments.push(record)
    invalidateCache('assignments')
    return record
  }
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
  try {
    const { data } = await supabase.from('assignments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (data) invalidateCache('assignments')
    return data
  } catch (e) {
    const index = localStorage.assignments.findIndex(a => a.id === id)
    if (index !== -1) {
      localStorage.assignments[index] = { ...localStorage.assignments[index], ...updates, updated_at: new Date().toISOString() }
      invalidateCache('assignments')
      return localStorage.assignments[index]
    }
    return null
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (!error) invalidateCache('assignments')
    return !error
  } catch (e) {
    localStorage.assignments = localStorage.assignments.filter(a => a.id !== id)
    invalidateCache('assignments')
    return true
  }
}

// ---------- Memos ----------

export async function getMemos(courseId?: string): Promise<Memo[]> {
  const cacheKey = courseId ? `memos_${courseId}` : 'memos_all'
  const cached = getCached<Memo[]>(cacheKey)
  if (cached) return cached
  try {
    let query = supabase.from('memos').select('*').order('created_at', { ascending: false })
    if (courseId) query = query.eq('course_id', courseId)
    const { data } = await query
    const result = data ?? []
    setCache(cacheKey, result)
    return result
  } catch (e) {
    console.warn('Using local memos data')
    const result = courseId ? localStorage.memos.filter(m => m.course_id === courseId) : localStorage.memos
    setCache(cacheKey, result)
    return result
  }
}

export async function createMemo(input: Omit<Memo, 'id' | 'created_at'>): Promise<Memo | null> {
  try {
    const record = { ...input, id: genId(), created_at: new Date().toISOString() }
    const { data, error } = await supabase.from('memos').insert(record).select().single()
    if (error) { console.error('createMemo error:', error); return null }
    invalidateCache('memos')
    return data
  } catch (e) {
    const record = { ...input, id: genId(), created_at: new Date().toISOString() }
    localStorage.memos.push(record)
    invalidateCache('memos')
    return record
  }
}

export async function deleteMemo(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('memos').delete().eq('id', id)
    if (!error) invalidateCache('memos')
    return !error
  } catch (e) {
    localStorage.memos = localStorage.memos.filter(m => m.id !== id)
    invalidateCache('memos')
    return true
  }
}

// ---------- Schedule Overrides ----------

export async function getScheduleOverrides(date: string): Promise<ScheduleOverride[]> {
  const cacheKey = `overrides_${date}`
  const cached = getCached<ScheduleOverride[]>(cacheKey)
  if (cached) return cached
  try {
    const { data } = await supabase.from('schedule_overrides').select('*').eq('date', date)
    const result = data ?? []
    setCache(cacheKey, result)
    return result
  } catch (e) {
    console.warn('Using local schedule overrides data')
    const result = localStorage.scheduleOverrides.filter(o => o.date === date)
    setCache(cacheKey, result)
    return result
  }
}

export async function createScheduleOverride(input: { schedule_id: string; date: string; type: 'cancelled' | 'ended_early' }): Promise<ScheduleOverride | null> {
  try {
    const { data, error } = await supabase.from('schedule_overrides').upsert(
      { ...input, id: genId(), created_at: new Date().toISOString() },
      { onConflict: 'schedule_id,date' }
    ).select().single()
    if (error) { console.error('createScheduleOverride error:', error); return null }
    invalidateCache('overrides')
    return data
  } catch (e) {
    const existingIndex = localStorage.scheduleOverrides.findIndex(o => o.schedule_id === input.schedule_id && o.date === input.date)
    const record = { ...input, id: genId(), created_at: new Date().toISOString() }
    if (existingIndex !== -1) {
      localStorage.scheduleOverrides[existingIndex] = record
    } else {
      localStorage.scheduleOverrides.push(record)
    }
    invalidateCache('overrides')
    return record
  }
}

export async function deleteScheduleOverride(scheduleId: string, date: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('schedule_overrides').delete().eq('schedule_id', scheduleId).eq('date', date)
    if (!error) invalidateCache('overrides')
    return !error
  } catch (e) {
    localStorage.scheduleOverrides = localStorage.scheduleOverrides.filter(o => !(o.schedule_id === scheduleId && o.date === date))
    invalidateCache('overrides')
    return true
  }
}
