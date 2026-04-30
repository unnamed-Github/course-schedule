'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CourseSchedule, Course, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getCurrentPeriod, getWeekNumber, getWeekDateRange, isHoliday, getMakeupInfo } from '@/lib/schedule'
import { PERIOD_TIMES } from '@/lib/semester'
import { SkeletonGrid } from './Skeleton'
import { useToast } from './ToastProvider'

const DAYS = ['一', '二', '三', '四', '五']
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

export function WeekView() {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(0)
  const [expandedSchedule, setExpandedSchedule] = useState<CourseSchedule | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const loadData = () => {
    setLoadError(false)
    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()])
      .then(([c, sc, a, m]) => { setCourses(c); setSchedules(sc); setAssignments(a); setMemos(m); setLoaded(true) })
      .catch((e) => {
        console.error('WeekView load failed:', e)
        setLoadError(true)
        setLoaded(true)
        showToast('加载失败，请检查网络', 'error')
      })
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
    const newWeek = weekNum + delta
    setWeekNum(newWeek)
    setWeekRange(getWeekDateRange(newWeek))
    setCurrentDay(0)
    setCurrentPeriod(null)
    setExpandedSchedule(null)
  }, [weekNum])

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

  const showDays = [1, 2, 3, 4, 5]

  function isCurrentCourse(schedule: CourseSchedule) {
    if (currentDay === 0 || currentPeriod === null) return false
    
    // Check week_type
    if (schedule.week_type === 'odd' && weekNum % 2 === 0) return false
    if (schedule.week_type === 'even' && weekNum % 2 !== 0) return false
    
    return schedule.day_of_week === currentDay && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
  }

  const getCourseAssignmentCount = (courseId: string) => {
    return assignments.filter(a => a.course_id === courseId && a.status === 'pending').length
  }

  if (!loaded) return <SkeletonGrid />
  if (loadError) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载失败，请检查网络连接</p>
        <button onClick={loadData} className="btn-primary text-sm">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 周切换 */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => changeWeek(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>←</button>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>第{weekNum}/15周 · {weekRange ? `${weekRange.start.getMonth() + 1}月${weekRange.start.getDate()}日-${weekRange.end.getMonth() + 1}月${weekRange.end.getDate()}日` : ''}</span>
        <button onClick={() => changeWeek(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>→</button>
      </div>

      {/* 课表网格 */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
          {/* 星期标题 */}
          <div className="grid" style={{ gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
            <div className="p-3" />
            {showDays.map((day) => (
              <div key={day} className="p-3 text-center">
                <span className="text-sm font-semibold" style={{ color: day === currentDay ? 'var(--accent-info)' : 'var(--text-secondary)' }}>
                  周{DAYS[day - 1]}
                </span>
              </div>
            ))}
          </div>

          {/* 时间段行 */}
          {PERIOD_GROUPS.map((group) => (
            <div key={group.label} className="grid" style={{ gridTemplateColumns: `100px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)', minHeight: '90px' }}>
              <div className="p-3 flex flex-col justify-center text-right" style={{ backgroundColor: 'var(--bg-card)' }}>
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
                  <div key={day} className="p-2 flex flex-col gap-2" style={{ backgroundColor: holiday ? 'var(--holiday-cell)' : 'transparent' }}>
                    {holiday && makeup ? (
                      <div className="flex-1 flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: 'var(--makeup-badge)' }}>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>补课</span>
                      </div>
                    ) : holiday ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-sm italic" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{holiday.name}</span>
                      </div>
                    ) : daySchedules.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ border: '1px dashed var(--border-light)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>无课程</span>
                      </div>
                    ) : (
                      daySchedules.map((schedule) => {
                        const course = courseMap.get(schedule.course_id)
                        if (!course) return null
                        const active = isCurrentCourse(schedule)
                        const isExpanded = expandedSchedule?.id === schedule.id
                        const assignmentCount = getCourseAssignmentCount(course.id)

                        return (
                          <motion.div
                            key={schedule.id}
                            onClick={() => setExpandedSchedule(isExpanded ? null : schedule)}
                            className="rounded-2xl p-3 cursor-pointer relative overflow-hidden"
                            style={{
                              backgroundColor: course.color,
                              color: 'white',
                              ...(active ? { boxShadow: '0 0 0 3px var(--accent-warm)' } : {}),
                            }}
                            whileHover={{ scale: 1.02, boxShadow: active ? '0 0 0 3px var(--accent-warm)' : 'var(--shadow-md)' }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold truncate">{course.name}</div>
                                <div className="text-xs opacity-80 truncate mt-0.5">{schedule.location !== '—' ? schedule.location : ''}</div>
                              </div>
                              {assignmentCount > 0 && (
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                  <span className="text-xs font-bold" style={{ color: course.color }}>{assignmentCount}</span>
                                </div>
                              )}
                            </div>

                            {/* 展开详情 */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-2 border-t border-white/20">
                                    {course.teacher !== '—' && (
                                      <p className="text-xs opacity-80 mb-1">👨‍🏫 {course.teacher}</p>
                                    )}
                                    <p className="text-xs opacity-80">📅 第{schedule.start_period}-{schedule.end_period}节</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
