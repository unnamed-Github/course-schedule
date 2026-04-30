export interface Festival {
  month: number
  day: number
  emoji: string
  greeting: string
  subGreeting: string
}

export const FESTIVALS: Festival[] = [
  { month: 1, day: 1, emoji: '🎆', greeting: '新年快乐！', subGreeting: '新学期新开始' },
  { month: 2, day: 14, emoji: '🌸', greeting: '今天也要好好上课哦', subGreeting: '爱与学习并存' },
  { month: 3, day: 8, emoji: '💐', greeting: '妇女节快乐！', subGreeting: '致敬每一位她' },
  { month: 4, day: 1, emoji: '🤪', greeting: '愚人节快乐！', subGreeting: '今天的课表可不是开玩笑的' },
  { month: 5, day: 1, emoji: '✊', greeting: '劳动节快乐！', subGreeting: '劳动最光荣' },
  { month: 5, day: 4, emoji: '🔥', greeting: '青年节快乐！', subGreeting: '青春正当时' },
  { month: 6, day: 1, emoji: '🎈', greeting: '六一快乐！', subGreeting: '永葆童心' },
  { month: 9, day: 10, emoji: '🎓', greeting: '教师节快乐！', subGreeting: '感恩每一位老师' },
  { month: 10, day: 1, emoji: '🇨🇳', greeting: '国庆快乐！', subGreeting: '祝祖国繁荣昌盛' },
  { month: 10, day: 31, emoji: '🎃', greeting: '不给糖就捣蛋！', subGreeting: '万圣节快乐' },
  { month: 12, day: 25, emoji: '🎄', greeting: 'Merry Christmas！', subGreeting: '圣诞快乐' },
  { month: 12, day: 31, emoji: '🥂', greeting: '跨年快乐！', subGreeting: '新的一年即将开始' },
]

export function getTodayFestival(date: Date = new Date()): Festival | null {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return FESTIVALS.find(f => f.month === m && f.day === d) ?? null
}
