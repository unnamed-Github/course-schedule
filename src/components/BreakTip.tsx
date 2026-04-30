'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules } from '@/lib/data'
import { getTodayCourses } from '@/lib/schedule'
import { getCurrentPeriod, PERIOD_TIMES, getPeriodTime } from '@/lib/semester'
import { CourseSchedule } from '@/lib/types'
import { Lightbulb } from 'lucide-react'

const BREAK_TIPS = [
  '站起来伸个懒腰吧 🙆',
  '喝口水补充能量 💧',
  '看看窗外休息一下眼睛 👀',
  '深呼吸三次，放松一下 🌬️',
  '下节课加油！💪',
  '课间听首歌放松一下吧 🎵',
  '活动一下脖子，转转肩膀 🤸',
  '和同学聊聊天也不错 💬',
  '整理一下下节课的笔记 📝',
  '去走廊走走，呼吸新鲜空气 🌿',
  '闭眼休息一分钟 😌',
  '吃点小零食补充体力 🍫',
]

function isInBreak(schedules: CourseSchedule[]): boolean {
  const currentPeriod = getCurrentPeriod()
  if (currentPeriod !== null) return false

  const now = new Date()
  const currentMs = now.getHours() * 3600000 + now.getMinutes() * 60000

  const todaySchedules = schedules.filter(s => {
    const start = PERIOD_TIMES[s.start_period]
    const end = PERIOD_TIMES[s.end_period]
    if (!start || !end) return false
    const [, sm] = start.start.split(':').map(Number)
    const [eh, em] = end.end.split(':').map(Number)
    const startMs = now.getHours() * 3600000 + sm * 60000
    const endMs = eh * 3600000 + em * 60000
    if (currentMs < startMs || currentMs > endMs) return false
    return true
  })

  if (todaySchedules.length === 0) return false

  let earliestStart = Infinity
  let latestEnd = 0
  for (const s of todaySchedules) {
    const startTime = getPeriodTime(s.start_period)
    const endTime = getPeriodTime(s.end_period)
    if (!startTime || !endTime) continue
    const [sh, sm] = startTime.start.split(':').map(Number)
    const [eh, em] = endTime.end.split(':').map(Number)
    const startMs = sh * 3600000 + sm * 60000
    const endMs = eh * 3600000 + em * 60000
    earliestStart = Math.min(earliestStart, startMs)
    latestEnd = Math.max(latestEnd, endMs)
  }

  return currentMs >= earliestStart && currentMs <= latestEnd
}

function pickTip(): string {
  let lastIdx = -1
  try {
    lastIdx = parseInt(localStorage.getItem('last_break_tip_idx') ?? '-1')
  } catch {}
  let idx: number
  do {
    idx = Math.floor(Math.random() * BREAK_TIPS.length)
  } while (idx === lastIdx && BREAK_TIPS.length > 1)
  try { localStorage.setItem('last_break_tip_idx', idx.toString()) } catch {}
  return BREAK_TIPS[idx]
}

export function BreakTip() {
  const [visible, setVisible] = useState(false)
  const [tip, setTip] = useState('')
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])

  useEffect(() => {
    getSchedules().then(s => setSchedules(s)).catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => {
      if (!isInBreak(schedules)) {
        setVisible(false)
        return
      }
      if (visible) return
      setTip(pickTip())
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 6000)
      return () => clearTimeout(timer)
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [schedules, visible])

  return (
    <AnimatePresence>
      {visible && tip && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-2"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <Lightbulb size={16} strokeWidth={1.8} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
