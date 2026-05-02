export const EMOJI_OPTIONS = ['📝', '💡', '🤔', '😊', '😤', '💪', '🎉', '📖', '✨', '⚠️']

export const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

export const DAY_LABELS: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日',
}

export const DAY_MAP: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日',
}

export const WEEK_TYPE_SHORT: Record<string, string> = {
  all: '',
  odd: '（单周）',
  even: '（双周）',
}

export const PERIOD_GROUP_DEFS = [
  { label: '1-2节', start: 1, end: 2 },
  { label: '3-4节', start: 3, end: 4 },
  { label: '5-6节', start: 5, end: 6 },
  { label: '7-8节', start: 7, end: 8 },
  { label: '9-10节', start: 9, end: 10 },
  { label: '11节', start: 11, end: 11 },
]

export function countdown(targetDate: string): { days: number; hours: number; minutes: number } {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes }
}
