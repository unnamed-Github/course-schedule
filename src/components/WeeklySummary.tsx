"use client"

import { useEffect, useState } from 'react'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'
import { CourseSchedule } from '@/lib/types'

export function WeeklySummary() {
  const [stats, setStats] = useState({ courses: 0, assignments: 0, memos: 0, week: 0 })

  useEffect(() => {
    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()]).then(
      ([courses, schedules, assignments, memos]) => {
        const weekNum = getWeekNumber()
        const weekSchedules = schedules.filter((s) => {
          if (s.week_type === 'odd' && weekNum % 2 === 0) return false
          if (s.week_type === 'even' && weekNum % 2 !== 0) return false
          return true
        })

        const submittedAssignments = assignments.filter(
          (a) => a.status === 'submitted'
        )

        setStats({
          courses: weekSchedules.length,
          assignments: submittedAssignments.length,
          memos: memos.length,
          week: weekNum,
        })
      }
    )
  }, [])

  if (stats.week === 0) return null

  return (
    <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card p-4 mt-4 text-center">
      <p className="text-xs text-ink-light dark:text-sand/50">第 {stats.week} 周小结</p>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div>
          <span className="text-lg font-semibold text-ink dark:text-sand">{stats.courses}</span>
          <span className="text-xs text-ink-light dark:text-sand/50 ml-1">节课</span>
        </div>
        <div className="w-px h-6 bg-sand/30 dark:bg-ink-light/20" />
        <div>
          <span className="text-lg font-semibold text-rust dark:text-terracotta">{stats.assignments}</span>
          <span className="text-xs text-ink-light dark:text-sand/50 ml-1">作业 ✓</span>
        </div>
        <div className="w-px h-6 bg-sand/30 dark:bg-ink-light/20" />
        <div>
          <span className="text-lg font-semibold text-moss dark:text-sage">{stats.memos}</span>
          <span className="text-xs text-ink-light dark:text-sand/50 ml-1">备忘</span>
        </div>
      </div>
    </div>
  )
}
