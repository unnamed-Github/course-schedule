"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Course, CourseSchedule, Assignment, Memo, MoodTag, getMoodColor } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos, updateCourse } from '@/lib/data'
import { getWeekNumber, getSemesterConfig } from '@/lib/semester'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'

const ALL_TAGS: MoodTag[] = ['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待']

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [importing, setImporting] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', teacher: '', classroom: '', color: '', week_type: 'all' as 'all' | 'odd' | 'even' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCourses().then((c) => setCourses(c.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))))
    getSchedules().then(setSchedules)
    getAssignments().then(setAssignments)
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

  const handleQuickEdit = (course: Course) => {
    setEditingCard(course.id)
    setEditForm({ name: course.name, teacher: course.teacher, classroom: course.classroom, color: course.color, week_type: course.week_type })
  }

  const handleSaveEdit = async (id: string) => {
    const updated = await updateCourse(id, editForm)
    if (updated) {
      setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)))
      setEditingCard(null)
    }
  }

  const totalWeeks = getSemesterConfig().teachingWeeks

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
          const courseAssignments = assignments.filter((a) => a.course_id === course.id)

          // Mood tag counts
          const tagCounts: Record<string, number> = {}
          courseMemos.forEach((m) => {
            m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 })
          })

          const isExpanded = expandedCard === course.id
          const isEditing = editingCard === course.id

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div
                className="rounded-2xl overflow-hidden transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                {/* Color bar top */}
                <div style={{ height: 4, backgroundColor: course.color }} />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <Link href={`/courses/${course.id}`} className="flex-1 min-w-0 group">
                      <h3 className="text-base font-semibold group-hover:opacity-80 transition-opacity" style={{ color: 'var(--fg)' }}>
                        {course.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                        {course.teacher !== '—' ? course.teacher : ''}
                        {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {course.week_type !== 'all' && (
                        <span className="chip text-[10px]" style={{ borderColor: 'var(--border)' }}>
                          {course.week_type === 'odd' ? '单周' : '双周'}
                        </span>
                      )}
                      <button onClick={() => handleQuickEdit(course)} className="text-[10px] px-1.5 py-0.5 rounded-lg hover:opacity-60" style={{ color: 'var(--fg-secondary)' }} title="快速编辑">
                        ✏️
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                      <div className="grid grid-cols-2 gap-2">
                        {(['name', 'teacher', 'classroom'] as const).map((field) => (
                          <div key={field}>
                            <label className="text-[10px] block mb-0.5" style={{ color: 'var(--fg-secondary)' }}>
                              {field === 'name' ? '课程名' : field === 'teacher' ? '教师' : '教室'}
                            </label>
                            <input
                              value={editForm[field]}
                              onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                              className="w-full rounded-lg px-2 py-1.5 text-xs"
                              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                            />
                          </div>
                        ))}
                        <div>
                          <label className="text-[10px] block mb-0.5" style={{ color: 'var(--fg-secondary)' }}>颜色</label>
                          <input type="color" value={editForm.color} onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))} className="w-full h-8 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] block mb-0.5" style={{ color: 'var(--fg-secondary)' }}>单双周</label>
                          <select value={editForm.week_type} onChange={(e) => setEditForm((f) => ({ ...f, week_type: e.target.value as 'all' | 'odd' | 'even' }))}
                            className="w-full rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                            <option value="all">每周</option>
                            <option value="odd">单周</option>
                            <option value="even">双周</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(course.id)} className="rounded-lg px-3 py-1 text-[10px] text-white font-medium bg-[#F59E0B] hover:opacity-90">保存</button>
                        <button onClick={() => setEditingCard(null)} className="btn-ghost text-[10px]">取消</button>
                      </div>
                    </div>
                  )}

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

                  {/* Mood tag stats */}
                  {Object.keys(tagCounts).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {ALL_TAGS.map((tag) => {
                        const count = tagCounts[tag] ?? 0
                        if (count === 0) return null
                        return (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${getMoodColor(tag)}1A`,
                              color: getMoodColor(tag),
                            }}>
                            {tag} ×{count}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between mt-3 text-[10px]" style={{ color: 'var(--fg-secondary)' }}>
                    <span>已上 {completedClasses}</span>
                    <span style={{ color: '#10B981' }}>剩 {totalClasses - completedClasses}</span>
                  </div>

                  {/* Collapsed assignment list */}
                  {courseAssignments.length > 0 && (
                    <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button
                        onClick={() => setExpandedCard(isExpanded ? null : course.id)}
                        className="flex items-center gap-1 text-[10px] w-full"
                        style={{ color: 'var(--fg-secondary)' }}
                      >
                        <span>{isExpanded ? '▼' : '▶'}</span>
                        <span>作业 ({courseAssignments.length})</span>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1">
                          {[...courseAssignments].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5).map((a) => {
                            const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                            const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
                            return (
                              <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                                <span>{a.status === 'submitted' ? '✅' : '📝'}</span>
                                <span className="truncate" style={{ color: isOverdue ? '#EF4444' : isNear ? '#F59E0B' : 'var(--fg-secondary)' }}>
                                  {a.title}
                                </span>
                                {isOverdue && <span className="text-[#EF4444]">⚠️</span>}
                                {isNear && <span className="text-[#F59E0B]">⏰</span>}
                              </div>
                            )
                          })}
                          {courseAssignments.length > 5 && (
                            <Link href={`/courses/${course.id}`} className="text-[10px] block" style={{ color: '#F59E0B' }}>
                              查看全部 {courseAssignments.length} 项 →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
