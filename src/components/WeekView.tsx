"use client"

import { useEffect, useState } from 'react'
import { CourseSchedule, Course } from '@/lib/types'
import { getCourses, getSchedules } from '@/lib/data'
import { getWeekCourses, getCurrentPeriod, getWeekNumber, getWeekDateRange } from '@/lib/schedule'
import { getPeriodTime } from '@/lib/semester'

const DAYS = ['一', '二', '三', '四', '五']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

function getScheduleStyle(schedule: CourseSchedule, course: Course) {
  const start = getPeriodTime(schedule.start_period)
  const end = getPeriodTime(schedule.end_period)
  if (!start || !end) return {}

  const startMin = parseTimeToMinutes(start.start)
  const endMin = parseTimeToMinutes(end.end)
  const top = ((startMin - 480) / (1350 - 480)) * 100
  const height = ((endMin - startMin) / (1350 - 480)) * 100

  return {
    top: `${top}%`,
    height: `${height}%`,
    backgroundColor: course.color + '22',
    borderLeftColor: course.color,
  }
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function WeekView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(0)

  useEffect(() => {
    getCourses().then(setCourses)
    getSchedules().then(setSchedules)

    const wn = getWeekNumber()
    setWeekNum(wn)
    setWeekRange(getWeekDateRange(wn))

    const now = new Date()
    setCurrentDay(now.getDay() || 7)
    setCurrentPeriod(getCurrentPeriod(now))

    const timer = setInterval(() => {
      setCurrentPeriod(getCurrentPeriod())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const changeWeek = (delta: number) => {
    const newWeek = weekNum + delta
    setWeekNum(newWeek)
    setWeekRange(getWeekDateRange(newWeek))
    setCurrentDay(0)
    setCurrentPeriod(null)
  }

  const displayCourses = getWeekCourses(schedules, weekNum)
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeWeek(-1)}
          className="px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors text-sm"
        >
          ← 上一周
        </button>
        <h2 className="text-base font-medium text-ink dark:text-sand">
          第 {weekNum} 周
          {weekRange && (
            <span className="ml-2 text-sm text-ink-light dark:text-sand/50">
              {formatDate(weekRange.start)} — {formatDate(weekRange.end)}
            </span>
          )}
        </h2>
        <button
          onClick={() => changeWeek(1)}
          className="px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors text-sm"
        >
          下一周 →
        </button>
      </div>

      <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr] border-b border-sand/30 dark:border-ink-light/10">
            <div className="p-2" />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center text-xs font-medium border-l border-sand/30 dark:border-ink-light/10 ${
                  i + 1 === currentDay ? 'text-rust dark:text-terracotta' : 'text-ink-light dark:text-sand/50'
                }`}
              >
                周{day}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative">
            <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr]" style={{ height: '870px' }}>
              {PERIODS.map((period) => {
                const time = getPeriodTime(period)
                const isCurrent = period === currentPeriod
                return (
                  <div key={period} className="contents">
                    <div
                      className={`p-1 text-[10px] leading-tight text-right pr-2 border-b border-sand/20 dark:border-ink-light/5 ${
                        isCurrent ? 'text-rust dark:text-terracotta font-bold' : 'text-ink-light dark:text-sand/40'
                      }`}
                    >
                      <div>{period}</div>
                      {time && <div>{time.start}</div>}
                    </div>
                    {DAYS.map((_, di) => (
                      <div
                        key={di}
                        className={`border-l border-b border-sand/20 dark:border-ink-light/5 ${
                          di + 1 === currentDay && period === currentPeriod
                            ? 'bg-rust/5 dark:bg-terracotta/10'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Course blocks */}
          <div className="relative" style={{ height: '870px', marginTop: '-870px' }}>
            <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr]" style={{ height: '100%' }}>
              <div />
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="relative border-l border-transparent">
                  {displayCourses
                    .filter((s) => s.day_of_week === dayIndex + 1)
                    .map((schedule) => {
                      const course = courseMap.get(schedule.course_id)
                      if (!course) return null
                      const style = getScheduleStyle(schedule, course)
                      return (
                        <div
                          key={schedule.id}
                          className="absolute left-0.5 right-0.5 rounded-lg border-l-3 px-1.5 py-0.5 overflow-hidden text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          style={style}
                          title={`${course.name}\n${course.teacher}\n${schedule.location}`}
                        >
                          <div className="font-semibold truncate" style={{ color: course.color }}>
                            {course.name}
                          </div>
                          <div className="truncate text-ink-light dark:text-sand/40 leading-tight hidden sm:block">
                            {schedule.location !== '—' ? schedule.location : ''}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
