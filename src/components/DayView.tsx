"use client"

import { useEffect, useState } from 'react'
import { CourseSchedule, Course, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getTodayCourses, getCurrentPeriod, isOddWeek, getWeekNumber } from '@/lib/schedule'
import { getPeriodTime } from '@/lib/semester'

export function DayView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [weekNum, setWeekNum] = useState(0)

  useEffect(() => {
    const now = new Date()
    setCurrentPeriod(getCurrentPeriod(now))
    setWeekNum(getWeekNumber(now))

    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
    getAssignments().then(setAssignments)
    getMemos().then(setMemos)

    const timer = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 60000)
    return () => clearInterval(timer)
  }, [])

  const todaySchedules = getTodayCourses(schedules)
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayAssignments = assignments.filter((a) => a.due_date.slice(0, 10) === todayStr)
  const todayMemos = memos.filter((m) => m.created_at.slice(0, 10) === todayStr)

  const now = new Date()
  const weekType = isOddWeek(now) ? '单周' : '双周'
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const todayLabel = `${now.getMonth() + 1}月${now.getDate()}日 周${dayNames[now.getDay()]}`

  const sortedSchedules = [...todaySchedules].sort(
    (a, b) => a.start_period - b.start_period
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-ink dark:text-sand">{todayLabel}</h2>
        <p className="text-sm text-ink-light dark:text-sand/50">
          第 {weekNum} 周 · {weekType}
        </p>
      </div>

      {/* Course timeline */}
      <section>
        <h3 className="text-sm font-medium text-ink-light dark:text-sand/50 mb-3">今日课程</h3>
        {sortedSchedules.length === 0 ? (
          <p className="text-center py-8 text-ink-light/50 dark:text-sand/30 text-sm">今天没有课程 🎉</p>
        ) : (
          <div className="space-y-3">
            {sortedSchedules.map((schedule) => {
              const course = courseMap.get(schedule.course_id)
              if (!course) return null
              const time = getPeriodTime(schedule.start_period)
              const timeEnd = getPeriodTime(schedule.end_period)
              const isNow =
                currentPeriod !== null &&
                currentPeriod >= schedule.start_period &&
                currentPeriod <= schedule.end_period

              return (
                <div
                  key={schedule.id}
                  className={`rounded-card p-4 border-l-3 transition-colors ${
                    isNow
                      ? 'bg-rust/10 dark:bg-terracotta/10 border-l-rust dark:border-l-terracotta'
                      : 'bg-paper dark:bg-[#252220] border-l-[var(--schedule-color)]'
                  }`}
                  style={
                    isNow ? {} : { borderLeftColor: course.color, '--schedule-color': course.color } as React.CSSProperties
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold" style={{ color: isNow ? undefined : course.color }}>
                        {course.name}
                        {isNow && (
                          <span className="ml-2 text-xs bg-rust text-white dark:bg-terracotta px-1.5 py-0.5 rounded-full">
                            进行中
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-ink-light dark:text-sand/50 mt-0.5">
                        {time?.start} — {timeEnd?.end} · 第{schedule.start_period}-{schedule.end_period}节
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-ink-light dark:text-sand/50 flex gap-3">
                    {course.teacher !== '—' && <span>👨‍🏫 {course.teacher}</span>}
                    {schedule.location !== '—' && <span>📍 {schedule.location}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Assignments due today */}
      {todayAssignments.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-ink-light dark:text-sand/50 mb-3">今日截止作业</h3>
          <div className="space-y-2">
            {todayAssignments.map((a) => {
              const course = courseMap.get(a.course_id)
              return (
                <div
                  key={a.id}
                  className="rounded-card p-3 bg-paper dark:bg-[#252220] flex items-center gap-3"
                >
                  <span className="text-sm">{a.status === 'submitted' ? '✅' : '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-ink-light dark:text-sand/50">
                      {course?.name} · {a.due_date.slice(11, 16)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Today's memos */}
      {todayMemos.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-ink-light dark:text-sand/50 mb-3">今日备忘</h3>
          <div className="space-y-2">
            {todayMemos.map((m) => {
              const course = courseMap.get(m.course_id)
              return (
                <div
                  key={m.id}
                  className="rounded-card p-3 bg-paper dark:bg-[#252220]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.mood_emoji}</span>
                    <span className="text-sm">{m.content}</span>
                  </div>
                  <p className="text-xs text-ink-light dark:text-sand/50 mt-1">
                    {course?.name} · {m.created_at.slice(11, 16)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {todayAssignments.length === 0 && todayMemos.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-card p-4 bg-paper dark:bg-[#252220] text-center">
            <p className="text-sm text-ink-light dark:text-sand/50">暂无今日截止作业</p>
          </div>
          <div className="rounded-card p-4 bg-paper dark:bg-[#252220] text-center">
            <p className="text-sm text-ink-light dark:text-sand/50">暂无今日备忘</p>
          </div>
        </div>
      )}
    </div>
  )
}
