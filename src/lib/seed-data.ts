import { Course, CourseSchedule } from './types'

export const COURSES: Course[] = [
  { id: 'c1', name: '线性代数', teacher: '陈懿茂', classroom: '智华106', color: '#4F46E5', week_type: 'all', order: 1 },
  { id: 'c2', name: '电路基础', teacher: '高振', classroom: '一教327', color: '#0891B2', week_type: 'all', order: 2 },
  { id: 'c3', name: '网球', teacher: '白波', classroom: '欣园网球场', color: '#7C3AED', week_type: 'all', order: 3 },
  { id: 'c4', name: '高等数学（下）', teacher: '刘博辰', classroom: '智华206', color: '#D97706', week_type: 'all', order: 4 },
  { id: 'c5', name: '高等数学（下）习题课', teacher: '助教孙露露', classroom: '一教406', color: '#F59E0B', week_type: 'all', order: 5 },
  { id: 'c6', name: '大学物理（下）', teacher: '陈伟强', classroom: '智华107', color: '#059669', week_type: 'all', order: 6 },
  { id: 'c7', name: '书院教育', teacher: '—', classroom: '—', color: '#BE185D', week_type: 'all', order: 7 },
  { id: 'c8', name: '生命科学概论', teacher: '—', classroom: '一教325', color: '#DC2626', week_type: 'odd', order: 8 },
  { id: 'c9', name: '习近平思想概论', teacher: '杨少曼', classroom: '智华108', color: '#9D174D', week_type: 'all', order: 9 },
  { id: 'c10', name: '写作与交流', teacher: '袁博', classroom: '智华401', color: '#2563EB', week_type: 'all', order: 10 },
  { id: 'c11', name: '马原基本原理', teacher: '杨晗旭', classroom: '智华107', color: '#B91C1C', week_type: 'all', order: 11 },
  { id: 'c12', name: '线性代数习题课', teacher: '助教刘吉宇', classroom: '智华202', color: '#6366F1', week_type: 'all', order: 12 },
  { id: 'c13', name: '乐团排练', teacher: '—', classroom: '—', color: '#9333EA', week_type: 'all', order: 13 },
]

export const SCHEDULES: CourseSchedule[] = [
  { id: 's1', course_id: 'c1', day_of_week: 2, start_period: 1, end_period: 2, location: '智华106', week_type: 'all' },
  { id: 's2', course_id: 'c1', day_of_week: 4, start_period: 3, end_period: 4, location: '智华106', week_type: 'all' },
  { id: 's3', course_id: 'c2', day_of_week: 1, start_period: 3, end_period: 4, location: '一教327', week_type: 'all' },
  { id: 's4', course_id: 'c3', day_of_week: 3, start_period: 3, end_period: 4, location: '欣园网球场', week_type: 'all' },
  { id: 's5', course_id: 'c4', day_of_week: 2, start_period: 5, end_period: 6, location: '智华206', week_type: 'all' },
  { id: 's6', course_id: 'c4', day_of_week: 5, start_period: 7, end_period: 8, location: '智华206', week_type: 'all' },
  { id: 's7', course_id: 'c5', day_of_week: 5, start_period: 3, end_period: 4, location: '一教406', week_type: 'all' },
  { id: 's8', course_id: 'c6', day_of_week: 1, start_period: 5, end_period: 6, location: '智华107', week_type: 'all' },
  { id: 's9', course_id: 'c6', day_of_week: 3, start_period: 5, end_period: 6, location: '智华107', week_type: 'all' },
  { id: 's10', course_id: 'c7', day_of_week: 4, start_period: 5, end_period: 8, location: '—', week_type: 'all' },
  { id: 's11', course_id: 'c8', day_of_week: 3, start_period: 7, end_period: 8, location: '一教325', week_type: 'all' },
  { id: 's12', course_id: 'c8', day_of_week: 5, start_period: 5, end_period: 6, location: '一教325', week_type: 'odd' },
  { id: 's13', course_id: 'c9', day_of_week: 1, start_period: 7, end_period: 8, location: '智华108', week_type: 'all' },
  { id: 's14', course_id: 'c10', day_of_week: 1, start_period: 9, end_period: 10, location: '智华401', week_type: 'all' },
  { id: 's15', course_id: 'c11', day_of_week: 2, start_period: 9, end_period: 10, location: '智华107', week_type: 'all' },
  { id: 's16', course_id: 'c12', day_of_week: 4, start_period: 9, end_period: 10, location: '智华202', week_type: 'all' },
  { id: 's17', course_id: 'c13', day_of_week: 1, start_period: 11, end_period: 11, location: '—', week_type: 'all' },
  { id: 's18', course_id: 'c13', day_of_week: 4, start_period: 11, end_period: 11, location: '—', week_type: 'all' },
]
