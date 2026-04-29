import { Course, CourseSchedule } from './types'

export const COURSES: Course[] = [
  { id: 'c1', name: '线性代数', teacher: '陈懿茂', classroom: '智华106', color: '#D4856B', week_type: 'all' },
  { id: 'c2', name: '电路基础', teacher: '高振', classroom: '一教327', color: '#7D9346', week_type: 'all' },
  { id: 'c3', name: '网球', teacher: '白波', classroom: '欣园网球场', color: '#C4915C', week_type: 'all' },
  { id: 'c4', name: '高等数学（下）', teacher: '刘博辰', classroom: '智华206', color: '#B5654B', week_type: 'all' },
  { id: 'c5', name: '高等数学（下）习题课', teacher: '助教孙露露', classroom: '一教406', color: '#A7B99A', week_type: 'all' },
  { id: 'c6', name: '大学物理（下）', teacher: '陈伟强', classroom: '智华107', color: '#D4856B', week_type: 'all' },
  { id: 'c7', name: '书院教育', teacher: '—', classroom: '—', color: '#8B7E6F', week_type: 'all' },
  { id: 'c8', name: '生命科学概论', teacher: '—', classroom: '一教325', color: '#C4915C', week_type: 'odd' },
  { id: 'c9', name: '习近平思想概论', teacher: '杨少曼', classroom: '智华108', color: '#B5654B', week_type: 'all' },
  { id: 'c10', name: '写作与交流', teacher: '袁博', classroom: '智华401', color: '#7D9346', week_type: 'all' },
  { id: 'c11', name: '马原基本原理', teacher: '杨晗旭', classroom: '智华107', color: '#A7B99A', week_type: 'all' },
  { id: 'c12', name: '线性代数习题课', teacher: '助教刘吉宇', classroom: '智华202', color: '#D4856B', week_type: 'all' },
  { id: 'c13', name: '乐团排练', teacher: '—', classroom: '—', color: '#E8D5C4', week_type: 'all' },
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
  { id: 's11', course_id: 'c8', day_of_week: 3, start_period: 7, end_period: 8, location: '一教325', week_type: 'odd' },
  { id: 's12', course_id: 'c8', day_of_week: 5, start_period: 5, end_period: 6, location: '一教325', week_type: 'odd' },
  { id: 's13', course_id: 'c9', day_of_week: 1, start_period: 7, end_period: 8, location: '智华108', week_type: 'all' },
  { id: 's14', course_id: 'c10', day_of_week: 1, start_period: 9, end_period: 10, location: '智华401', week_type: 'all' },
  { id: 's15', course_id: 'c11', day_of_week: 2, start_period: 9, end_period: 10, location: '智华107', week_type: 'all' },
  { id: 's16', course_id: 'c12', day_of_week: 4, start_period: 9, end_period: 10, location: '智华202', week_type: 'all' },
  { id: 's17', course_id: 'c13', day_of_week: 1, start_period: 11, end_period: 11, location: '—', week_type: 'all' },
  { id: 's18', course_id: 'c13', day_of_week: 4, start_period: 11, end_period: 11, location: '—', week_type: 'all' },
]
