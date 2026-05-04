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
  schedule_id?: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'submitted'
  reminders?: number[]
  created_at: string
  updated_at?: string
}

export const DDL_REMINDER_OPTIONS = [
  { value: 30, label: '30分钟前' },
  { value: 60, label: '1小时前' },
  { value: 180, label: '3小时前' },
  { value: 1440, label: '1天前' },
  { value: 4320, label: '3天前' },
]

export const MOOD_TAGS = [
  { value: '⭐喜欢' as const, emoji: '⭐', label: '喜欢', color: '#F59E0B' },
  { value: '🥱苟住' as const, emoji: '🥱', label: '苟住', color: '#6B7280' },
  { value: '💪硬扛' as const, emoji: '💪', label: '硬扛', color: '#EF4444' },
  { value: '🌈期待' as const, emoji: '🌈', label: '期待', color: '#10B981' },
]

export type MoodTag = (typeof MOOD_TAGS)[number]['value']

export function getMoodColor(tag: MoodTag): string {
  return MOOD_TAGS.find((t) => t.value === tag)?.color ?? '#6B7280'
}

export interface Memo {
  id: string
  course_id: string
  schedule_id?: string
  content: string
  mood_emoji: string
  mood_tags?: MoodTag[]
  created_at: string
}

export interface ScheduleOverride {
  id: string
  schedule_id: string
  date: string
  type: 'cancelled' | 'ended_early'
  created_at?: string
}

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'drizzle' | 'thunderstorm' | 'mist'

export interface WeatherData {
  temp: number
  feelsLike: number
  tempMin: number
  tempMax: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  condition: WeatherCondition
}

export type UVLevel = 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme'

export interface UVData {
  index: number
  level: UVLevel
}

export type AQILevelCN = 'good' | 'moderate' | 'unhealthySensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous'

export interface AQIData {
  aqi: number
  pm25: number
  pm10: number
  level: AQILevelCN
}

export interface WeatherResponse {
  weather: WeatherData
  uv: UVData
  aqi: AQIData
}

export const WEATHER_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: '北京', lat: 39.9, lon: 116.4 },
  { name: '上海', lat: 31.23, lon: 121.47 },
  { name: '广州', lat: 23.13, lon: 113.26 },
  { name: '深圳', lat: 22.54, lon: 114.06 },
  { name: '杭州', lat: 30.27, lon: 120.15 },
  { name: '成都', lat: 30.57, lon: 104.07 },
  { name: '武汉', lat: 30.58, lon: 114.30 },
  { name: '南京', lat: 32.06, lon: 118.80 },
  { name: '西安', lat: 34.26, lon: 108.94 },
  { name: '重庆', lat: 29.56, lon: 106.55 },
]

