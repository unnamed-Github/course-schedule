import { Course, CourseSchedule, Assignment, Memo } from './types'
import { COURSES, SCHEDULES } from './seed-data'

const assignments: Assignment[] = []
const memos: Memo[] = []

function genId() {
  return crypto.randomUUID()
}

export async function getCourses(): Promise<Course[]> {
  return COURSES
}

export async function getCourse(id: string): Promise<Course | null> {
  return COURSES.find((c) => c.id === id) ?? null
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<Course | null> {
  const idx = COURSES.findIndex((c) => c.id === id)
  if (idx === -1) return null
  COURSES[idx] = { ...COURSES[idx], ...data }
  return COURSES[idx]
}

export async function getSchedules(courseId?: string): Promise<CourseSchedule[]> {
  if (courseId) return SCHEDULES.filter((s) => s.course_id === courseId)
  return SCHEDULES
}

export async function getCourseWithSchedules(courseId: string) {
  const course = await getCourse(courseId)
  if (!course) return null
  const schedules = await getSchedules(courseId)
  return { ...course, schedules }
}

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  if (courseId) return assignments.filter((a) => a.course_id === courseId)
  return assignments
}

export async function createAssignment(data: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment> {
  const a: Assignment = { ...data, id: genId(), created_at: new Date().toISOString() }
  assignments.push(a)
  return a
}

export async function updateAssignment(id: string, data: Partial<Assignment>): Promise<Assignment | null> {
  const idx = assignments.findIndex((a) => a.id === id)
  if (idx === -1) return null
  assignments[idx] = { ...assignments[idx], ...data }
  return assignments[idx]
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const idx = assignments.findIndex((a) => a.id === id)
  if (idx === -1) return false
  assignments.splice(idx, 1)
  return true
}

export async function getMemos(courseId?: string): Promise<Memo[]> {
  if (courseId) return memos.filter((m) => m.course_id === courseId)
  return memos
}

export async function createMemo(data: Omit<Memo, 'id' | 'created_at'>): Promise<Memo> {
  const m: Memo = { ...data, id: genId(), created_at: new Date().toISOString() }
  memos.push(m)
  return m
}

export async function deleteMemo(id: string): Promise<boolean> {
  const idx = memos.findIndex((m) => m.id === id)
  if (idx === -1) return false
  memos.splice(idx, 1)
  return true
}
