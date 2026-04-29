// 南科大 2026 春季学期时间工具

export interface SemesterConfig {
  semesterStart: string
  teachingWeeks: number
  examWeeks: number
  holidays: Holiday[]
  makeupDays: MakeupDay[]
}

export interface Holiday {
  name: string
  start: string
  end: string
}

export interface MakeupDay {
  date: string
  replacesDayOfWeek: number
  weekType: 'all' | 'odd' | 'even'
}

const SEMESTER: SemesterConfig = {
  semesterStart: '2026-02-25',
  teachingWeeks: 15,
  examWeeks: 2,
  holidays: [
    { name: '清明节', start: '2026-04-05', end: '2026-04-05' },
    { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
    { name: '端午节', start: '2026-06-19', end: '2026-06-19' },
  ],
  makeupDays: [
    { date: '2026-02-28', replacesDayOfWeek: 1, weekType: 'all' },
    { date: '2026-05-09', replacesDayOfWeek: 2, weekType: 'odd' },
  ],
}

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:50' },
  2: { start: '08:55', end: '09:45' },
  3: { start: '10:05', end: '10:55' },
  4: { start: '11:00', end: '11:50' },
  5: { start: '14:00', end: '14:50' },
  6: { start: '14:55', end: '15:45' },
  7: { start: '16:05', end: '16:55' },
  8: { start: '17:00', end: '17:50' },
  9: { start: '19:00', end: '19:50' },
  10: { start: '19:55', end: '20:45' },
  11: { start: '21:00', end: '22:30' },
}

export function getPeriodTime(period: number) {
  return PERIOD_TIMES[period] ?? null
}

export function getWeekNumber(date: Date = new Date()): number {
  const start = new Date(SEMESTER.semesterStart)
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffMs = date.getTime() - startDay.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.ceil((diffDays + 1) / 7)
}

export function isOddWeek(date: Date = new Date()): boolean {
  return getWeekNumber(date) % 2 === 1
}

export function getWeekDateRange(weekNumber: number): { start: Date; end: Date } {
  const base = new Date(SEMESTER.semesterStart)
  const dayOfWeek = base.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const weekStart = new Date(base)
  weekStart.setDate(base.getDate() - daysToMonday + (weekNumber - 1) * 7)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return { start: weekStart, end: weekEnd }
}

export function getDayDate(weekNumber: number, dayOfWeek: number): Date {
  const { start } = getWeekDateRange(weekNumber)
  const date = new Date(start)
  date.setDate(start.getDate() + dayOfWeek - 1)
  return date
}

export function isHoliday(date: Date): Holiday | null {
  const d = date.toISOString().slice(0, 10)
  return SEMESTER.holidays.find((h) => d >= h.start && d <= h.end) ?? null
}

export function getMakeupInfo(date: Date): MakeupDay | null {
  const d = date.toISOString().slice(0, 10)
  return SEMESTER.makeupDays.find((m) => m.date === d) ?? null
}

export function getCurrentPeriod(now: Date = new Date()): number | null {
  for (const [period, time] of Object.entries(PERIOD_TIMES)) {
    const [sh, sm] = time.start.split(':').map(Number)
    const [eh, em] = time.end.split(':').map(Number)
    const startMs = sh * 3600000 + sm * 60000
    const endMs = eh * 3600000 + em * 60000
    const currentMs =
      now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000
    if (currentMs >= startMs && currentMs <= endMs) {
      return Number(period)
    }
  }
  return null
}

export function getSemesterConfig(): SemesterConfig {
  return SEMESTER
}
