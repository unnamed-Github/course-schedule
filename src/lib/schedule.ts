import {
  getWeekNumber,
  getWeekDateRange,
  isOddWeek,
  isHoliday,
  getMakeupInfo,
  getCurrentPeriod,
} from './semester'

type WeekType = 'all' | 'odd' | 'even'

export function getTodayCourses<T extends { day_of_week: number; week_type: WeekType }>(
  courses: T[],
  date: Date = new Date()
): T[] {
  const dayOfWeek = date.getDay() || 7
  const weekNum = getWeekNumber(date)
  const odd = isOddWeek(date)
  const holiday = isHoliday(date)
  const makeup = getMakeupInfo(date)

  if (holiday && !makeup) return []

  return courses.filter((course) => {
    const targetDow = makeup ? makeup.replacesDayOfWeek : dayOfWeek

    if (course.day_of_week !== targetDow) return false

    if (course.week_type === 'odd' && !odd) return false
    if (course.week_type === 'even' && odd) return false

    return true
  })
}

export function getWeekCourses<T extends { day_of_week: number; week_type: WeekType }>(
  courses: T[],
  weekNumber: number
): T[] {
  const odd = weekNumber % 2 === 1
  const range = getWeekDateRange(weekNumber)

  const activeDays = new Set<number>()
  const d = new Date(range.start)

  for (let i = 0; i < 7; i++) {
    const current = new Date(d)
    current.setDate(d.getDate() + i)
    const dow = current.getDay() || 7
    const holiday = isHoliday(current)
    const makeup = getMakeupInfo(current)

    if (makeup) {
      activeDays.add(makeup.replacesDayOfWeek)
    } else if (!holiday) {
      activeDays.add(dow)
    }
  }

  return courses.filter((course) => {
    if (course.week_type === 'odd' && !odd) return false
    if (course.week_type === 'even' && odd) return false
    return activeDays.has(course.day_of_week)
  })
}

export { getWeekNumber, getWeekDateRange, isOddWeek, isHoliday, getMakeupInfo, getCurrentPeriod }
