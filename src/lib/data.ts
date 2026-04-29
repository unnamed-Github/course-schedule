import { getSupabase } from './supabase'
import { Course, CourseSchedule, Assignment, Memo } from './types'

const s = () => getSupabase()

const DEFAULT_SORT_ORDER = 99

function genId() {
  return crypto.randomUUID()
}

export async function getCourses(): Promise<Course[]> {
  try {
    const { data, error } = await s().from('courses').select('*')
    if (error) { console.error('getCourses error:', error); return [] }
    return (data ?? []).sort((a: Course, b: Course) => (a.order ?? DEFAULT_SORT_ORDER) - (b.order ?? DEFAULT_SORT_ORDER))
  } catch (e) {
    console.error('getCourses exception:', e)
    return []
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    const { data, error } = await s().from('courses').select('*').eq('id', id).single()
    if (error) { console.error('getCourse error:', error); return null }
    return data
  } catch (e) {
    console.error('getCourse exception:', e)
    return null
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
  try {
    const { data, error } = await s()
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('updateCourse error:', error); return null }
    return data
  } catch (e) {
    console.error('updateCourse exception:', e)
    return null
  }
}

export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  try {
    let query = s().from('course_schedules').select('*')
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getSchedules error:', error); return [] }
    return data ?? []
  } catch (e) {
    console.error('getSchedules exception:', e)
    return []
  }
}

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  try {
    let query = s().from('assignments').select('*').order('due_date', { ascending: true })
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getAssignments error:', error); return [] }
    return data ?? []
  } catch (e) {
    console.error('getAssignments exception:', e)
    return []
  }
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  try {
    const { data, error } = await s().from('assignments').insert(record).select().single()
    if (error || !data) throw new Error(error?.message ?? '创建作业失败：未返回数据')
    return data
  } catch (e) {
    console.error('createAssignment exception:', e)
    throw e
  }
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | null> {
  try {
    const { data, error } = await s()
      .from('assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('updateAssignment error:', error); return null }
    return data
  } catch (e) {
    console.error('updateAssignment exception:', e)
    return null
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    const { error } = await s().from('assignments').delete().eq('id', id)
    return !error
  } catch (e) {
    console.error('deleteAssignment exception:', e)
    return false
  }
}

export async function getMemos(courseId?: string): Promise<Memo[]> {
  try {
    let query = s().from('memos').select('*').order('created_at', { ascending: false })
    if (courseId) query = query.eq('course_id', courseId)
    const { data, error } = await query
    if (error) { console.error('getMemos error:', error); return [] }
    return data ?? []
  } catch (e) {
    console.error('getMemos exception:', e)
    return []
  }
}

export async function createMemo(input: Omit<Memo, 'id' | 'created_at'>): Promise<Memo> {
  const record = { ...input, id: genId(), created_at: new Date().toISOString() }
  try {
    const { data, error } = await s().from('memos').insert(record).select().single()
    if (error || !data) throw new Error(error?.message ?? '创建备忘失败：未返回数据')
    return data
  } catch (e) {
    console.error('createMemo exception:', e)
    throw e
  }
}

export async function deleteMemo(id: string): Promise<boolean> {
  try {
    const { error } = await s().from('memos').delete().eq('id', id)
    return !error
  } catch (e) {
    console.error('deleteMemo exception:', e)
    return false
  }
}
