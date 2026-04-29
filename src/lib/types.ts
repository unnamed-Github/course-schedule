export interface Course {
  id: string
  name: string
  teacher: string
  classroom: string
  color: string
  week_type: 'all' | 'odd' | 'even'
  order?: number
}

export interface CourseSchedule {
  id: string
  course_id: string
  day_of_week: number
  start_period: number
  end_period: number
  location: string
  week_type: 'all' | 'odd' | 'even'
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'submitted'
  created_at: string
}

export type MoodTag = '⭐喜欢' | '🥱苟住' | '💪硬扛' | '🌈期待'

export interface Memo {
  id: string
  course_id: string
  content: string
  mood_emoji: string
  mood_tags?: MoodTag[]
  created_at: string
}

export interface CourseWithSchedules extends Course {
  schedules: CourseSchedule[]
  assignments: Assignment[]
  memos: Memo[]
}
