"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'

const ENCOURAGEMENTS = [
  { min: 80, text: '这一周太棒了！你的努力都被看见了。' },
  { min: 50, text: '稳扎稳打，每一步都算数。' },
  { min: 30, text: '有些日子就是慢一点，没关系。' },
  { min: 0, text: '这周可能不容易，下周会更好。' },
]

export function WeeklySummary() {
  const [stats, setStats] = useState({ courses: 0, submitted: 0, total: 0, memos: 0, week: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const now = new Date()
    const dow = now.getDay()
    const isWeekend = dow === 0 || dow === 6

    if (!isWeekend) return

    const currentWeek = getWeekNumber(now)
    const lastShown = localStorage.getItem('summary_last_week')
    if (lastShown === String(currentWeek)) return

    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()]).then(([, schedules, assignments, memos]) => {
      const weekNum = currentWeek
      const weekSchedules = schedules.filter((s) => {
        if (s.week_type === 'odd' && weekNum % 2 === 0) return false
        if (s.week_type === 'even' && weekNum % 2 !== 0) return false
        return true
      })
      const submitted = assignments.filter((a) => a.status === 'submitted')
      setStats({ courses: weekSchedules.length, submitted: submitted.length, total: assignments.length, memos: memos.length, week: weekNum })
      setVisible(true)
      localStorage.setItem('summary_last_week', String(weekNum))
    })
  }, [])

  const rate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0
  const encouragement = ENCOURAGEMENTS.find((e) => rate >= e.min) ?? ENCOURAGEMENTS[ENCOURAGEMENTS.length - 1]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}
          className="mt-6 mx-auto max-w-sm">
          <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>🎉 第{stats.week}周总结</p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div><span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.courses}</span><span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>节课</span></div>
              <div className="w-px h-5" style={{ backgroundColor: 'var(--border-light)' }} />
              <div><span className="text-xl font-bold" style={{ color: 'var(--accent-success)' }}>{rate}%</span><span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>完成率</span></div>
              <div className="w-px h-5" style={{ backgroundColor: 'var(--border-light)' }} />
              <div><span className="text-xl font-bold" style={{ color: 'var(--accent-warm)' }}>{stats.memos}</span><span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>备忘</span></div>
            </div>
            <p className="text-sm mt-3 italic" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>
              {encouragement.text}
            </p>
            <button onClick={() => setVisible(false)} className="mt-4 btn-ghost text-xs">知道了</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
