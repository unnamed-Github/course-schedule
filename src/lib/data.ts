import { getSupabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo } from './types'

const s = () => getSupabase()

function genId() {
  return crypto.randomUUID()
}

export async function getCourses(): Promise<Course[]> {
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
  if (error) throw error
  return data!
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
  if (error) throw error
  return data!
}

export async function deleteMemo(id: string): Promise<boolean> {
  const { error } = await s().from('memos').delete().eq('id', id)
  return !error
}
