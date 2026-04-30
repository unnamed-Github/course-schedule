'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CourseSchedule, Course, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos, createMemo } from '@/lib/data'
import { getTodayCourses, getCurrentPeriod } from '@/lib/schedule'
import { getPeriodTime, PERIOD_TIMES } from '@/lib/semester'
import { SkeletonCard } from './Skeleton'
import { useToast } from './ToastProvider'

const EMOJI_OPTIONS = ['😊', '🤔', '😴', '😤', '❤️', '✍️', '💡', '📖']

function addDays(d: Date, days: number) { const r = new Date(d); r.setDate(r.getDate() + days); return r }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

export function DayView() {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [nowMinutes, setNowMinutes] = useState(0)
  const [viewDate, setViewDate] = useState(new Date())
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const loadData = () => {
    setLoadError(false)
    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()])
      .then(([c, sc, a, m]) => { setCourses(c); setSchedules(sc); setAssignments(a); setMemos(m); setLoaded(true) })
      .catch((e) => {
        console.error('DayView load failed:', e)
        setLoadError(true)
        setLoaded(true)
        showToast('加载失败，请检查网络', 'error')
      })
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const tick = () => { const n = new Date(); setCurrentPeriod(getCurrentPeriod(n)); setNowMinutes(n.getHours() * 60 + n.getMinutes()) }
    tick(); const timer = setInterval(tick, 60000); return () => clearInterval(timer)
  }, [])

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const sortedSchedules = getTodayCourses(schedules, viewDate).sort((a, b) => a.start_period - b.start_period)
  const isToday = isSameDay(viewDate, new Date())

  const getCourseProgress = (schedule: CourseSchedule) => {
    if (!isToday || currentPeriod === null) return 0
    if (currentPeriod < schedule.start_period || currentPeriod > schedule.end_period) return 0
    const now = new Date()
    const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000
    const startTime = getPeriodTime(schedule.start_period)
    const endTime = getPeriodTime(schedule.end_period)
    if (!startTime || !endTime) return 0
    const [sh, sm] = startTime.start.split(':').map(Number)
    const [eh, em] = endTime.end.split(':').map(Number)
    const startMs = sh * 3600000 + sm * 60000
    const endMs = eh * 3600000 + em * 60000
    const totalDuration = endMs - startMs
    const elapsed = currentMs - startMs
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }

  if (!loaded) {
    return (
      <div className="max-w-4xl mx-auto space-y-3 pt-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--border-light)', opacity: 0.3 }} />
          <div className="h-6 w-32 rounded" style={{ backgroundColor: 'var(--border-light)', opacity: 0.3 }} />
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--border-light)', opacity: 0.3 }} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto pt-12 text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载失败，请检查网络连接</p>
        <button onClick={loadData} className="btn-primary text-sm">重试</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* 日期导航 */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setViewDate(addDays(viewDate, -1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>←</button>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{viewDate.getMonth() + 1}月{viewDate.getDate()}日</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>周{dayNames[viewDate.getDay()]}</p>
        </div>
        <button onClick={() => setViewDate(addDays(viewDate, 1))} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" style={{ color: 'var(--text-secondary)' }}>→</button>
      </div>

      {!isToday && (
        <div className="text-center">
          <button onClick={() => setViewDate(new Date())} className="btn-ghost text-sm" style={{ color: 'var(--accent-info)' }}>回到今天</button>
        </div>
      )}

      {/* 课程卡片 */}
      {sortedSchedules.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-light)' }}>
          <p className="text-lg mb-2">🎉</p>
          <p style={{ color: 'var(--text-secondary)' }}>今天没有课～好好休息吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSchedules.map((schedule) => {
            const course = courseMap.get(schedule.course_id)
            if (!course) return null
            const startTime = getPeriodTime(schedule.start_period)
            const endTime = getPeriodTime(schedule.end_period)
            const isCurrent = isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
            const progress = getCourseProgress(schedule)
            const isExpanded = expandedCourse === schedule.id

            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: `2px solid ${isCurrent ? course.color : 'var(--border-light)'}`,
                  boxShadow: isCurrent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
              >
                {/* 进度条 */}
                {isCurrent && (
                  <div className="h-1 bg-gray-100 dark:bg-gray-800">
                    <div 
                      className="h-full transition-all duration-1000"
                      style={{ width: `${progress}%`, backgroundColor: course.color }}
                    />
                  </div>
                )}

                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedCourse(isExpanded ? null : schedule.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* 时间 */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-sm font-semibold" style={{ color: isCurrent ? course.color : 'var(--text-primary)' }}>{startTime?.start}</span>
                      <div className="w-px flex-1 min-h-[24px] my-1" style={{ backgroundColor: 'var(--border-light)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{endTime?.end}</span>
                    </div>

                    {/* 颜色条 */}
                    <div className="w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color, marginTop: 2, marginBottom: 2 }} />

                    {/* 课程信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{course.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: course.color }}>进行中 {Math.round(progress)}%</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {course.teacher !== '—' && <span>👨‍🏫 {course.teacher}</span>}
                        {schedule.location !== '—' && <span>📍 {schedule.location}</span>}
                        <span>第{schedule.start_period}-{schedule.end_period}节</span>
                      </div>
                    </div>

                    {/* 展开箭头 */}
                    <div className="text-lg" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {/* 展开详情 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <div className="p-4">
                        <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>课程信息</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>教师</span>
                            <p style={{ color: 'var(--text-primary)' }}>{course.teacher}</p>
                          </div>
                          <div>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>教室</span>
                            <p style={{ color: 'var(--text-primary)' }}>{course.classroom}</p>
                          </div>
                          <div>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>单双周</span>
                            <p style={{ color: 'var(--text-primary)' }}>{course.week_type === 'all' ? '每周' : course.week_type === 'odd' ? '单周' : '双周'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
