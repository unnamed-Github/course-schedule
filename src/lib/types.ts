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

export function formatReminderLabel(minutes: number): string {
  const preset = DDL_REMINDER_OPTIONS.find(o => o.value === minutes)
  if (preset) return preset.label
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) {
    const h = minutes / 60
    return Number.isInteger(h) ? `${h}小时前` : `${(h).toFixed(1)}小时前`
  }
  const d = minutes / 1440
  return Number.isInteger(d) ? `${d}天前` : `${(d).toFixed(1)}天前`
}

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
  tomorrow?: WeatherData
}

export const WEATHER_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: '北京大学', lat: 39.99, lon: 116.31 },
  { name: '复旦大学', lat: 31.30, lon: 121.50 },
  { name: '中山大学', lat: 23.10, lon: 113.30 },
  { name: '南方科技大学', lat: 22.58, lon: 113.99 },
  { name: '浙江大学', lat: 30.26, lon: 120.13 },
  { name: '四川大学', lat: 30.63, lon: 104.09 },
  { name: '武汉大学', lat: 30.54, lon: 114.36 },
  { name: '南京大学', lat: 32.06, lon: 118.78 },
  { name: '西安交大', lat: 34.24, lon: 108.98 },
  { name: '重庆大学', lat: 29.57, lon: 106.47 },
]

