import { getSupabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo } from './types'
import { COURSES, SCHEDULES } from './seed-data'

const s = () => getSupabase()

function genId() {
  return crypto.randomUUID()
}

async function syncSeedData() {
  const { count } = await s().from('courses').select('*', { count: 'exact', head: true })
  if (count === 0) {
    await s().from('courses').insert(COURSES)
    await s().from('course_schedules').insert(SCHEDULES)
    await s().from('semester_config').insert([
      { key: 'semester_start', value: '2026-02-25' },
      { key: 'teaching_weeks', value: '15' },
      { key: 'exam_weeks', value: '2' },
      { key: 'holidays', value: JSON.stringify([{ name: '清明节', start: '2026-04-05', end: '2026-04-05' }, { name: '劳动节', start: '2026-05-01', end: '2026-05-05' }, { name: '端午节', start: '2026-06-19', end: '2026-06-19' }]) },
      { key: 'makeup_days', value: JSON.stringify([{ date: '2026-02-28', replacesDayOfWeek: 1, weekType: 'all' }, { date: '2026-05-09', replacesDayOfWeek: 2, weekType: 'odd' }]) },
    ])
    return
  }
  for (const course of COURSES) {
    await s().from('courses').upsert(course, { onConflict: 'id' })
  }
  for (const schedule of SCHEDULES) {
    await s().from('course_schedules').upsert(schedule, { onConflict: 'id' })
  }
}

let seedPromise: Promise<void> | null = null

function ensureSeedOnce() {
  if (!seedPromise) seedPromise = syncSeedData().catch(() => { seedPromise = null })
  return seedPromise
}

// ---------- Courses ----------

export async function getCourses(): Promise<Course[]> {
  await ensureSeedOnce()
  const { data, error } = await s().from('courses').select('*')
  if (error) { console.error('getCourses error:', error); return [] }
  return (data ?? []).sort((a: Course, b: Course) => (a.order ?? 99) - (b.order ?? 99))
}

export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await s().from('courses').select('*').eq('id', id).single()
  if (error) { console.error('getCourse error:', error); return null }
  return data
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  const { data, error } = await s()
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateCourse error:', error); return null }
  return data
}

export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  await ensureSeedOnce()
  let query = s().from('course_schedules').select('*')
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) { console.error('getSchedules error:', error); return [] }
  return data ?? []
}

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  let query = s().from('assignments').select('*').order('due_date', { ascending: true })
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) { console.error('getAssignments error:', error); return [] }
  return data ?? []
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await s().from('assignments').insert(record).select().single()
  if (error || !data) throw new Error(error?.message ?? '创建作业失败')
  return data
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
  const { data, error } = await s()
    .from('assignments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateAssignment error:', error); return null }
  return data
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const { error } = await s().from('assignments').delete().eq('id', id)
  return !error
}

export async function getMemos(courseId?: string): Promise<Memo[]> {
  let query = s().from('memos').select('*').order('created_at', { ascending: false })
  if (courseId) query = query.eq('course_id', courseId)
  const { data, error } = await query
  if (error) { console.error('getMemos error:', error); return [] }
  return data ?? []
}

export async function createMemo(input: Omit<Memo, 'id' | 'created_at'>): Promise<Memo> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString() }
  const { data, error } = await s().from('memos').insert(record).select().single()
  if (error || !data) throw new Error(error?.message ?? '创建备忘失败')
  return data
}

export async function deleteMemo(id: string): Promise<boolean> {
  const { error } = await s().from('memos').delete().eq('id', id)
  return !error
}
