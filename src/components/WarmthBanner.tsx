"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules, getAssignments } from '@/lib/data'
import { getTodayCourses } from '@/lib/schedule'
import { getCurrentPeriod, PERIOD_TIMES, getPeriodTime } from '@/lib/semester'
import { Course, CourseSchedule } from '@/lib/types'
import { useWarmthBanner } from './WarmthBannerContext'

const MORNING_GREETINGS = ['早上好', '上午好']
const AFTERNOON_GREETINGS = ['下午好', '午后好']
const EVENING_GREETINGS = ['晚上好', '晚间好']

const BUSY_WORDS = ['今天满课，加油呀～', '撑住，课多也有课多的风景', '满课的战士，今天也辛苦了']
const NORMAL_WORDS = ['今天节奏刚好，稳着来 🌿', '按部就班就是胜利', '一步一步，不急不躁']
const LIGHT_WORDS = ['今天课不多，偷得半日闲 ☕', '轻松的一天，享受一下', '放慢脚步也很好']

const ENCOURAGEMENTS = [
  '今天也闪闪发光 ✨',
  '你比自己想象的更棒',
  '再忙也要记得喝水呀 🥤',
  '每一步都算数',
  '保持呼吸，你做得很好',
]

function getCurrentCourseProgress(
  currentPeriod: number | null,
  schedules: CourseSchedule[],
  courses: Course[]
): { course: Course; schedule: CourseSchedule; progress: number } | null {
  if (!currentPeriod) return null

  const now = new Date()
  const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000

  for (const schedule of schedules) {
    if (currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period) {
      const course = courses.find(c => c.id === schedule.course_id)
      if (!course) continue

      const startTime = getPeriodTime(schedule.start_period)
      const endTime = getPeriodTime(schedule.end_period)
      if (!startTime || !endTime) continue

      const [sh, sm] = startTime.start.split(':').map(Number)
      const [eh, em] = endTime.end.split(':').map(Number)
      const startMs = sh * 3600000 + sm * 60000
      const endMs = eh * 3600000 + em * 60000
      const totalDuration = endMs - startMs
      const elapsed = currentMs - startMs
      const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))

      return { course, schedule, progress }
    }
  }
  return null
}

export function WarmthBanner() {
  const { isEnabled, isHiddenToday, hideToday } = useWarmthBanner()
  const [message, setMessage] = useState('')
  const [encouragement, setEncouragement] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setCurrentPeriod(getCurrentPeriod())
    }, 60000)
    setCurrentPeriod(getCurrentPeriod())
    return () => clearInterval(timer)
  }, [])

  const currentCourseInfo = useMemo(() => {
    const todaySchedules = getTodayCourses(schedules)
    return getCurrentCourseProgress(currentPeriod, todaySchedules, courses)
  }, [currentPeriod, schedules, courses, currentTime])

  useEffect(() => {
    if (!isEnabled || isHiddenToday) return

    Promise.all([getCourses(), getSchedules()]).then(([c, s]) => {
      setCourses(c)
      setSchedules(s)
      
      const todayCourses = getTodayCourses(s)
      const count = todayCourses.length

      const hour = new Date().getHours()
      const timeGreetings = hour < 12 ? MORNING_GREETINGS : hour < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS
      const timeGreet = timeGreetings[Math.floor(Math.random() * timeGreetings.length)]

      let pool = BUSY_WORDS
      if (count >= 4) pool = BUSY_WORDS
      else if (count >= 2) pool = NORMAL_WORDS
      else pool = LIGHT_WORDS

      const word = pool[Math.floor(Math.random() * pool.length)]
      setMessage(`${timeGreet}，${count}节课。${word}`)
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])
    })
  }, [isEnabled, isHiddenToday])

  const handleClose = () => {
    hideToday()
  }

  return (
    <AnimatePresence>
      {(isEnabled && !isHiddenToday) && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="mb-4 space-y-3"
        >
          {/* 第一层：问候横幅 */}
          {message && (
            <div className="relative flex items-center px-4 py-3 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderLeft: '4px solid var(--accent-warm)',
              }}
            >
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                  {message}
                </p>
                <p className="text-xs italic truncate" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                  {encouragement}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full opacity-30 hover:opacity-60 transition-opacity text-xs flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="关闭问候"
              >
                ✕
              </button>
            </div>
          )}

          {/* 第二层：当前课程实时条 */}
          {currentCourseInfo && (
            <div className="px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `2px solid ${currentCourseInfo.course.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>🕐 正在上</span>
                  <span className="font-semibold" style={{ color: currentCourseInfo.course.color }}>
                    {currentCourseInfo.course.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    ({currentCourseInfo.schedule.start_period}-{currentCourseInfo.schedule.end_period}节)
                  </span>
                </div>
                <span className="text-sm font-medium" style={{ color: currentCourseInfo.course.color }}>
                  {Math.round(currentCourseInfo.progress)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: `${currentCourseInfo.course.color}26` }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${currentCourseInfo.progress}%`,
                    backgroundColor: currentCourseInfo.course.color,
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
