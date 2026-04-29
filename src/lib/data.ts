import { supabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo } from './types'
import { COURSES, SCHEDULES } from './seed-data'

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
  const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true })
  if (count === 0) {
    await supabase.from('courses').insert(COURSES)
    await supabase.from('course_schedules').insert(SCHEDULES)
    await supabase.from('semester_config').insert([
      { key: 'semester_start', value: '2026-02-25' },
      { key: 'teaching_weeks', value: '15' },
      { key: 'exam_weeks', value: '2' },
      { key: 'holidays', value: JSON.stringify([
        { name: '清明节', start: '2026-04-05', end: '2026-04-05' },
        { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
        { name: '端午节', start: '2026-06-19', end: '2026-06-19' },
      ]) },
      { key: 'makeup_days', value: JSON.stringify([
        { date: '2026-02-28', replacesDayOfWeek: 1, weekType: 'all' },
        { date: '2026-05-09', replacesDayOfWeek: 2, weekType: 'odd' },
      ]) },
    ])
  }
}

// ---------- Courses ----------

export async function getCourses(): Promise<Course[]> {
  const cached = getCached<Course[]>('courses')
  if (cached) return cached
  await ensureSeedData()
  const { data } = await supabase.from('courses').select('*').order('id')
  const result = data ?? []
  setCache('courses', result)
  return result
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data } = await supabase.from('courses').select('*').eq('id', id).single()
  return data
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  const { data } = await supabase.from('courses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (data) invalidateCache('courses')
  return data
}

export async function deleteCourse(id: string): Promise<boolean> {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  invalidateCache('courses')
  return !error
}

// ---------- Schedules ----------

export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  const cacheKey = courseId ? `schedules_${courseId}` : 'schedules_all'
  const cached = getCached<CourseSchedule[]>(cacheKey)
  if (cached) return cached
  await ensureSeedData()
  let query = supabase.from('course_schedules').select('*')
  if (courseId) query = query.eq('course_id', courseId)
  const { data } = await query
  const result = data ?? []
  setCache(cacheKey, result)
  return result
}

// ---------- Assignments ----------

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  let query = supabase.from('assignments').select('*').order('due_date', { ascending: true })
  if (courseId) query = query.eq('course_id', courseId)
  const { data } = await query
  return data ?? []
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data } = await supabase.from('assignments').insert(record).select().single()
  return data!
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
  const { data } = await supabase.from('assignments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return data
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  return !error
}

// ---------- Memos ----------

export async function getMemos(courseId?: string): Promise<Memo[]> {
  let query = supabase.from('memos').select('*').order('created_at', { ascending: false })
  if (courseId) query = query.eq('course_id', courseId)
  const { data } = await query
  return data ?? []
}

export async function createMemo(input: Omit<Memo, 'id' | 'created_at'>): Promise<Memo> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString() }
  const { data } = await supabase.from('memos').insert(record).select().single()
  return data!
}

export async function deleteMemo(id: string): Promise<boolean> {
  const { error } = await supabase.from('memos').delete().eq('id', id)
  return !error
}
