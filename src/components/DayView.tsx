"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CourseSchedule, Course, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getTodayCourses, getCurrentPeriod, getWeekNumber } from '@/lib/schedule'
import { getPeriodTime } from '@/lib/semester'

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function DayView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [nowMinutes, setNowMinutes] = useState(0)

  useEffect(() => {
    const now = new Date()
    setCurrentPeriod(getCurrentPeriod(now))
    setNowMinutes(now.getHours() * 60 + now.getMinutes())

    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
    getAssignments().then(setAssignments)
    getMemos().then(setMemos)

    const timer = setInterval(() => {
      const n = new Date()
      setCurrentPeriod(getCurrentPeriod(n))
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const todaySchedules = getTodayCourses(schedules)
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  const now = new Date()
  const weekNum = getWeekNumber(now)
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const todayLabel = `${now.getMonth() + 1}月${now.getDate()}日 周${dayNames[now.getDay()]} · 第${weekNum}周`

  const todayStr = now.toISOString().slice(0, 10)
  const todayAssignments = assignments.filter((a) => a.due_date.slice(0, 10) === todayStr)
  const todayMemos = memos.filter((m) => m.created_at.slice(0, 10) === todayStr)

  const sortedSchedules = [...todaySchedules].sort((a, b) => a.start_period - b.start_period)

  // Time range for timeline: 8:00 to 22:30
  const START_MIN = 480
  const END_MIN = 1350
  const nowPos = ((nowMinutes - START_MIN) / (END_MIN - START_MIN)) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>{todayLabel}</h2>
      </motion.div>

      {/* Timeline */}
      <section>
        <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--fg-secondary)' }}>今日课程</h3>
        {sortedSchedules.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ border: '1px dashed var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>
              今天没有课程 🎉
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Current time indicator */}
            {nowPos >= 0 && nowPos <= 100 && (
              <div
                className="absolute left-0 right-0 z-10 flex items-center"
                style={{ top: `${nowPos}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#F59E0B] -ml-1" />
                <div className="flex-1 h-px bg-[#F59E0B]" />
              </div>
            )}

            <div className="space-y-2">
              {sortedSchedules.map((schedule) => {
                const course = courseMap.get(schedule.course_id)
                if (!course) return null
                const startTime = getPeriodTime(schedule.start_period)
                const endTime = getPeriodTime(schedule.end_period)
                const isNow =
                  currentPeriod !== null &&
                  currentPeriod >= schedule.start_period &&
                  currentPeriod <= schedule.end_period
                const isPast = currentPeriod !== null && schedule.end_period < currentPeriod

                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: schedule.start_period * 0.02 }}
                    className="rounded-2xl p-4 flex items-start gap-4"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: isNow
                        ? '2px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid var(--border)',
                      boxShadow: isNow ? '0 0 0 3px rgba(245, 158, 11, 0.15)' : 'var(--card-shadow)',
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    <div className="flex flex-col items-center min-w-[48px]">
                      <span className="text-sm font-semibold" style={{ color: isNow ? '#F59E0B' : 'var(--fg)' }}>
                        {startTime?.start}
                      </span>
                      <div className="w-px flex-1 my-1" style={{ backgroundColor: 'var(--border)' }} />
                      <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
                        {endTime?.end}
                      </span>
                    </div>
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.color, width: 3 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                          {course.name}
                        </h4>
                        {isNow && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-white font-medium">
                            进行中
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] ml-auto" style={{ color: '#10B981' }}>
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {course.teacher !== '—' && (
                          <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
                            👨‍🏫 {course.teacher}
                          </span>
                        )}
                        {schedule.location !== '—' && (
                          <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
                            📍 {schedule.location}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--fg-secondary)', opacity: 0.6 }}>
                          第{schedule.start_period}-{schedule.end_period}节
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Side panels for assignments & memos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignments */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
            今日截止 ({todayAssignments.length})
          </h3>
          {todayAssignments.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            todayAssignments.map((a) => {
              const course = courseMap.get(a.course_id)
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              return (
                <div key={a.id} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs">{a.status === 'submitted' ? '✅' : '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: isOverdue ? '#EF4444' : 'var(--fg)' }}>
                      {a.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>
                      {course?.name} · {a.due_date.slice(11, 16)}
                    </p>
                  </div>
                  {isOverdue && (
                    <span className="text-[10px] text-[#EF4444] animate-pulse font-medium">超时</span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Memos */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
            今日备忘 ({todayMemos.length})
          </h3>
          {todayMemos.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            todayMemos.map((m) => {
              const course = courseMap.get(m.course_id)
              return (
                <div key={m.id} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm">{m.mood_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--fg)' }}>{m.content}</p>
                    <p className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>
                      {course?.name} · {m.created_at.slice(11, 16)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
