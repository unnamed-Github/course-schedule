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
  schedules.forEach((s) => { scheduleCountMap.set(s.course_id, (scheduleCountMap.get(s.course_id) ?? 0) + 1) })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleQuickEdit = (course: Course) => {
    setEditingCard(course.id)
    setEditForm({ name: course.name, teacher: course.teacher, classroom: course.classroom, color: course.color, week_type: course.week_type })
  }

  const handleSaveEdit = async (id: string) => {
    const updated = await updateCourse(id, editForm)
    if (updated) { setCourses((prev) => prev.map((c) => (c.id === id ? updated : c))); setEditingCard(null) }
  }

  const totalWeeks = getSemesterConfig().teachingWeeks

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          📚 课程总览 · {weekNum}/{totalWeeks}周
        </h2>
        <div className="flex items-center gap-2">
          <label className="btn-ghost text-xs cursor-pointer">导入
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
          <button onClick={() => exportToCSV(courses, schedules)} className="btn-ghost text-xs">CSV</button>
          <button onClick={() => exportToExcel(courses, schedules)} className="btn-ghost text-xs">Excel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, index) => {
          const perWeek = scheduleCountMap.get(course.id) ?? 0
          const totalClasses = perWeek * totalWeeks
          const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)
          const courseMemos = memos.filter((m) => m.course_id === course.id)
          const courseAssignments = assignments.filter((a) => a.course_id === course.id)
          const tagCounts: Record<string, number> = {}
          courseMemos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })
          const isExpanded = expandedCard === course.id
          const isEditing = editingCard === course.id

          return (
            <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}88 100%)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/courses/${course.id}`} className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {course.teacher !== '—' ? course.teacher : ''}
                        {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                      </p>
                    </Link>
                    <div className="flex items-center gap-1 ml-2">
                      {course.week_type !== 'all' && <span className="chip">{course.week_type === 'odd' ? '单周' : '双周'}</span>}
                      <button onClick={() => handleQuickEdit(course)} className="text-xs px-1 py-0.5 rounded-lg hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>✏️</button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-light)' }}>
                      <div className="grid grid-cols-2 gap-2">
                        {(['name', 'teacher', 'classroom'] as const).map((f) => (
                          <div key={f}>
                            <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>{f === 'name' ? '课程名' : f === 'teacher' ? '教师' : '教室'}</label>
                            <input value={editForm[f]} onChange={(e) => setEditForm((pf) => ({ ...pf, [f]: e.target.value }))} className="w-full rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                          </div>
                        ))}
                        <div>
                          <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>颜色</label>
                          <input type="color" value={editForm.color} onChange={(e) => setEditForm((pf) => ({ ...pf, color: e.target.value }))} className="w-full h-8 rounded-lg cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>单双周</label>
                          <select value={editForm.week_type} onChange={(e) => setEditForm((pf) => ({ ...pf, week_type: e.target.value as 'all' | 'odd' | 'even' }))} className="w-full rounded-lg px-2 py-1.5 text-xs" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(course.id)} className="rounded-lg px-3 py-1 text-[10px] text-white font-medium" style={{ backgroundColor: 'var(--accent-info)' }}>保存</button>
                        <button onClick={() => setEditingCard(null)} className="btn-ghost text-[10px]">取消</button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 mt-3 flex-wrap">
                    {Array.from({ length: totalClasses }, (_, i) => {
                      const isCompleted = i < completedClasses
                      const isCurrent = i >= completedClasses && i < completedClasses + perWeek
                      return (
                        <div key={i} className="w-2 h-2 rounded-sm" title={`第${Math.floor(i / perWeek) + 1}周`}
                          style={{
                            backgroundColor: isCompleted ? course.color : 'transparent',
                            border: isCurrent && !isCompleted ? '1.5px solid var(--accent-warm)' : isCompleted ? 'none' : '1px dashed var(--border-light)',
                          }} />
                      )
                    })}
                  </div>

                  {Object.keys(tagCounts).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {ALL_TAGS.map((tag) => {
                        const count = tagCounts[tag] ?? 0
                        if (count === 0) return null
                        return (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${getMoodColor(tag)}1A`, color: getMoodColor(tag) }}>{tag} ×{count}</span>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex justify-between mt-3 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    <span>已上 {completedClasses}</span>
                    <span style={{ color: 'var(--accent-success)' }}>剩 {totalClasses - completedClasses}</span>
                  </div>

                  {courseAssignments.length > 0 && (
                    <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                      <button onClick={() => setExpandedCard(isExpanded ? null : course.id)} className="flex items-center gap-1 text-[10px] w-full" style={{ color: 'var(--text-secondary)' }}>
                        <span>{isExpanded ? '▼' : '▶'}</span> 📝 作业 ({courseAssignments.length})
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1">
                          {[...courseAssignments].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5).map((a) => {
                            const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                            const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
                            return (
                              <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                                <span>{a.status === 'submitted' ? '✅' : '⬜'}</span>
                                <span className="truncate" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-secondary)' }}>{a.title}</span>
                              </div>
                            )
                          })}
                          {courseAssignments.length > 5 && <Link href={`/courses/${course.id}`} className="text-[10px] block" style={{ color: 'var(--accent-info)' }}>查看全部 →</Link>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: courses.length * 0.1 }}>
          <div className="rounded-2xl h-full min-h-[180px] flex items-center justify-center cursor-pointer hover:bg-[var(--border-light)] transition-colors"
            style={{ border: '2px dashed var(--border-light)' }}>
            <span className="text-2xl" style={{ color: 'var(--text-secondary)' }}>+</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
