"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CourseSchedule, Course, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getTodayCourses, getCurrentPeriod, getWeekNumber } from '@/lib/schedule'
import { getPeriodTime } from '@/lib/semester'

function formatDateFull(d: Date) {
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const date = d.getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
}

function addDays(d: Date, days: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const HOUR_MARKERS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const START_MIN = 480  // 08:00
const END_MIN = 1350   // 22:30
const TOTAL_MIN = END_MIN - START_MIN // 870

export function DayView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [nowMinutes, setNowMinutes] = useState(0)
  const [viewDate, setViewDate] = useState(new Date())

  useEffect(() => {
    getCourses().then(setCourses).catch((e) => console.error('DayView getCourses failed:', e))
    getSchedules().then(setSchedules).catch((e) => console.error('DayView getSchedules failed:', e))
    getAssignments().then(setAssignments).catch((e) => console.error('DayView getAssignments failed:', e))
    getMemos().then(setMemos).catch((e) => console.error('DayView getMemos failed:', e))
  }, [])

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setCurrentPeriod(getCurrentPeriod(n))
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }
    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const weekNum = getWeekNumber(viewDate)
  const viewDateLabel = `${viewDate.getMonth() + 1}月${viewDate.getDate()}日 周${dayNames[viewDate.getDay()]} · 第${weekNum}周`

  const viewDateStr = formatDateFull(viewDate)
  const viewAssignments = assignments.filter((a) => a.due_date.slice(0, 10) === viewDateStr)
  const viewMemos = memos.filter((m) => m.created_at.slice(0, 10) === viewDateStr)

  const viewSchedules = getTodayCourses(schedules, viewDate)
  const sortedSchedules = [...viewSchedules].sort((a, b) => a.start_period - b.start_period)

  const isToday = isSameDay(viewDate, new Date())

  const goToToday = () => setViewDate(new Date())

  // Timeline positioning (1px = 1 minute)
  const timelineHeight = TOTAL_MIN + 60 // extra space at bottom

  const nowTop = isToday && nowMinutes >= START_MIN && nowMinutes <= END_MIN
    ? nowMinutes - START_MIN
    : -1

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date Navigator */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3"
      >
        <button onClick={() => setViewDate(addDays(viewDate, -1))} className="btn-ghost text-sm px-2" style={{ color: 'var(--fg-secondary)' }}>
          ←
        </button>
        <div className="text-center min-w-[200px]">
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>{viewDateLabel}</h2>
        </div>
        <button onClick={() => setViewDate(addDays(viewDate, 1))} className="btn-ghost text-sm px-2" style={{ color: 'var(--fg-secondary)' }}>
          →
        </button>
      </motion.div>

      {!isToday && (
        <div className="text-center">
          <button onClick={goToToday} className="btn-ghost text-xs" style={{ color: '#F59E0B' }}>
            回到今天
          </button>
        </div>
      )}

      {/* Timeline */}
      {sortedSchedules.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: '1px dashed var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>这天没有课程 🎉</p>
        </div>
      ) : (
        <div className="relative ml-14" style={{ minHeight: `${timelineHeight}px` }}>
          {/* Hour markers */}
          <div className="absolute left-[-56px] top-0 bottom-0 w-10 pointer-events-none">
            {HOUR_MARKERS.map((h) => {
              const topOffset = h * 60 - START_MIN
              if (topOffset < 0 || topOffset > TOTAL_MIN + 30) return null
              return (
                <div key={h} className="absolute right-0 text-[10px] flex items-center" style={{ top: `${topOffset}px`, transform: 'translateY(-50%)' }}>
                  <span style={{ color: 'var(--fg-secondary)', opacity: 0.4 }}>{String(h).padStart(2, '0')}:00</span>
                  <div className="w-2 h-px ml-1" style={{ backgroundColor: 'var(--border)' }} />
                </div>
              )
            })}
          </div>

          {/* Left timeline bar */}
          <div className="absolute left-[-12px] top-0 w-px h-full" style={{ backgroundColor: 'var(--border)' }} />

          {/* Now indicator */}
          {nowTop >= 0 && (
            <div
              className="absolute left-[-12px] right-0 z-20 flex items-center pointer-events-none"
              style={{ top: `${nowTop}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] -ml-[5px]" />
              <div className="flex-1 h-px bg-[#F59E0B]" />
            </div>
          )}

          {/* Course cards */}
          {sortedSchedules.map((schedule) => {
            const course = courseMap.get(schedule.course_id)
            if (!course) return null
            const startTime = getPeriodTime(schedule.start_period)
            const endTime = getPeriodTime(schedule.end_period)
            if (!startTime || !endTime) return null

            const startMinutes = timeToMinutes(startTime.start)
            const endMinutes = timeToMinutes(endTime.end)
            const topPx = startMinutes - START_MIN

            const isNow = isToday &&
              currentPeriod !== null &&
              currentPeriod >= schedule.start_period &&
              currentPeriod <= schedule.end_period
            const isPast = isToday && currentPeriod !== null && schedule.end_period < currentPeriod

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: schedule.start_period * 0.03 }}
                className="absolute left-0 right-0 pr-2"
                style={{ top: `${topPx}px`, zIndex: isNow ? 10 : 1 }}
              >
                <div
                  className="rounded-2xl p-4 flex items-start gap-3 transition-shadow"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: isNow
                      ? '1.5px solid rgba(245, 158, 11, 0.45)'
                      : '1px solid var(--border)',
                    boxShadow: isNow ? '0 0 0 4px rgba(245, 158, 11, 0.12)' : 'var(--card-shadow)',
                    opacity: isPast ? 0.55 : 1,
                  }}
                >
                  <div className="flex flex-col items-center min-w-[44px]">
                    <span className="text-sm font-semibold" style={{ color: isNow ? '#F59E0B' : 'var(--fg)' }}>{startTime.start}</span>
                    <div className="w-px flex-1 min-h-[20px] my-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>{endTime.end}</span>
                  </div>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: course.color, width: 3 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>{course.name}</h4>
                      {isNow && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F59E0B] text-white font-medium">进行中</span>
                      )}
                      {isPast && (
                        <span className="text-[10px] ml-auto" style={{ color: 'var(--success)' }}>✓</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {course.teacher !== '—' && (
                        <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>👨‍🏫 {course.teacher}</span>
                      )}
                      {schedule.location !== '—' && (
                        <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>📍 {schedule.location}</span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--fg-secondary)', opacity: 0.6 }}>
                        第{schedule.start_period}-{schedule.end_period}节
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Current time label */}
          {nowTop >= 0 && (
            <div
              className="absolute right-0 z-20 pointer-events-none"
              style={{ top: `${nowTop}px`, transform: 'translateY(-50%)' }}
            >
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B] text-white font-medium">
                {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Side panels for assignments & memos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
            {isToday ? '今日' : '当天'}截止 ({viewAssignments.length})
          </h3>
          {viewAssignments.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            viewAssignments.map((a) => {
              const course = courseMap.get(a.course_id)
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div key={a.id} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs">{a.status === 'submitted' ? '✅' : '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: isOverdue ? 'var(--danger)' : isNear ? 'var(--warning)' : 'var(--fg)' }}>
                      {a.title}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>
                      {course?.name} · {a.due_date.slice(11, 16)}
                    </p>
                  </div>
                  {isOverdue && (
                    <span className="text-[10px] font-medium" style={{ color: 'var(--danger)', animation: 'breathe-danger 3s ease-in-out infinite' }}>超时</span>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg-secondary)' }}>
            {isToday ? '今日' : '当天'}备忘 ({viewMemos.length})
          </h3>
          {viewMemos.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            viewMemos.map((m) => {
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
