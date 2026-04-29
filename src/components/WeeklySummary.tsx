"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'

const ENCOURAGEMENTS = [
  { min: 80, text: '这周太棒了！你的努力竹都看在眼里 🎋' },
  { min: 50, text: '稳扎稳打，每一步都算数 💪' },
  { min: 30, text: '有些日子就是慢一点，没关系 🌱' },
  { min: 0, text: '这周可能不容易，下周会更好 🌿' },
]

export function WeeklySummary() {
  const [stats, setStats] = useState({ courses: 0, assignmentsSubmitted: 0, assignmentsTotal: 0, memos: 0, week: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const now = new Date()
    const dow = now.getDay()
    const isWeekend = dow === 0 || dow === 6

    if (!isWeekend) {
      const lastShown = localStorage.getItem('summary_last_week')
      if (lastShown === String(getWeekNumber(now))) return
    }

    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()]).then(
      ([, schedules, assignments, memos]) => {
        const weekNum = getWeekNumber()
        const weekSchedules = schedules.filter((s) => {
          if (s.week_type === 'odd' && weekNum % 2 === 0) return false
          if (s.week_type === 'even' && weekNum % 2 !== 0) return false
          return true
        })
        const submitted = assignments.filter((a) => a.status === 'submitted')

        setStats({
          courses: weekSchedules.length,
          assignmentsSubmitted: submitted.length,
          assignmentsTotal: assignments.length,
          memos: memos.length,
          week: weekNum,
        })
        setVisible(true)
        localStorage.setItem('summary_last_week', String(weekNum))
      }
    )
  }, [])

  const { assignmentsSubmitted, assignmentsTotal } = stats
  const completionRate = assignmentsTotal > 0 ? Math.round((assignmentsSubmitted / assignmentsTotal) * 100) : 0

  const encouragement = ENCOURAGEMENTS.find((e) => completionRate >= e.min) ?? ENCOURAGEMENTS[ENCOURAGEMENTS.length - 1]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mt-6 mx-auto max-w-sm"
        >
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.02))',
              border: '1px solid rgba(245, 158, 11, 0.15)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
              第 {stats.week} 周小结
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div>
                <span className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{stats.courses}</span>
                <span className="text-xs ml-1" style={{ color: 'var(--fg-secondary)' }}>节课</span>
              </div>
              <div className="w-px h-5" style={{ backgroundColor: 'var(--border)' }} />
              <div>
                <span className="text-xl font-bold" style={{ color: 'var(--success)' }}>{completionRate}%</span>
                <span className="text-xs ml-1" style={{ color: 'var(--fg-secondary)' }}>
                  完成率
                </span>
              </div>
              <div className="w-px h-5" style={{ backgroundColor: 'var(--border)' }} />
              <div>
                <span className="text-xl font-bold" style={{ color: '#F59E0B' }}>{stats.memos}</span>
                <span className="text-xs ml-1" style={{ color: 'var(--fg-secondary)' }}>备忘</span>
              </div>
            </div>
            <p className="text-xs mt-3 italic" style={{ color: 'var(--fg-secondary)', opacity: 0.7 }}>
              {encouragement.text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
