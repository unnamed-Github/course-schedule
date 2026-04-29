import { getSupabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo } from './types'
import { COURSES, SCHEDULES } from './seed-data'

const s = () => getSupabase()
const DEFAULT_SORT_ORDER = 99

// ---- Cache layer ----
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
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

// Invalidate cache after mutations
function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

// ---- Seed data ----
async function ensureSeedData() {
  try {
    const { count } = await s().from('courses').select('*', { count: 'exact', head: true })
    if (count === 0) {
      await s().from('courses').insert(COURSES)
      await s().from('course_schedules').insert(SCHEDULES)
      await s().from('semester_config').insert([
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
  } catch (e) {
    console.error('ensureSeedData failed:', e)
  }
}

function genId() { return crypto.randomUUID() }

// ---- Courses ----
export async function getCourses(): Promise<Course[]> {
  const cached = getCached<Course[]>('courses')
  if (cached) return cached
  try {
    await ensureSeedData()
    const { data, error } = await s().from('courses').select('*')
    if (error) { console.error('getCourses error:', error); return [] }
    const result = (data ?? []).sort((a: Course, b: Course) => (a.order ?? DEFAULT_SORT_ORDER) - (b.order ?? DEFAULT_SORT_ORDER))
    setCache('courses', result)
    return result
  } catch (e) { console.error('getCourses exception:', e); return [] }
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    await ensureSeedData()
    const { data, error } = await s().from('courses').select('*').eq('id', id).single()
    if (error) { console.error('getCourse error:', error); return null }
    return data
  } catch (e) { console.error('getCourse exception:', e); return null }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  try {
    const { data, error } = await s().from('courses').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) { console.error('updateCourse error:', error); return null }
    invalidateCache('courses')
    return data
  } catch (e) { console.error('updateCourse exception:', e); return null }
}

// ---- Schedules ----
export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  const cacheKey = courseId ? `schedules_${courseId}` : 'schedules_all'
  const cached = getCached<CourseSchedule[]>(cacheKey)
  if (cached) return cached
  try {
    await ensureSeedData()
    let query = s().from('course_schedules').select('*')
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getSchedules error:', error); return [] }
    const result = data ?? []
    setCache(cacheKey, result)
    return result
  } catch (e) { console.error('getSchedules exception:', e); return [] }
}

// ---- Assignments ----
export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  try {
    let query = s().from('assignments').select('*').order('due_date', { ascending: true })
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getAssignments error:', error); return [] }
    return data ?? []
  } catch (e) { console.error('getAssignments exception:', e); return [] }
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  try {
    const { data, error } = await s().from('assignments').insert(record).select().single()
    if (error || !data) throw new Error(error?.message ?? '创建作业失败：未返回数据')
    return data
  } catch (e) { console.error('createAssignment exception:', e); throw e }
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
  try {
    const { data, error } = await s().from('assignments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) { console.error('updateAssignment error:', error); return null }
    return data
  } catch (e) { console.error('updateAssignment exception:', e); return null }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const { error } = await s().from('assignments').delete().eq('id', id)
    return !error
  } catch (e) { console.error('deleteAssignment exception:', e); return false }
}

// ---- Memos ----
export async function getMemos(courseId?: string): Promise<Memo[]> {
  try {
    let query = s().from('memos').select('*').order('created_at', { ascending: false })
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getMemos error:', error); return [] }
    return data ?? []
  } catch (e) { console.error('getMemos exception:', e); return [] }
}

export async function createMemo(input: Omit<Memo, 'id' | 'created_at'>): Promise<Memo> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString() }
  try {
    const { data, error } = await s().from('memos').insert(record).select().single()
    if (error || !data) throw new Error(error?.message ?? '创建备忘失败：未返回数据')
    return data
  } catch (e) { console.error('createMemo exception:', e); throw e }
}

export async function deleteMemo(id: string): Promise<boolean> {
  try {
    const { error } = await s().from('memos').delete().eq('id', id)
    return !error
  } catch (e) { console.error('deleteMemo exception:', e); return false }
}
