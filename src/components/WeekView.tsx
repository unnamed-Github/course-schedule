"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CourseSchedule, Course, Assignment, Memo, MoodTag, getMoodColor } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getCurrentPeriod, getWeekNumber, getWeekDateRange, getMakeupInfo, isHoliday } from '@/lib/schedule'
import { PERIOD_TIMES } from '@/lib/semester'
import { SkeletonGrid } from './Skeleton'

const DAYS = ['一', '二', '三', '四', '五', '六', '日']
const ALL_TAGS: MoodTag[] = ['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待']

const PERIOD_GROUP_DEFS = [
  { label: '1-2节', start: 1, end: 2 },
  { label: '3-4节', start: 3, end: 4 },
  { label: '5-6节', start: 5, end: 6 },
  { label: '7-8节', start: 7, end: 8 },
  { label: '9-10节', start: 9, end: 10 },
  { label: '11节', start: 11, end: 11 },
]

const PERIOD_GROUPS = PERIOD_GROUP_DEFS.map((g) => ({
  ...g,
  time: `${PERIOD_TIMES[g.start].start}-${PERIOD_TIMES[g.end].end}`,
}))

function formatDateTime(iso: string) { return iso.slice(0, 16).replace('T', ' ') }

export function WeekView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(0)
  const [selectedSlot, setSelectedSlot] = useState<{ courseId: string; scheduleId: string } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = () => {
    setLoadError(false)
    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()])
      .then(([c, sc, a, m]) => { setCourses(c); setSchedules(sc); setAssignments(a); setMemos(m); setLoaded(true) })
      .catch((e) => { console.error('WeekView load failed:', e); setLoadError(true); setLoaded(true) })
  }

  useEffect(() => {
    loadData()

    const wn = getWeekNumber()
    setWeekNum(wn)
    setWeekRange(getWeekDateRange(wn))

    const now = new Date()
    const dow = now.getDay()
    setCurrentDay(dow === 0 ? 7 : dow)
    setCurrentPeriod(getCurrentPeriod(now))

    const timer = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 60000)
    return () => clearInterval(timer)
  }, [])

  const changeWeek = useCallback((delta: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setWeekNum((prev) => {
        const newWeek = prev + delta
        setWeekRange(getWeekDateRange(newWeek))
        return newWeek
      })
      setCurrentDay(0)
      setCurrentPeriod(null)
      setSelectedSlot(null)
    }, 200)
  }, [])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const weekHolidays = useMemo(() => {
    const holidays = new Map<number, ReturnType<typeof isHoliday>>()
    const makeups = new Map<number, ReturnType<typeof getMakeupInfo>>()
    if (!weekRange) return { holidays, makeups }
    const d = new Date(weekRange.start)
    for (let i = 0; i < 7; i++) {
      const current = new Date(d)
      current.setDate(d.getDate() + i)
      const dow = current.getDay() || 7
      holidays.set(dow, isHoliday(current))
      makeups.set(dow, getMakeupInfo(current))
    }
    return { holidays, makeups }
  }, [weekRange])

  const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  const showDays = [1, 2, 3, 4, 5]

  function isCurrentCourse(schedule: CourseSchedule) {
    if (currentDay === 0 || currentPeriod === null) return false
    return schedule.day_of_week === currentDay && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
  }

  const selectedSchedule = selectedSlot ? schedules.find((s) => s.id === selectedSlot.scheduleId) : null
  const selectedCourse = selectedSlot ? courseMap.get(selectedSlot.courseId) : null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors" style={{ color: 'var(--text-secondary)' }}>←</button>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>第{weekNum}/15周 · {weekRange ? `${formatDate(weekRange.start)}—${formatDate(weekRange.end)}` : ''}</span>
        <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors" style={{ color: 'var(--text-secondary)' }}>→</button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
          {!loaded ? (
            <SkeletonGrid />
          ) : loadError ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载失败，请检查网络连接</p>
              <button onClick={loadData} className="btn-primary text-sm">重试</button>
            </div>
          ) : (
            <>
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)' }}>
            <div className="p-2" />
            {showDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold" style={{ color: day === currentDay ? 'var(--text-primary)' : 'var(--text-secondary)' }}>周{DAYS[day - 1]}</div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={weekNum} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {PERIOD_GROUPS.map((group) => (
                <div key={group.label} className="grid" style={{ gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)', minHeight: '80px' }}>
                  <div className="p-2 flex flex-col justify-center text-right pr-3" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{group.label}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{group.time}</span>
                  </div>

                  {showDays.map((day) => {
                    const holiday = weekHolidays.holidays.get(day)
                    const makeup = weekHolidays.makeups.get(day)
                    const daySchedules = schedules.filter((s) => {
                      if (s.day_of_week !== day) return false
                      if (s.week_type === 'odd' && weekNum % 2 === 0) return false
                      if (s.week_type === 'even' && weekNum % 2 !== 0) return false
                      if (s.start_period > group.end || s.end_period < group.start) return false
                      return true
                    })

                    return (
                      <div key={day} className="p-1 flex flex-col gap-0.5" style={{ backgroundColor: holiday ? 'var(--holiday-cell)' : 'transparent' }}>
                        {holiday && makeup ? (
                          <div className="flex-1 flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: 'var(--makeup-badge)' }}>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>补课 · 周{DAYS[makeup.replacesDayOfWeek - 1]}</span>
                          </div>
                        ) : holiday ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-sm italic" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{holiday.name}</span>
                          </div>
                        ) : daySchedules.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center rounded-2xl cursor-pointer group" style={{ border: '1px dashed var(--border-light)' }}>
                            <span className="text-sm opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: 'var(--text-secondary)' }}>+</span>
                          </div>
                        ) : (
                          daySchedules.map((schedule) => {
                            const course = courseMap.get(schedule.course_id)
                            if (!course) return null
                            const active = isCurrentCourse(schedule)
                            const isSelected = selectedSlot?.scheduleId === schedule.id
                            const courseAssignments = assignments.filter((a) => a.course_id === schedule.course_id).sort((a, b) => a.due_date.localeCompare(b.due_date))
                            const courseMemos = memos.filter((m) => m.course_id === schedule.course_id)
                            const tagCounts: Record<string, number> = {}
                            courseMemos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })

                            return (
                              <motion.div
                                key={schedule.id}
                                onClick={() => setSelectedSlot(isSelected ? null : { courseId: schedule.course_id, scheduleId: schedule.id })}
                                className="rounded-2xl p-2 cursor-pointer relative"
                                style={{
                                  backgroundColor: `${course.color}26`,
                                  borderLeft: `4px solid ${course.color}`,
                                  boxShadow: active ? '0 0 0 2px var(--accent-warm)' : 'none',
                                }}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.15 }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{course.name}</div>
                                    <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{course.teacher !== '—' ? course.teacher : ''}</div>
                                    <div className="text-xs truncate" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{schedule.location !== '—' ? schedule.location : ''}</div>
                                  </div>
                                  {/* Memo dot */}
                                  {courseMemos.length > 0 && (
                                    <div className="w-2 h-2 rounded-full flex-shrink-0 ml-1" style={{ backgroundColor: 'var(--accent-warm)' }} />
                                  )}
                                </div>
                                {active && (
                                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]" style={{ animation: 'breathe-warm 2s ease-in-out infinite' }} />
                                )}
                              </motion.div>
                            )
                          })
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </>
          )}
        </div>
      </div>

      {/* Side panel for selected course */}
      <AnimatePresence>
        {selectedSlot && selectedCourse && selectedSchedule && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-14 bottom-16 w-[360px] z-40 overflow-y-auto p-4 hidden xl:block"
            style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--border-light)' }}
          >
            <SlidePanelContent
              course={selectedCourse}
              schedule={selectedSchedule}
              assignments={assignments.filter((a) => a.course_id === selectedCourse.id).sort((a, b) => a.due_date.localeCompare(b.due_date))}
              memos={memos.filter((m) => m.course_id === selectedCourse.id)}
              onClose={() => setSelectedSlot(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {selectedSlot && selectedCourse && selectedSchedule && (
          <motion.div
            initial={{ opacity: 0, y: '60%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '60%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-16 left-0 right-0 z-40 max-h-[60vh] overflow-y-auto rounded-t-2xl p-4 xl:hidden"
            style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)', borderBottom: 'none' }}
          >
            <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--border-light)' }} />
            <SlidePanelContent
              course={selectedCourse}
              schedule={selectedSchedule}
              assignments={assignments.filter((a) => a.course_id === selectedCourse.id).sort((a, b) => a.due_date.localeCompare(b.due_date))}
              memos={memos.filter((m) => m.course_id === selectedCourse.id)}
              onClose={() => setSelectedSlot(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlidePanelContent({
  course, schedule, assignments, memos, onClose,
}: {
  course: Course
  schedule: CourseSchedule
  assignments: Assignment[]
  memos: Memo[]
  onClose: () => void
}) {
  const tagCounts: Record<string, number> = {}
  memos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div style={{ borderLeft: `4px solid ${course.color}`, paddingLeft: '0.75rem' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{course.teacher !== '—' ? course.teacher : ''} · {schedule.location !== '—' ? schedule.location : ''}</p>
        </div>
        <button onClick={onClose} className="text-lg opacity-40 hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>✕</button>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>📝 作业</p>
        {assignments.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无作业</p>
        ) : (
          assignments.map((a) => {
            const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
            const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
            return (
              <div key={a.id} className="flex items-center gap-2 text-xs py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                <span>{a.status === 'submitted' ? '✅' : '☐'}</span>
                <span className="flex-1 truncate" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-secondary)' }}>{a.title}</span>
                <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{formatDateTime(a.due_date).slice(5)}</span>
              </div>
            )
          })
        )}
        <Link href={`/courses/${course.id}`} className="text-[10px] mt-1 inline-block" style={{ color: 'var(--accent-info)' }}>+ 添加作业</Link>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>心情标签</p>
        <div className="flex gap-2">
          {(['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待'] as MoodTag[]).map((tag) => {
            const count = tagCounts[tag] ?? 0
            return (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  backgroundColor: count > 0 ? `${getMoodColor(tag)}33` : 'var(--bg-primary)',
                  color: count > 0 ? getMoodColor(tag) : 'var(--text-secondary)',
                  border: `1px solid ${count > 0 ? getMoodColor(tag) : 'var(--border-light)'}`,
                }}
              >
                {tag}{count > 0 ? ` ${count}` : ''}
              </span>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>📌 备忘</p>
        {memos.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无备忘</p>
        ) : (
          memos.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-start gap-2 rounded-lg px-2 py-1 mb-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <span className="text-sm">{m.mood_emoji}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.content}</span>
            </div>
          ))
        )}
        <Link href={`/courses/${course.id}`} className="text-[10px] mt-1 inline-block" style={{ color: 'var(--accent-info)' }}>+ 写备忘</Link>
      </div>
    </div>
  )
}
