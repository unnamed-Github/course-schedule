"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'

export function WeeklySummary() {
  const [stats, setStats] = useState({ courses: 0, assignments: 0, memos: 0, week: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
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
          assignments: submitted.length,
          memos: memos.length,
          week: weekNum,
        })
        setVisible(true)
      }
    )
  }, [])

  const totalAssignments = stats.assignments
  const completionRate = totalAssignments > 0 ? Math.round((stats.assignments / Math.max(stats.assignments, 1)) * 100) : 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={visible ? { opacity: 1, scale: 1 } : {}}
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
            <span className="text-xl font-bold" style={{ color: '#10B981' }}>{stats.assignments}</span>
            <span className="text-xs ml-1" style={{ color: 'var(--fg-secondary)' }}>作业 ✓</span>
          </div>
          <div className="w-px h-5" style={{ backgroundColor: 'var(--border)' }} />
          <div>
            <span className="text-xl font-bold" style={{ color: '#F59E0B' }}>{stats.memos}</span>
            <span className="text-xs ml-1" style={{ color: 'var(--fg-secondary)' }}>备忘</span>
          </div>
        </div>
        <p className="text-xs mt-3 italic" style={{ color: 'var(--fg-secondary)', opacity: 0.7 }}>
          每一节课都有它的意义 🌱
        </p>
      </div>
    </motion.div>
  )
}
