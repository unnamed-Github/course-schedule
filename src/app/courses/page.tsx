"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Course, CourseSchedule, Memo, MoodTag } from '@/lib/types'
import { getCourses, getSchedules, getMemos } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCourses().then((c) => setCourses(c.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))))
    getSchedules().then(setSchedules)
    getMemos().then(setMemos)
    setWeekNum(getWeekNumber())
  }, [])

  const scheduleCountMap = new Map<string, number>()
  schedules.forEach((s) => {
    scheduleCountMap.set(s.course_id, (scheduleCountMap.get(s.course_id) ?? 0) + 1)
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleImport = async () => {
    setImporting(true)
    await new Promise((r) => setTimeout(r, 500))
    setImporting(false)
    setShowImport(false)
    setImportPreview([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    getCourses().then((c) => setCourses(c.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))))
    getSchedules().then(setSchedules)
  }

  const totalWeeks = 15

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
          课程总览 · 第 {weekNum}/{totalWeeks} 周
        </h2>
        <div className="flex items-center gap-2">
          <label className="btn-ghost text-xs cursor-pointer">
            导入
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
          <button onClick={() => exportToCSV(courses, schedules)} className="btn-ghost text-xs">
            导出 CSV
          </button>
          <button onClick={() => exportToExcel(courses, schedules)} className="btn-ghost text-xs">
            导出 Excel
          </button>
        </div>
      </div>

      {showImport && importPreview.length > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg)' }}>
            导入预览 ({importPreview.length} 条)
          </h3>
          <div className="max-h-36 overflow-auto text-[10px]">
            <table className="w-full">
              <thead>
                <tr style={{ color: 'var(--fg-secondary)' }}>
                  <th className="text-left p-1">课程名</th>
                  <th className="text-left p-1">星期</th>
                  <th className="text-left p-1">节次</th>
                </tr>
              </thead>
              <tbody>
                {(importPreview as Record<string, string>[]).slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-1">{row['课程名']}</td>
                    <td className="p-1">{row['星期']}</td>
                    <td className="p-1">{row['开始节次']}-{row['结束节次']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleImport} disabled={importing} className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90 disabled:opacity-50">
              {importing ? '导入中...' : '确认导入'}
            </button>
            <button onClick={() => { setShowImport(false); setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = '' }} className="btn-ghost text-xs">
              取消
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, index) => {
          const perWeek = scheduleCountMap.get(course.id) ?? 0
          const totalClasses = perWeek * totalWeeks
          const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)

          const courseMemos = memos.filter((m) => m.course_id === course.id)
          const moodCounts: Record<string, number> = {}
          courseMemos.forEach((m) => {
            const emoji = m.mood_emoji || '😊'
            moodCounts[emoji] = (moodCounts[emoji] ?? 0) + 1
          })

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link href={`/courses/${course.id}`} className="block group">
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  {/* Color bar top */}
                  <div style={{ height: 4, backgroundColor: course.color }} />

                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--fg)' }}>
                          {course.name}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                          {course.teacher !== '—' ? course.teacher : ''}
                          {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                        </p>
                      </div>
                      {course.week_type !== 'all' && (
                        <span className="chip text-[10px]" style={{ borderColor: 'var(--border)' }}>
                          {course.week_type === 'odd' ? '单周' : '双周'}
                        </span>
                      )}
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {Array.from({ length: totalClasses }, (_, i) => {
                        const isCompleted = i < completedClasses
                        const isCurrent = i >= completedClasses && i < completedClasses + perWeek
                        return (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-sm transition-all"
                            style={{
                              backgroundColor: isCompleted ? course.color : 'transparent',
                              border: isCurrent && !isCompleted
                                ? `1.5px solid #F59E0B`
                                : isCompleted
                                  ? 'none'
                                  : `1px dashed var(--border)`,
                            }}
                            title={`第${Math.floor(i / perWeek) + 1}周`}
                          />
                        )
                      })}
                    </div>

                    {/* Mood tags */}
                    {Object.keys(moodCounts).length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(moodCounts)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([emoji, count]) => (
                            <span key={emoji} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--border)', color: 'var(--fg-secondary)' }}>
                              {emoji} ×{count}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between mt-3 text-[10px]" style={{ color: 'var(--fg-secondary)' }}>
                      <span>已上 {completedClasses}</span>
                      <span style={{ color: '#10B981' }}>剩 {totalClasses - completedClasses}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}

        {/* Add course placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: courses.length * 0.04 }}
        >
          <div
            className="rounded-2xl h-full min-h-[180px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              border: '2px dashed var(--border)',
            }}
          >
            <span className="text-2xl" style={{ color: 'var(--fg-secondary)', opacity: 0.4 }}>+</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
