"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules, getAssignments, getScheduleOverrides, createScheduleOverride, deleteScheduleOverride } from '@/lib/data'
import { getTodayCourses } from '@/lib/schedule'
import { getCurrentPeriod, PERIOD_TIMES, getPeriodTime, isHoliday, getWeekNumber, getSemesterConfig } from '@/lib/semester'
import { Course, CourseSchedule, ScheduleOverride } from '@/lib/types'
import { useWarmthBanner } from './WarmthBannerContext'
import { Clock, X, CheckCircle2, RotateCcw } from 'lucide-react'
import { useFestivalGreeting } from './FestivalEasterEgg'
import { useToast } from './ToastProvider'
import { getDailyQuote, type QuoteContext } from '@/lib/daily-quote'
import { useClassFinish, ClassFinishCelebration } from './ClassFinishCelebration'

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

export function WarmthBanner() {
  const { isEnabled, isHiddenToday, hideToday } = useWarmthBanner()
  const { greeting: festivalGreeting, subGreeting: festivalSubGreeting } = useFestivalGreeting()
  const { showToast } = useToast()
  const [message, setMessage] = useState('')
  const [encouragement, setEncouragement] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [viewDate, setViewDate] = useState(new Date())

  const loadOverrides = () => {
    const dateStr = viewDate.toISOString().split('T')[0]
    getScheduleOverrides(dateStr).then(setOverrides).catch(() => setOverrides([]))
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      setCurrentPeriod(getCurrentPeriod())
    }, 60000)
    setCurrentPeriod(getCurrentPeriod())
    loadOverrides()
    return () => clearInterval(timer)
  }, [])

  const overrideMap = useMemo(() => {
    const map = new Map<string, ScheduleOverride>()
    for (const o of overrides) {
      map.set(o.schedule_id, o)
    }
    return map
  }, [overrides])

  const currentCourseInfo = useMemo(() => {
    const todaySchedules = getTodayCourses(schedules)
    for (const schedule of todaySchedules) {
      if (!currentPeriod) continue
      if (currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period) {
        const course = courses.find(c => c.id === schedule.course_id)
        if (!course) continue
        const overrideEntry = overrideMap.get(schedule.id)
        const isEndedEarly = overrideEntry?.type === 'ended_early'
        const startTime = getPeriodTime(schedule.start_period)
        const endTime = getPeriodTime(schedule.end_period)
        if (!startTime || !endTime) continue
        if (isEndedEarly) {
          return { course, schedule, progress: 100, isEndedEarly, isCancelled: overrideEntry?.type === 'cancelled' }
        }
        const now = new Date()
        const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000
        const [sh, sm] = startTime.start.split(':').map(Number)
        const [eh, em] = endTime.end.split(':').map(Number)
        const startMs = sh * 3600000 + sm * 60000
        const endMs = eh * 3600000 + em * 60000
        const totalDuration = endMs - startMs
        const elapsed = currentMs - startMs
        const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
        return { course, schedule, progress, isEndedEarly: false, isCancelled: false }
      }
    }
    return null
  }, [currentPeriod, schedules, courses, currentTime, overrideMap])

  const handleEarlyEnd = async (scheduleId: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    const result = await createScheduleOverride({ schedule_id: scheduleId, date: dateStr, type: 'ended_early' })
    if (result) {
      showToast('已标记提前下课', 'success')
      loadOverrides()
    } else {
      showToast('操作失败，请稍后重试', 'error')
    }
  }

  const handleRevertEarlyEnd = async (scheduleId: string) => {
    const dateStr = new Date().toISOString().split('T')[0]
    const ok = await deleteScheduleOverride(scheduleId, dateStr)
    if (ok) {
      showToast('已恢复', 'success')
      loadOverrides()
    } else {
      showToast('操作失败，请稍后重试', 'error')
    }
  }

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
      if (festivalGreeting) {
        setMessage(`${festivalGreeting} ${festivalSubGreeting}`)
      } else {
        setMessage(`${timeGreet}，${count}节课。${word}`)
      }
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])
    })
  }, [isEnabled, isHiddenToday, festivalGreeting, festivalSubGreeting])

  const handleClose = () => {
    hideToday()
  }

  const { shouldCelebrate, courseName } = useClassFinish(currentCourseInfo)
  const todayCourseList = useMemo(() => getTodayCourses(schedules), [schedules])

  const nextClassInfo = useMemo(() => {
    if (!currentPeriod) return null
    for (const schedule of todayCourseList) {
      if (schedule.start_period > currentPeriod) {
        const course = courses.find(c => c.id === schedule.course_id)
        if (!course) continue
        const startTime = getPeriodTime(schedule.start_period)
        return { course, schedule, startTime }
      }
    }
    return null
  }, [currentPeriod, todayCourseList, courses])
  const dailyQuote = useMemo(() => {
    const now = new Date()
    const holiday = isHoliday(now)
    const weekNum = getWeekNumber(now)
    const config = getSemesterConfig()
    const totalTeaching = config.teachingWeeks
    let semesterPhase: QuoteContext['semesterPhase'] = 'mid'
    if (weekNum <= 2) semesterPhase = 'early'
    else if (weekNum <= Math.floor(totalTeaching * 0.7)) semesterPhase = 'mid'
    else if (weekNum <= totalTeaching) semesterPhase = 'late'
    else if (weekNum <= totalTeaching + config.examWeeks) semesterPhase = 'exam'
    else semesterPhase = 'break'

    return getDailyQuote({
      date: now,
      holiday: holiday ? { name: holiday.name } : null,
      semesterPhase,
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      courseCount: todayCourseList.length,
    })
  }, [schedules, todayCourseList])

  return (
    <>
      <ClassFinishCelebration shouldCelebrate={shouldCelebrate} courseName={courseName} />
      <AnimatePresence>
      {(isEnabled && !isHiddenToday) && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="mb-4 space-y-3"
        >
          {/* 第一层：问候横幅 - 薄荷绿背景，清爽 */}
          {message && (
            <div className="relative flex items-center px-4 py-3 rounded-2xl overflow-hidden glass-strong"
              style={{
                borderLeft: '4px solid var(--accent-warm)',
              }}
            >
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {message}
                </p>
                {dailyQuote && (
                  <p className="text-xs italic mt-1 truncate" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>
                    「{dailyQuote.text}」— {dailyQuote.author}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full opacity-30 hover:opacity-60 transition-opacity flex-shrink-0 cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="关闭问候"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}

          {/* 第二层：当前课程实时条 */}
          {currentCourseInfo && !currentCourseInfo.isCancelled && (
            <div className="px-4 py-3 rounded-2xl glass"
              style={{
                borderLeft: `3px solid ${currentCourseInfo.isEndedEarly ? '#10B981' : currentCourseInfo.course.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Clock size={14} strokeWidth={1.8} />正在上</span>
                  <span className="font-semibold" style={{ color: currentCourseInfo.isEndedEarly ? '#10B981' : currentCourseInfo.course.color }}>
                    {currentCourseInfo.course.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    ({currentCourseInfo.schedule.start_period}-{currentCourseInfo.schedule.end_period}节)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: currentCourseInfo.isEndedEarly ? '#10B981' : currentCourseInfo.course.color }}>
                    {Math.round(currentCourseInfo.progress)}%
                  </span>
                  {currentCourseInfo.isEndedEarly ? (
                    <button
                      onClick={() => handleRevertEarlyEnd(currentCourseInfo.schedule.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <RotateCcw size={12} />
                      恢复
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEarlyEnd(currentCourseInfo.schedule.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: currentCourseInfo.course.color }}
                    >
                      <CheckCircle2 size={12} />
                      提前下课
                    </button>
                  )}
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: currentCourseInfo.isEndedEarly ? '#10B98126' : `${currentCourseInfo.course.color}26` }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${currentCourseInfo.progress}%`,
                    backgroundColor: currentCourseInfo.isEndedEarly ? '#10B981' : currentCourseInfo.course.color,
                  }}
                />
              </div>
            </div>
          )}

          {/* 第三层：下一节课预告 */}
          {!currentCourseInfo && nextClassInfo && (
            <div className="px-4 py-3 rounded-2xl glass-strong"
              style={{
                borderLeft: `3px solid ${nextClassInfo.course.color}80`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>下一节</span>
                  <span className="font-semibold text-sm" style={{ color: nextClassInfo.course.color }}>
                    {nextClassInfo.course.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {nextClassInfo.startTime?.start} · {nextClassInfo.schedule.start_period}-{nextClassInfo.schedule.end_period}节
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {nextClassInfo.startTime?.start}
                </span>
              </div>
            </div>
          )}

          {/* 今天已无课 */}
          {!currentCourseInfo && !nextClassInfo && getTodayCourses(schedules).length > 0 && (
            <div className="px-4 py-3 rounded-2xl glass">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                今天课已上完，好好休息吧 🌙
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
