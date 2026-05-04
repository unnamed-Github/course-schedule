"use client"

import { useEffect, useState, useRef } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { Course, CourseSchedule, Assignment, Memo, MoodTag, getMoodColor } from '@/lib/types'
import { updateCourse, deleteCourse, createCourse, createSchedule, updateSchedule, deleteSchedule } from '@/lib/data'
import { useData } from '@/components/DataContext'
import { getWeekNumber, getSemesterConfig, getDayDate, getCurrentPeriod, PERIOD_TIMES, isHoliday } from '@/lib/semester'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/ToastProvider'
import { ChevronDown, ChevronRight, Check, Square, Pencil, Trash2, Plus } from 'lucide-react'

const ALL_TAGS: MoodTag[] = ['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待']

export default function CoursesPage() {
  const { showToast } = useToast()
  const { courses, schedules, assignments, memos, setCourses, setSchedules, setAssignments, setMemos, reloadCourses, reloadSchedules } = useData()
  const [weekNum] = useState(() => getWeekNumber())
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 7 : d
  })
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(() => getCurrentPeriod(new Date()))
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [importing, setImporting] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<Course | null>(null)
  const [editForm, setEditForm] = useState({ name: '', teacher: '', classroom: '', color: '', week_type: 'all' as 'all' | 'odd' | 'even' })
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null)
  const [addingCourse, setAddingCourse] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', teacher: '', classroom: '', color: '#6366F1', week_type: 'all' as 'all' | 'odd' | 'even' })
  
  // 时间编辑相关状态
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: 1, start_period: 1, end_period: 2, location: '', week_type: 'all' as 'all' | 'odd' | 'even' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedCourses = [...courses].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  useEffect(() => {
    const timer = setInterval(() => {
      const n = new Date()
      const d = n.getDay()
      setCurrentDayOfWeek(d === 0 ? 7 : d)
      setCurrentPeriod(getCurrentPeriod(n))
    }, 60000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleOpenEdit = (course: Course) => {
    setEditingCard(course)
    setEditForm({ name: course.name, teacher: course.teacher, classroom: course.classroom, color: course.color, week_type: course.week_type })
  }

  const handleSaveEdit = async () => {
    if (!editingCard) return
    const updated = await updateCourse(editingCard.id, editForm)
    if (updated) { setCourses((prev) => prev.map((c) => (c.id === editingCard.id ? updated : c))); setEditingCard(null) }
  }

  const handleDelete = async (course: Course) => {
    await deleteCourse(course.id)
    setCourses((prev) => prev.filter((c) => c.id !== course.id))
    setDeleteConfirm(null)
  }

  const handleCreateCourse = async () => {
    if (!addForm.name.trim()) return
    const created = await createCourse(addForm)
    if (created) {
      setCourses((prev) => [...prev, created].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)))
      setAddingCourse(false)
      setAddForm({ name: '', teacher: '', classroom: '', color: '#6366F1', week_type: 'all' })
    }
  }
  
  const handleEditSchedule = (schedule: CourseSchedule) => {
    setEditingScheduleId(schedule.id)
    setScheduleForm({
      day_of_week: schedule.day_of_week,
      start_period: schedule.start_period,
      end_period: schedule.end_period,
      location: schedule.location,
      week_type: schedule.week_type
    })
  }
  
  const handleSaveSchedule = async () => {
    if (!editingScheduleId || !editingCard) return
    try {
      const updated = await updateSchedule(editingScheduleId, scheduleForm)
      if (updated) {
        setSchedules((prev) => prev.map((s) => s.id === updated.id ? updated : s))
        setEditingScheduleId(null)
      }
    } catch (error) {
      console.error('Failed to save schedule:', error)
    }
  }
  
  const handleAddSchedule = async () => {
    if (!editingCard) return
    try {
      const created = await createSchedule({
        ...scheduleForm,
        course_id: editingCard.id
      })
      if (created) {
        setSchedules((prev) => [...prev, created])
        setEditingScheduleId(null)
      }
    } catch (error) {
      console.error('Failed to add schedule:', error)
    }
  }
  
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const success = await deleteSchedule(scheduleId)
      if (success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handleImport = async () => {
    if (importPreview.length === 0) { setShowImport(false); return }
    setImporting(true)
    let successCount = 0
    let skipCount = 0
    let failCount = 0
    for (const row of importPreview as Record<string, string>[]) {
      const name = row['课程名']
      const dayStr = row['星期']
      const startPeriod = parseInt(row['开始节次']) || 0
      const endPeriod = parseInt(row['结束节次']) || 0
      if (!name || startPeriod < 1 || startPeriod > 11 || endPeriod < 1 || endPeriod > 11) { failCount++; continue }
      const dayMap: Record<string, number> = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5 }
      const dow = dayMap[dayStr] || 0
      if (dow === 0) { failCount++; continue }

      const existing = courses.find((c) => c.name === name)
      if (existing) { skipCount++; continue }

      const created = await createCourse({
        name,
        teacher: row['教师'] || '—',
        classroom: row['教室'] || '—',
        color: row['颜色'] || '#6366F1',
        week_type: (row['单双周'] as 'all' | 'odd' | 'even') || 'all',
      })
      if (created && startPeriod > 0) {
        await createSchedule({ course_id: created.id, day_of_week: dow, start_period: startPeriod, end_period: endPeriod, location: row['教室'] || '—', week_type: created.week_type })
        successCount++
      } else {
        failCount++
      }
    }
    setImporting(false)
    setShowImport(false)
    setImportPreview([])
    const parts: string[] = []
    if (successCount > 0) parts.push(`成功 ${successCount} 条`)
    if (skipCount > 0) parts.push(`跳过 ${skipCount} 条`)
    if (failCount > 0) parts.push(`失败 ${failCount} 条`)
    if (parts.length > 0) showToast(`导入完成：${parts.join('，')}`, successCount > 0 ? 'success' : 'error')
    reloadCourses()
    reloadSchedules()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const totalWeeks = getSemesterConfig().teachingWeeks
  
  const DAY_MAP: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          课程管理 <span className="text-xs sm:text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>共 {sortedCourses.length} 门课程</span>
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="btn-ghost text-[11px] sm:text-xs cursor-pointer">导入
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
          <button onClick={() => exportToCSV(courses, schedules)} className="btn-ghost text-[11px] sm:text-xs">CSV</button>
          <button onClick={() => exportToExcel(courses, schedules)} className="btn-ghost text-[11px] sm:text-xs">Excel</button>
          <button onClick={() => setAddingCourse(true)} className="btn-primary text-[11px] sm:text-xs">添加课程</button>
        </div>
      </div>

      {showImport && importPreview.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 glass">
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--fg)' }}>导入预览 ({importPreview.length} 条)</h3>
          <div className="max-h-36 overflow-auto text-[10px]">
            <table className="w-full">
              <thead><tr style={{ color: 'var(--text-secondary)' }}><th className="text-left p-1">课程名</th><th className="text-left p-1">星期</th><th className="text-left p-1">节次</th></tr></thead>
              <tbody>{(importPreview as Record<string, string>[]).slice(0, 20).map((r, i) => <tr key={i} className="border-t" style={{ borderColor: 'var(--border-light)' }}><td className="p-1">{r['课程名']}</td><td className="p-1">{r['星期']}</td><td className="p-1">{r['开始节次']}-{r['结束节次']}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleImport} disabled={importing} className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[var(--accent-info)] hover:opacity-90 disabled:opacity-50">{importing ? '导入中...' : '确认导入'}</button>
            <button onClick={() => { setShowImport(false); setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = '' }} className="btn-ghost text-xs">取消</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCourses.map((course, index) => {
          const allCourseSchedules = schedules
            .filter((s) => s.course_id === course.id)
            .sort((a, b) => a.day_of_week - b.day_of_week || a.start_period - b.start_period)
          const dots: { week: number; schedule: typeof allCourseSchedules[number] }[] = []
          for (let w = 1; w <= totalWeeks; w++) {
            const wOdd = w % 2 === 1
            for (const s of allCourseSchedules) {
              if (s.week_type === 'all' || (s.week_type === 'odd' && wOdd) || (s.week_type === 'even' && !wOdd)) {
                const dotDate = getDayDate(w, s.day_of_week)
                const holiday = isHoliday(dotDate)
                if (!holiday) {
                  dots.push({ week: w, schedule: s })
                }
              }
            }
          }
          const totalClasses = dots.length
          const completedClasses = Math.min(dots.filter((d) => d.week < weekNum).length, totalClasses)
          let nextDotIndex = -1
          if (weekNum > 0 && currentDayOfWeek > 0) {
            for (let di = 0; di < dots.length; di++) {
              const d = dots[di]
              if (d.week < weekNum) continue
              const s = d.schedule
              if (d.week > weekNum || s.day_of_week > currentDayOfWeek) {
                nextDotIndex = di
                break
              }
              if (s.day_of_week === currentDayOfWeek) {
                if (currentPeriod === null || currentPeriod <= s.end_period) {
                  nextDotIndex = di
                  break
                }
              }
            }
          }
          const courseMemos = memos.filter((m) => m.course_id === course.id)
          const courseAssignments = assignments.filter((a) => a.course_id === course.id)
          const tagCounts: Record<string, number> = {}
          courseMemos.forEach((m) => { m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }) })
          const isExpanded = expandedCard === course.id

          return (
            <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}
                className="rounded-2xl overflow-hidden glass card-interactive">
                <div style={{ height: 4, background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}88 100%)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <button onClick={() => setExpandedCard(isExpanded ? null : course.id)} className="flex-1 min-w-0 text-left">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{course.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {course.teacher !== '—' ? course.teacher : ''}
                        {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 ml-2">
                      {course.week_type !== 'all' && <span className="chip">{course.week_type === 'odd' ? '单周' : '双周'}</span>}
                    </div>
                  </div>

                  <div className="flex gap-[2px] mt-3 flex-wrap">
                    {dots.map((dot, i) => {
                      const isCompleted = dot.week < weekNum || (dot.week === weekNum && (dot.schedule.day_of_week < currentDayOfWeek || (dot.schedule.day_of_week === currentDayOfWeek && currentPeriod !== null && currentPeriod > dot.schedule.end_period)))
                      const isCurrent = i === nextDotIndex
                      const dotSchedule = dot.schedule
                      const dotDate = getDayDate(dot.week, dotSchedule.day_of_week)
                      const dayLabel = DAY_MAP[dotSchedule.day_of_week] ?? ''
                      const periodLabel = `${dotSchedule.start_period}-${dotSchedule.end_period}节`
                      const timeLabel = `${PERIOD_TIMES[dotSchedule.start_period].start}-${PERIOD_TIMES[dotSchedule.end_period].end}`
                      const scheduleInfo = `${dayLabel} ${periodLabel} ${timeLabel}`
                      const label = `第${dot.week}周 · ${dotDate.getMonth() + 1}月${dotDate.getDate()}日\n${scheduleInfo}`
                      const dotAssignments = assignments.filter((a) => {
                        const dueWeek = getWeekNumber(new Date(a.due_date))
                        return a.course_id === course.id && dueWeek === dot.week
                      })
                      const tooltip = dotAssignments.length > 0 ? `${label}\n📝 ${dotAssignments.map((a) => a.title).join(', ')}` : label
                      return (
                        <div key={i} className="w-4 h-4 rounded-sm relative group/dot" title={tooltip}
                          style={{
                            backgroundColor: isCompleted ? course.color : 'transparent',
                            border: isCurrent && !isCompleted ? '1.5px solid var(--accent-warm)' : isCompleted ? 'none' : '1px dashed var(--border-light)',
                            opacity: dot.week > totalWeeks ? 0.3 : 1,
                          }}>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] whitespace-pre-line text-center hidden group-hover/dot:block pointer-events-none z-30"
                            style={{ backgroundColor: '#1E293B', color: '#E2E8F0', minWidth: '80px' }}>
                            {tooltip}
                          </div>
                        </div>
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

                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>进度 {completedClasses}/{totalClasses} 节</span>
                      <span style={{ color: 'var(--accent-success)' }}>{Math.round((completedClasses / totalClasses) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${course.color}26` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(completedClasses / totalClasses) * 100}%`, backgroundColor: course.color }}
                      />
                    </div>
                  </div>

                  {courseAssignments.length > 0 && (
                    <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                      <button onClick={() => setExpandedCard(isExpanded ? null : course.id)} className="flex items-center gap-1 text-[10px] w-full cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                        {isExpanded ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />} 作业 ({courseAssignments.length})
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="mt-2 space-y-1 overflow-hidden">
                            {[...courseAssignments].sort((a, b) => a.due_date.localeCompare(b.due_date)).map((a) => {
                              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
                              return (
                                <div key={a.id} className="flex items-center gap-1.5 text-[10px]">
                                  {a.status === 'submitted' ? <Check size={12} strokeWidth={2.5} style={{ color: 'var(--accent-success)' }} /> : <Square size={12} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />}
                                  <span className="truncate" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-secondary)' }}>{a.title}</span>
                                </div>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-3">
                    <button onClick={() => handleOpenEdit(course)} className="text-sm flex items-center gap-1 cursor-pointer" style={{ color: 'var(--accent-info)' }}><Pencil size={13} strokeWidth={1.8} />编辑</button>
                    <button onClick={() => setDeleteConfirm(course)} className="text-sm flex items-center gap-1 cursor-pointer" style={{ color: 'var(--accent-danger)' }}><Trash2 size={13} strokeWidth={1.8} />删除</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sortedCourses.length * 0.1 }}>
          <div className="rounded-2xl h-full min-h-[180px] flex items-center justify-center cursor-pointer hover:bg-[var(--border-light)] transition-colors duration-200"
            style={{ border: '2px dashed var(--border-light)' }}
            onClick={() => setAddingCourse(true)}
          >
            <Plus size={28} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
          </div>
        </motion.div>
      </div>

      {/* Add Modal */}
      <Modal open={addingCourse} onClose={() => setAddingCourse(false)} title="添加课程">
        <div className="space-y-3">
          {(['name', 'teacher', 'classroom'] as const).map((f) => (
            <div key={f}>
              <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>{f === 'name' ? '课程名' : f === 'teacher' ? '教师' : '教室'}</label>
              <input value={addForm[f]} onChange={(e) => setAddForm((pf) => ({ ...pf, [f]: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>颜色</label><input type="color" value={addForm.color} onChange={(e) => setAddForm((pf) => ({ ...pf, color: e.target.value }))} className="w-full h-10 rounded-xl cursor-pointer" /></div>
            <div><label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>单双周</label>
              <select value={addForm.week_type} onChange={(e) => setAddForm((pf) => ({ ...pf, week_type: e.target.value as 'all' | 'odd' | 'even' }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAddingCourse(false)} className="btn-ghost text-xs">取消</button>
            <button onClick={handleCreateCourse} disabled={!addForm.name.trim()} className="btn-primary text-xs disabled:opacity-40">添加</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingCard} onClose={() => { setEditingCard(null); setEditingScheduleId(null); }} title="编辑课程">
        {editingCard && (
          <div className="space-y-4">
            {/* 基本信息 */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-primary)' }}>基本信息</p>
              <div className="space-y-3">
                {(['name', 'teacher', 'classroom'] as const).map((f) => (
                  <div key={f}>
                    <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>{f === 'name' ? '课程名' : f === 'teacher' ? '教师' : '教室'}</label>
                    <input value={editForm[f]} onChange={(e) => setEditForm((pf) => ({ ...pf, [f]: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>颜色</label><input type="color" value={editForm.color} onChange={(e) => setEditForm((pf) => ({ ...pf, color: e.target.value }))} className="w-full h-10 rounded-xl cursor-pointer" /></div>
                  <div><label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-secondary)' }}>单双周</label>
                    <select value={editForm.week_type} onChange={(e) => setEditForm((pf) => ({ ...pf, week_type: e.target.value as 'all' | 'odd' | 'even' }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                      <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 时间编辑 */}
            <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>上课时间</p>
                {editingScheduleId === null && (
                    <button onClick={() => setEditingScheduleId('new')} className="btn-ghost text-xs flex items-center gap-0.5"><Plus size={12} strokeWidth={2} />添加</button>
                )}
              </div>
              
              {/* 时间列表 */}
              <div className="space-y-2">
                {schedules.filter((s) => s.course_id === editingCard.id).map((schedule) => (
                  <div key={schedule.id} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    {editingScheduleId === schedule.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs flex-1" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{DAY_MAP[d]}</option>)}
                          </select>
                          <select value={scheduleForm.start_period} onChange={(e) => setScheduleForm({ ...scheduleForm, start_period: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((x) => <option key={x} value={x}>{x}节</option>)}
                          </select>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>-</span>
                          <select value={scheduleForm.end_period} onChange={(e) => setScheduleForm({ ...scheduleForm, end_period: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((x) => <option key={x} value={x}>{x}节</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="教室" className="flex-1 rounded-lg px-2 py-1 text-xs glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                          <select value={scheduleForm.week_type} onChange={(e) => setScheduleForm({ ...scheduleForm, week_type: e.target.value as 'all' | 'odd' | 'even' })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                            <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={handleSaveSchedule} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                          <button onClick={() => setEditingScheduleId(null)} className="btn-ghost text-xs">取消</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{DAY_MAP[schedule.day_of_week]} {schedule.start_period}-{schedule.end_period}节</span>
                          {schedule.location && schedule.location !== '—' && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· {schedule.location}</span>}
                          {schedule.week_type !== 'all' && <span className="chip text-[10px]" style={{ backgroundColor: 'var(--accent-info)', color: 'white' }}>{schedule.week_type === 'odd' ? '单周' : '双周'}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditSchedule(schedule)} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                          <button onClick={() => handleDeleteSchedule(schedule.id)} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* 新增时间 */}
                {editingScheduleId === 'new' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                      {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{DAY_MAP[d]}</option>)}
                    </select>
                    <select value={scheduleForm.start_period} onChange={(e) => setScheduleForm({ ...scheduleForm, start_period: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((x) => <option key={x} value={x}>{x}节</option>)}
                    </select>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>-</span>
                    <select value={scheduleForm.end_period} onChange={(e) => setScheduleForm({ ...scheduleForm, end_period: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((x) => <option key={x} value={x}>{x}节</option>)}
                    </select>
                    <input value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} placeholder="教室" className="flex-1 rounded-lg px-2 py-1 text-xs glass-subtle" style={{ border: '1px solid var(--border-light)' }} />
                    <select value={scheduleForm.week_type} onChange={(e) => setScheduleForm({ ...scheduleForm, week_type: e.target.value as 'all' | 'odd' | 'even' })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                      <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                    </select>
                    <button onClick={handleAddSchedule} className="btn-primary text-xs" style={{ backgroundColor: 'var(--accent-info)' }}>添加</button>
                    <button onClick={() => setEditingScheduleId(null)} className="btn-ghost text-xs">取消</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setEditingCard(null); setEditingScheduleId(null); }} className="btn-ghost text-xs">取消</button>
              <button onClick={handleSaveEdit} className="btn-primary text-xs">保存</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="确认删除">
        {deleteConfirm && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              确定删除「{deleteConfirm.name}」吗？此操作不可恢复。
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost text-xs">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="rounded-xl px-4 py-1.5 text-xs text-white font-medium" style={{ backgroundColor: 'var(--accent-danger)' }}>确定删除</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
