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

const DEFAULT_SEMESTER: SemesterConfig = {
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

let _cachedSemester: SemesterConfig | null = null

export function setSemesterCache(config: SemesterConfig) {
  _cachedSemester = config
}

export function clearSemesterCache() {
  _cachedSemester = null
}

export function getSemesterConfig(): SemesterConfig {
  return _cachedSemester ?? DEFAULT_SEMESTER
}

export const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:50' },
  2: { start: '09:00', end: '09:50' },
  3: { start: '10:20', end: '11:10' },
  4: { start: '11:20', end: '12:10' },
  5: { start: '14:00', end: '14:50' },
  6: { start: '15:00', end: '15:50' },
  7: { start: '16:20', end: '17:10' },
  8: { start: '17:20', end: '18:10' },
  9: { start: '19:00', end: '19:50' },
  10: { start: '20:00', end: '20:50' },
  11: { start: '21:00', end: '22:30' },
}

const PERIOD_TIMES_MS: Record<number, { startMs: number; endMs: number }> = Object.fromEntries(
  Object.entries(PERIOD_TIMES).map(([period, time]) => {
    const [sh, sm] = time.start.split(':').map(Number)
    const [eh, em] = time.end.split(':').map(Number)
    return [Number(period), { startMs: sh * 3600000 + sm * 60000, endMs: eh * 3600000 + em * 60000 }]
  })
) as Record<number, { startMs: number; endMs: number }>

export function getPeriodTime(period: number) {
  return PERIOD_TIMES[period] ?? null
}

export function getWeekNumber(date: Date = new Date()): number {
  const start = new Date(getSemesterConfig().semesterStart)
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const diffMs = date.getTime() - startDay.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const startDayOfWeek = startDay.getDay()
  const daysToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
  const daysFromMonday = diffDays + daysToMonday
  return Math.floor(daysFromMonday / 7) + 1
}

export function isOddWeek(date: Date = new Date()): boolean {
  return getWeekNumber(date) % 2 === 1
}

export function getWeekDateRange(weekNumber: number): { start: Date; end: Date } {
  const base = new Date(getSemesterConfig().semesterStart)
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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isHoliday(date: Date): Holiday | null {
  const d = toDateStr(date)
  return getSemesterConfig().holidays.find((h) => d >= h.start && d <= h.end) ?? null
}

export function getMakeupInfo(date: Date): MakeupDay | null {
  const d = toDateStr(date)
  return getSemesterConfig().makeupDays.find((m) => m.date === d) ?? null
}

export function getCurrentPeriod(now: Date = new Date()): number | null {
  const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000
  for (const [period, time] of Object.entries(PERIOD_TIMES_MS)) {
    if (currentMs >= time.startMs && currentMs <= time.endMs) {
      return Number(period)
    }
  }
  return null
}
