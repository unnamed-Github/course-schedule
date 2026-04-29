"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CourseSchedule, Course, Assignment, Memo, MoodTag } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getCurrentPeriod, getWeekNumber, getWeekDateRange, getMakeupInfo, isHoliday } from '@/lib/schedule'
import { getPeriodTime } from '@/lib/semester'

const DAYS = ['一', '二', '三', '四', '五', '六', '日']
const PERIOD_GROUPS = [
  { label: '1-2节', start: 1, end: 2, time: '08:00-09:50' },
  { label: '3-4节', start: 3, end: 4, time: '10:20-12:10' },
  { label: '5-6节', start: 5, end: 6, time: '14:00-15:50' },
  { label: '7-8节', start: 7, end: 8, time: '16:20-18:10' },
  { label: '9-10节', start: 9, end: 10, time: '19:00-20:50' },
  { label: '11节', start: 11, end: 11, time: '21:00-22:30' },
]

const ALL_TAGS: MoodTag[] = ['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待']

function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

  const changeWeek = (delta: number) => {
    const newWeek = weekNum + delta
    setWeekNum(newWeek)
    setWeekRange(getWeekDateRange(newWeek))
    setCurrentDay(0)
    setCurrentPeriod(null)
  }

  const courseMap = new Map(courses.map((c) => [c.id, c]))

  const today = new Date()
  const holiday = isHoliday(today)
  const makeup = getMakeupInfo(today)

  const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`

  const showDays = [1, 2, 3, 4, 5]

  const memoCountMap = new Map<string, number>()
  if (weekRange) {
    memos.forEach((m) => {
      const memoDate = m.created_at.slice(0, 10)
      const weekStart = formatDateStr(weekRange.start)
      const weekEnd = formatDateStr(weekRange.end)
      if (memoDate >= weekStart && memoDate <= weekEnd) {
        memoCountMap.set(m.course_id, (memoCountMap.get(m.course_id) ?? 0) + 1)
      }
    })
  }

  function isCurrentCourse(schedule: CourseSchedule) {
    if (currentDay === 0 || currentPeriod === null) return false
    return (
      schedule.day_of_week === currentDay &&
      currentPeriod >= schedule.start_period &&
      currentPeriod <= schedule.end_period
    )
  }

  // Detail panel data
  const selectedCourse = selectedCourseId ? courseMap.get(selectedCourseId) ?? null : null
  const selectedSchedules = selectedCourseId ? schedules.filter((s) => s.course_id === selectedCourseId) : []
  const selectedAssignments = selectedCourseId
    ? assignments.filter((a) => a.course_id === selectedCourseId).sort((a, b) => a.due_date.localeCompare(b.due_date))
    : []
  const selectedMemos = selectedCourseId
    ? memos.filter((m) => m.course_id === selectedCourseId)
    : []

  // Tag counts for selected course
  const selectedTagCounts: Record<string, number> = {}
  selectedMemos.forEach((m) => {
    m.mood_tags?.forEach((t) => { selectedTagCounts[t] = (selectedTagCounts[t] ?? 0) + 1 })
  })

  const DAY_MAP: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五' }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Week Switcher */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeWeek(-1)}
          className="btn-ghost"
          style={{ color: 'var(--fg-secondary)' }}
        >
          ← 上一周
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
            第 {weekNum}/15 周
          </h2>
          {weekRange && (
            <p className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
              {formatDate(weekRange.start)} — {formatDate(weekRange.end)}
            </p>
          )}
        </div>
        <button
          onClick={() => changeWeek(1)}
          className="btn-ghost"
          style={{ color: 'var(--fg-secondary)' }}
        >
          下一周 →
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div
            className="grid rounded-t-2xl overflow-hidden"
            style={{
              gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="p-2" />
            {showDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold"
                style={{
                  color: day === currentDay ? 'var(--fg)' : 'var(--fg-secondary)',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                周{DAYS[day - 1]}
              </div>
            ))}
          </div>

          {/* Period rows */}
          <AnimatePresence mode="wait">
            <motion.div
              key={weekNum}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-b-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)', borderTop: 'none' }}
            >
              {PERIOD_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="grid"
                  style={{
                    gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`,
                    borderBottom: '1px solid var(--border)',
                    minHeight: '72px',
                  }}
                >
                  {/* Period label */}
                  <div
                    className="p-2 flex flex-col justify-center text-right pr-3"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--fg-secondary)' }}>
                      {group.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--fg-secondary)', opacity: 0.6 }}>
                      {group.time}
                    </span>
                  </div>

                  {/* Day cells */}
                  {showDays.map((day) => {
                    const daySchedules = schedules.filter(
                      (s) => {
                        if (s.day_of_week !== day) return false
                        if (s.week_type === 'odd' && weekNum % 2 === 0) return false
                        if (s.week_type === 'even' && weekNum % 2 !== 0) return false
                        if (s.start_period > group.end || s.end_period < group.start) return false
                        return true
                      }
                    )

                    return (
                      <div
                        key={day}
                        className="p-0.5 relative flex flex-col gap-0.5"
                        style={{
                          borderLeft: '1px solid var(--border)',
                          backgroundColor: holiday && day === makeup?.replacesDayOfWeek
                            ? 'rgba(245, 158, 11, 0.05)'
                            : holiday ? 'rgba(0,0,0,0.02)' : 'transparent',
                        }}
                      >
                        {holiday && day === makeup?.replacesDayOfWeek ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
                              补课 · {DAYS[makeup.replacesDayOfWeek - 1]}
                            </span>
                          </div>
                        ) : holiday ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px]" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>
                              {holiday?.name}
                            </span>
                          </div>
                        ) : daySchedules.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center m-0.5 rounded-lg" style={{ border: '1px dashed var(--border)', opacity: 0.4 }}>
                            <span className="text-[10px]" style={{ color: 'var(--fg-secondary)', opacity: 0.3 }}>
                              可添加
                            </span>
                          </div>
                        ) : (
                          daySchedules.map((schedule) => {
                            const course = courseMap.get(schedule.course_id)
                            if (!course) return null
                            const active = isCurrentCourse(schedule)
                            const memoCount = memoCountMap.get(schedule.course_id) ?? 0
                            return (
                              <motion.div
                                key={schedule.id}
                                layout
                                onClick={() => setSelectedCourseId(course.id)}
                                className="rounded-lg px-2 py-1 text-xs cursor-pointer relative overflow-hidden group"
                                style={{
                                  backgroundColor: active
                                    ? `${course.color}18`
                                    : `${course.color}0D`,
                                  borderLeft: `3px solid ${course.color}`,
                                  boxShadow: active ? '0 0 0 2px rgba(245, 158, 11, 0.3)' : 'none',
                                }}
                                whileHover={{ scale: 1.02 }}
                              >
                                <div className="font-semibold truncate pr-3" style={{ color: course.color }}>
                                  {course.name}
                                </div>
                                <div className="truncate text-[10px] mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                                  {schedule.location !== '—' ? schedule.location : ''}
                                </div>
                                {active && (
                                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                                )}
                                {memoCount > 0 && !active && (
                                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#10B981]" title={`${memoCount}条备忘`} />
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
        </div>
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedCourseId && selectedCourse && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              onClick={() => setSelectedCourseId(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-5"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedCourseId(null)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--fg-secondary)' }}
              >
                ✕
              </button>

              {/* Course header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: selectedCourse.color }}
                >
                  {selectedCourse.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold" style={{ color: 'var(--fg)' }}>{selectedCourse.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                    {selectedCourse.teacher !== '—' && `${selectedCourse.teacher} · `}
                    {selectedCourse.classroom !== '—' ? selectedCourse.classroom : ''}
                    {selectedCourse.week_type !== 'all' && ` · ${selectedCourse.week_type === 'odd' ? '单周' : '双周'}`}
                  </p>
                </div>
              </div>

              {/* Schedule times */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedSchedules.map((s) => (
                  <span key={s.id} className="chip text-[10px]" style={{ borderColor: 'var(--border)' }}>
                    周{DAY_MAP[s.day_of_week]} {s.start_period}-{s.end_period}节
                  </span>
                ))}
              </div>

              {/* Mood tags */}
              {Object.keys(selectedTagCounts).length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] mb-1.5" style={{ color: 'var(--fg-secondary)' }}>心情标签</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => {
                      const count = selectedTagCounts[tag] ?? 0
                      if (count === 0) return null
                      return (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: tag === '⭐喜欢' ? 'rgba(245,158,11,0.1)' : tag === '🥱苟住' ? 'rgba(107,114,128,0.1)' : tag === '💪硬扛' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            color: tag === '⭐喜欢' ? '#F59E0B' : tag === '🥱苟住' ? '#6B7280' : tag === '💪硬扛' ? '#EF4444' : '#10B981',
                          }}>
                          {tag} ×{count}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Assignments */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
                    作业 ({selectedAssignments.length})
                  </p>
                  <Link
                    href={`/courses/${selectedCourseId}`}
                    className="text-[10px]"
                    style={{ color: '#F59E0B' }}
                    onClick={() => setSelectedCourseId(null)}
                  >
                    全部 →
                  </Link>
                </div>
                {selectedAssignments.length === 0 ? (
                  <p className="text-[10px] py-1" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
                ) : (
                  <div className="space-y-1">
                    {selectedAssignments.slice(0, 5).map((a) => {
                      const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                      const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
                      return (
                        <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                          <span>{a.status === 'submitted' ? '✅' : '📝'}</span>
                          <span className="truncate" style={{ color: isOverdue ? '#EF4444' : isNear ? '#F59E0B' : 'var(--fg-secondary)' }}>
                            {a.title}
                          </span>
                          <span className="flex-shrink-0" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>
                            {formatDateTime(a.due_date).slice(5)}
                          </span>
                          {isOverdue && <span className="text-[#EF4444]">⚠️</span>}
                          {isNear && <span className="text-[#F59E0B]">⏰</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Memos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium" style={{ color: 'var(--fg-secondary)' }}>
                    备忘 ({selectedMemos.length})
                  </p>
                  <Link
                    href={`/courses/${selectedCourseId}`}
                    className="text-[10px]"
                    style={{ color: '#F59E0B' }}
                    onClick={() => setSelectedCourseId(null)}
                  >
                    全部 →
                  </Link>
                </div>
                {selectedMemos.length === 0 ? (
                  <p className="text-[10px] py-1" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedMemos.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <span className="text-sm flex-shrink-0">{m.mood_emoji}</span>
                        <div className="min-w-0">
                          <p className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>{m.content}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-secondary)', opacity: 0.4 }}>
                            {formatDateTime(m.created_at).slice(5)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer action */}
              <div className="mt-4 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                <Link
                  href={`/courses/${selectedCourseId}`}
                  className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90"
                  onClick={() => setSelectedCourseId(null)}
                >
                  查看完整详情
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
