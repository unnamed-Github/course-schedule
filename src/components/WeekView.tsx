"use client"

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CourseSchedule, Course, Assignment, Memo, MoodTag, getMoodColor } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getCurrentPeriod, getWeekNumber, getWeekDateRange, getMakeupInfo, isHoliday } from '@/lib/schedule'
import { PERIOD_TIMES } from '@/lib/semester'

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

function formatDateTime(iso: string) {
  return iso.slice(0, 16).replace('T', ' ')
}

export function WeekView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(0)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  useEffect(() => {
    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
    getAssignments().then(setAssignments)
    getMemos().then(setMemos)

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
    setWeekNum((prev) => {
      const newWeek = prev + delta
      setWeekRange(getWeekDateRange(newWeek))
      return newWeek
    })
    setCurrentDay(0)
    setCurrentPeriod(null)
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

  // Detail panel
  const selectedCourse = selectedCourseId ? courseMap.get(selectedCourseId) ?? null : null
  const selectedSchedules = selectedCourseId ? schedules.filter((s) => s.course_id === selectedCourseId) : []
  const selectedAssignments = selectedCourseId ? assignments.filter((a) => a.course_id === selectedCourseId).sort((a, b) => a.due_date.localeCompare(b.due_date)) : []
  const selectedMemos = selectedCourseId ? memos.filter((m) => m.course_id === selectedCourseId) : []

  const tagCounts: Record<string, number> = {}
  selectedMemos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Week Switcher */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
          ←
        </button>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          第{weekNum}/15周 · {weekRange ? `${formatDate(weekRange.start)}—${formatDate(weekRange.end)}` : ''}
        </span>
        <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
          →
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
          {/* Header row */}
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)' }}>
            <div className="p-2" />
            {showDays.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold" style={{ color: day === currentDay ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                周{DAYS[day - 1]}
              </div>
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
                      <div key={day} className="p-1 relative flex flex-col gap-0.5" style={{ backgroundColor: holiday ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                        {holiday && makeup ? (
                          <div className="flex-1 flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>补课 · 周{DAYS[makeup.replacesDayOfWeek - 1]}</span>
                          </div>
                        ) : holiday ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-sm italic" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{holiday.name}</span>
                          </div>
                        ) : daySchedules.length === 0 ? (
                          <motion.div
                            className="flex-1 flex items-center justify-center rounded-2xl cursor-pointer"
                            style={{ border: '1px dashed var(--border-light)' }}
                            whileHover={{ borderColor: 'var(--accent-info)', scale: 1.01 }}
                          >
                            <span className="text-lg" style={{ color: 'var(--text-secondary)', opacity: 0 }}>+</span>
                          </motion.div>
                        ) : (
                          daySchedules.map((schedule) => {
                            const course = courseMap.get(schedule.course_id)
                            if (!course) return null
                            const active = isCurrentCourse(schedule)
                            return (
                              <motion.div
                                key={schedule.id}
                                layout
                                onClick={() => setSelectedCourseId(course.id)}
                                className="rounded-2xl p-2 cursor-pointer relative overflow-hidden"
                                style={{
                                  backgroundColor: `${course.color}1A`,
                                  borderLeft: `4px solid ${course.color}`,
                                  boxShadow: active ? `0 0 0 2px var(--accent-warm)` : 'none',
                                }}
                                whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{course.name}</div>
                                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                  {course.teacher !== '—' ? course.teacher : ''}
                                </div>
                                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                                  {schedule.location !== '—' ? schedule.location : ''}
                                </div>
                                {active && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)] animate-pulse" />}
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
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedCourseId && selectedCourse && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedCourseId(null)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="hidden md:block fixed right-0 top-0 z-50 w-[360px] h-full overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)' }}
            >
              <CourseDetailCard course={selectedCourse} schedules={selectedSchedules} assignments={selectedAssignments} memos={selectedMemos} tagCounts={tagCounts} onClose={() => setSelectedCourseId(null)} />
            </motion.div>
            <motion.div
              initial={{ y: '60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '60%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl p-5"
              style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)' }}
            >
              <CourseDetailCard course={selectedCourse} schedules={selectedSchedules} assignments={selectedAssignments} memos={selectedMemos} tagCounts={tagCounts} onClose={() => setSelectedCourseId(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function CourseDetailCard({
  course, schedules, assignments, memos, tagCounts, onClose
}: {
  course: Course
  schedules: CourseSchedule[]
  assignments: Assignment[]
  memos: Memo[]
  tagCounts: Record<string, number>
  onClose: () => void
}) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{course.name}</h2>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full opacity-40 hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>✕</button>
      </div>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {course.teacher !== '—' ? course.teacher : ''}
        {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
        {course.week_type !== 'all' && ` · ${course.week_type === 'odd' ? '单周' : '双周'}`}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {schedules.map((s) => (
          <span key={s.id} className="chip">周{DAY_MAP[s.day_of_week]} {s.start_period}-{s.end_period}节</span>
        ))}
      </div>

      {/* Mood tags */}
      {Object.keys(tagCounts).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>心情标签</p>
          <div className="flex gap-2 flex-wrap">
            {ALL_TAGS.map((tag) => {
              const count = tagCounts[tag] ?? 0
              if (count === 0) return null
              return (
                <motion.span key={tag} whileTap={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.2 }}
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${getMoodColor(tag)}1A`, color: getMoodColor(tag) }}>
                  {tag} ×{count}
                </motion.span>
              )
            })}
          </div>
        </div>
      )}

      {/* Assignments */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📝 作业 ({assignments.length})</p>
        </div>
        {assignments.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无作业</p>
        ) : (
          <div className="space-y-1.5">
            {assignments.slice(0, 5).map((a) => {
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span>{a.status === 'submitted' ? '✅' : '⬜'}</span>
                  <span className="truncate flex-1" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-primary)', opacity: a.status === 'submitted' ? 0.4 : 1 }}>{a.title}</span>
                  <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{formatDateTime(a.due_date).slice(11)}</span>
                </div>
              )
            })}
            {assignments.length > 5 && <Link href={`/courses/${course.id}`} onClick={onClose} className="text-xs block mt-1" style={{ color: 'var(--accent-info)' }}>查看全部 {assignments.length} 项 →</Link>}
          </div>
        )}
      </div>

      {/* Memos */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📌 备忘 ({memos.length})</p>
        </div>
        {memos.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无备忘</p>
        ) : (
          <div className="space-y-2">
            {memos.slice(0, 5).map((m) => (
              <div key={m.id} className="rounded-2xl rounded-tl-sm px-3 py-2" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-sm">{m.mood_emoji}</span>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href={`/courses/${course.id}`} onClick={onClose} className="btn-primary w-full text-center text-sm">
        查看完整详情
      </Link>
    </div>
  )
}
