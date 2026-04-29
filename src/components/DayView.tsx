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
  const r = new Date(d); r.setDate(r.getDate() + days); return r
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const START_MIN = 480
const END_MIN = 1350
const TOTAL_MIN = END_MIN - START_MIN

export function DayView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [nowMinutes, setNowMinutes] = useState(0)
  const [viewDate, setViewDate] = useState(new Date())

  useEffect(() => {
    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
    getAssignments().then(setAssignments)
    getMemos().then(setMemos)
  }, [])

  useEffect(() => {
    const tick = () => { const n = new Date(); setCurrentPeriod(getCurrentPeriod(n)); setNowMinutes(n.getHours() * 60 + n.getMinutes()) }
    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const weekNum = getWeekNumber(viewDate)
  const viewDateLabel = `${viewDate.getMonth() + 1}月${viewDate.getDate()}日 周${dayNames[viewDate.getDay()]}`

  const viewDateStr = formatDateFull(viewDate)
  const viewAssignments = assignments.filter((a) => a.due_date.slice(0, 10) === viewDateStr)
  const viewMemos = memos.filter((m) => m.created_at.slice(0, 10) === viewDateStr)
  const sortedSchedules = getTodayCourses(schedules, viewDate).sort((a, b) => a.start_period - b.start_period)
  const isToday = isSameDay(viewDate, new Date())
  const nowTop = isToday && nowMinutes >= START_MIN && nowMinutes <= END_MIN ? nowMinutes - START_MIN : -1

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3">
        <button onClick={() => setViewDate(addDays(viewDate, -1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)]" style={{ color: 'var(--text-secondary)' }}>←</button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{viewDateLabel}</h2>
        <button onClick={() => setViewDate(addDays(viewDate, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)]" style={{ color: 'var(--text-secondary)' }}>→</button>
      </motion.div>

      {!isToday && (
        <div className="text-center">
          <button onClick={() => setViewDate(new Date())} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>回到今天</button>
        </div>
      )}

      {sortedSchedules.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1px dashed var(--border-light)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>今天没有课～好好休息吧 ✨</p>
        </div>
      ) : (
        <div className="relative ml-14" style={{ minHeight: `${TOTAL_MIN + 60}px` }}>
          {/* Hour markers */}
          <div className="absolute left-[-56px] top-0 bottom-0 w-10 pointer-events-none">
            {[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22].map((h) => {
              const top = h * 60 - START_MIN
              if (top < 0 || top > TOTAL_MIN + 30) return null
              return (
                <div key={h} className="absolute right-0 text-[10px] flex items-center" style={{ top: `${top}px`, transform: 'translateY(-50%)' }}>
                  <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>{String(h).padStart(2, '0')}:00</span>
                  <div className="w-2 h-px ml-1" style={{ backgroundColor: 'var(--border-light)' }} />
                </div>
              )
            })}
          </div>
          <div className="absolute left-[-12px] top-0 w-px h-full" style={{ backgroundColor: 'var(--border-light)' }} />

          {/* Now indicator */}
          {nowTop >= 0 && (
            <div className="absolute left-[-12px] right-0 z-20 flex items-center pointer-events-none" style={{ top: `${nowTop}px` }}>
              <div className="w-2 h-2 rounded-full -ml-[5px]" style={{ backgroundColor: 'var(--accent-warm)' }} />
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--accent-warm)' }} />
              <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: 'var(--accent-warm)' }}>
                {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {sortedSchedules.map((schedule) => {
            const course = courseMap.get(schedule.course_id)
            if (!course) return null
            const st = getPeriodTime(schedule.start_period)
            const et = getPeriodTime(schedule.end_period)
            if (!st || !et) return null
            const topPx = (parseInt(st.start.split(':')[0]) * 60 + parseInt(st.start.split(':')[1])) - START_MIN
            const isNow = isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
            const isPast = isToday && currentPeriod !== null && schedule.end_period < currentPeriod

            return (
              <motion.div key={schedule.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: schedule.start_period * 0.03 }}
                className="absolute left-0 right-0 pr-2" style={{ top: `${topPx}px`, zIndex: isNow ? 10 : 1 }}>
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{
                  backgroundColor: 'var(--bg-card)', border: isNow ? '2px solid var(--accent-warm)' : '1px solid var(--border-light)',
                  boxShadow: isNow ? 'var(--shadow-lg)' : 'var(--shadow-sm)', opacity: isPast ? 0.55 : 1,
                }}>
                  <div className="flex flex-col items-center min-w-[44px]">
                    <span className="text-sm font-semibold" style={{ color: isNow ? 'var(--accent-warm)' : 'var(--text-primary)' }}>{st.start}</span>
                    <div className="w-px flex-1 min-h-[20px] my-1" style={{ backgroundColor: 'var(--border-light)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{et.end}</span>
                  </div>
                  <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: course.color, width: 3 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</h4>
                      {isNow && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: 'var(--accent-warm)' }}>进行中</span>}
                      {isPast && <span className="text-[10px] ml-auto" style={{ color: 'var(--accent-success)' }}>✓</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {course.teacher !== '—' && <span>👨‍🏫 {course.teacher}</span>}
                      {schedule.location !== '—' && <span>📍 {schedule.location}</span>}
                      <span style={{ opacity: 0.6 }}>第{schedule.start_period}-{schedule.end_period}节</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>📝 {isToday ? '今日' : '当天'}截止 ({viewAssignments.length})</h3>
          {viewAssignments.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            viewAssignments.map((a) => {
              const c = courseMap.get(a.course_id)
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div key={a.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-xs" style={{ borderColor: 'var(--border-light)' }}>
                  <span>{a.status === 'submitted' ? '✅' : '📝'}</span>
                  <span className="truncate flex-1" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-primary)' }}>{a.title}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c?.name}</span>
                  {isOverdue && <span className="font-medium" style={{ color: 'var(--accent-danger)', animation: 'breathe-danger 3s ease-in-out infinite' }}>超时</span>}
                </div>
              )
            })
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>📌 {isToday ? '今日' : '当天'}备忘 ({viewMemos.length})</h3>
          {viewMemos.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无</p>
          ) : (
            viewMemos.map((m) => {
              const c = courseMap.get(m.course_id)
              return (
                <div key={m.id} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                  <span className="text-sm">{m.mood_emoji}</span>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{m.content}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{c?.name} · {m.created_at.slice(11, 16)}</p>
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
