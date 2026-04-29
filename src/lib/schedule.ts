import {
  getWeekNumber,
  getWeekDateRange,
  isOddWeek,
  isHoliday,
  getMakeupInfo,
  getCurrentPeriod,
} from './semester'

export function getTodayCourses<T extends { day_of_week: number; week_type: string }>(
  courses: T[],
  date: Date = new Date()
): T[] {
  const dayOfWeek = date.getDay() || 7 // 周日=7, 周一=1...周六=6
  const weekNum = getWeekNumber(date)
  const odd = isOddWeek(date)
  const holiday = isHoliday(date)
  const makeup = getMakeupInfo(date)

  if (holiday) return []

  return courses.filter((course) => {
    const targetDow = makeup ? makeup.replacesDayOfWeek : dayOfWeek

    if (course.day_of_week !== targetDow) return false

    if (course.week_type === 'odd' && !odd) return false
    if (course.week_type === 'even' && odd) return false

    return true
  })
}

export function getWeekCourses<T extends { day_of_week: number; week_type: string }>(
  courses: T[],
  weekNumber: number
): T[] {
  const odd = weekNumber % 2 === 1
  const range = getWeekDateRange(weekNumber)

  return courses.filter((course) => {
    if (course.week_type === 'odd' && !odd) return false
    if (course.week_type === 'even' && odd) return false
    return true
  })
}

export { getWeekNumber, getWeekDateRange, isOddWeek, isHoliday, getMakeupInfo, getCurrentPeriod }
