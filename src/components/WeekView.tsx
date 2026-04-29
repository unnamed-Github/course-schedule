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

const DAY_MAP: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五' }

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    Promise.all([
      getCourses(), getSchedules(), getAssignments(), getMemos()
    ]).then(([c, sc, a, m]) => {
      setCourses(c); setSchedules(sc); setAssignments(a); setMemos(m)
      setLoaded(true)
    })

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
      setExpandedId(null)
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
                  <div className="p-2 flex flex-col justify-center text-right pr-3" style={{ backgroundColor: 'var(--border-light)', opacity: 0.5 }}>
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
                      <div key={day} className="p-1 flex flex-col gap-0.5" style={{ backgroundColor: holiday ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                        {holiday && makeup ? (
                          <div className="flex-1 flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>补课 · 周{DAYS[makeup.replacesDayOfWeek - 1]}</span>
                          </div>
                        ) : holiday ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-sm italic" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{holiday.name}</span>
                          </div>
                        ) : daySchedules.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ border: '1px dashed var(--border-light)' }} />
                        ) : (
                          daySchedules.map((schedule) => {
                            const course = courseMap.get(schedule.course_id)
                            if (!course) return null
                            const active = isCurrentCourse(schedule)
                            const isExpanded = expandedId === schedule.id
                            const courseAssignments = assignments.filter((a) => a.course_id === schedule.course_id).sort((a, b) => a.due_date.localeCompare(b.due_date))
                            const courseMemos = memos.filter((m) => m.course_id === schedule.course_id)
                            const tagCounts: Record<string, number> = {}
                            courseMemos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })

                            return (
                              <div
                                key={schedule.id}
                                onClick={() => setExpandedId(isExpanded ? null : schedule.id)}
                                className="rounded-2xl p-2 cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                                style={{
                                  backgroundColor: `${course.color}1A`,
                                  borderLeft: `4px solid ${course.color}`,
                                  boxShadow: active ? '0 0 0 2px var(--accent-warm)' : 'none',
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{course.name}</div>
                                    <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{course.teacher !== '—' ? course.teacher : ''}</div>
                                    <div className="text-xs truncate" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{schedule.location !== '—' ? schedule.location : ''}</div>
                                  </div>
                                  <span className="text-[10px] ml-1 flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>{isExpanded ? '▲' : '▼'}</span>
                                  {active && !isExpanded && <div className="absolute top-1 right-6 w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)] animate-pulse" />}
                                </div>

                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: 'easeOut' }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-3 pt-2 border-t space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                                        {Object.keys(tagCounts).length > 0 && (
                                          <div className="flex gap-1 flex-wrap">
                                            {ALL_TAGS.map((tag) => {
                                              const count = tagCounts[tag] ?? 0
                                              if (count === 0) return null
                                              return <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${getMoodColor(tag)}1A`, color: getMoodColor(tag) }}>{tag} ×{count}</span>
                                            })}
                                          </div>
                                        )}

                                        {courseAssignments.length > 0 && (
                                          <div>
                                            <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>📝 作业 ({courseAssignments.length})</p>
                                            {courseAssignments.slice(0, 4).map((a) => {
                                              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                                              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
                                              return (
                                                <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                                                  <span>{a.status === 'submitted' ? '✅' : '⬜'}</span>
                                                  <span className="truncate" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-secondary)', opacity: a.status === 'submitted' ? 0.4 : 1 }}>{a.title}</span>
                                                  <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>{formatDateTime(a.due_date).slice(5)}</span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        )}

                                        {courseMemos.length > 0 && (
                                          <div>
                                            <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>📌 备忘 ({courseMemos.length})</p>
                                            {courseMemos.slice(0, 3).map((m) => (
                                              <div key={m.id} className="text-[10px] flex items-start gap-1.5 rounded-lg px-2 py-1" style={{ backgroundColor: 'var(--bg-primary)' }}>
                                                <span>{m.mood_emoji}</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{m.content}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        <Link href={`/courses/${course.id}`} className="text-[10px] block" style={{ color: 'var(--accent-info)' }}>查看完整详情 →</Link>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
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
    </div>
  )
}
