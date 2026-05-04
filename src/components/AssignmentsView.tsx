'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Course, Assignment, CourseSchedule, DDL_REMINDER_OPTIONS } from '@/lib/types'
import { getCourses, getAssignments, getSchedules, updateAssignment, createAssignment, deleteAssignment } from '@/lib/data'
import { Modal } from './Modal'
import { Bell, AlertTriangle, Check, Plus, Pencil, Trash2, ChevronDown, Settings } from 'lucide-react'
import { DAY_LABELS, WEEK_TYPE_SHORT } from '@/lib/constants'

type FilterType = 'all' | 'pending' | 'submitted' | 'overdue'

function getScheduleLabel(schedule: CourseSchedule): string {
  return `${DAY_LABELS[schedule.day_of_week]} ${schedule.start_period}-${schedule.end_period}节${WEEK_TYPE_SHORT[schedule.week_type]}`
}

function todayDateString() { return new Date().toISOString().slice(0, 10) }

function todayDateTimeLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function formatCountdown(dueDate: string): string {
  const now = Date.now()
  const due = new Date(dueDate).getTime()
  const diff = due - now

  if (diff < 0) {
    return '已过期'
  }

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) {
    return `提前 ${days} 天`
  } else if (hours > 0) {
    return `提前 ${hours} 小时`
  } else if (minutes > 0) {
    return `提前 ${minutes} 分钟`
  } else {
    return '即将截止'
  }
}

export function AssignmentsView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [quickAddExpanded, setQuickAddExpanded] = useState(true)
  const [quickAddMoreExpanded, setQuickAddMoreExpanded] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newCourseId, setNewCourseId] = useState('')
  const [newScheduleId, setNewScheduleId] = useState('')
  const [newDueDate, setNewDueDate] = useState(() => todayDateTimeLocal())
  const [newDesc, setNewDesc] = useState('')
  const [newReminders, setNewReminders] = useState<number[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editScheduleId, setEditScheduleId] = useState('')
  const [editReminders, setEditReminders] = useState<number[]>([])

  useEffect(() => {
    Promise.all([getCourses(), getAssignments(), getSchedules()]).then(([c, a, sc]) => {
      setCourses(c)
      setAssignments(a)
      setSchedules(sc)
      setLoaded(true)
    })
  }, [])

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true
    if (filter === 'overdue') {
      return new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
    }
    return a.status === filter
  })

  const stats = {
    all: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    overdue: assignments.filter(a =>
      new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
    ).length,
  }

  const getCourse = (id: string) => courses.find(c => c.id === id)

  const handleToggleStatus = async (assignment: Assignment) => {
    const newStatus = assignment.status === 'pending' ? 'submitted' : 'pending'
    const updated = await updateAssignment(assignment.id, { status: newStatus })
    if (updated) {
      setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
    }
  }

  const handleQuickAdd = async () => {
    if (!newTitle.trim() || !newCourseId || !newDueDate) return
    const created = await createAssignment({
      title: newTitle.trim(),
      course_id: newCourseId,
      due_date: newDueDate,
      description: newDesc.trim() || '',
      status: 'pending',
      schedule_id: newScheduleId || undefined,
      reminders: newReminders.length > 0 ? newReminders : undefined,
    })
    if (created) {
      setAssignments(prev => [...prev, created])
      setNewTitle('')
      setNewCourseId('')
      setNewScheduleId('')
      setNewDueDate(todayDateTimeLocal())
      setNewDesc('')
      setNewReminders([])
    }
  }

  const handleQuickAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  const handleAddAssignment = async () => {
    if (!newTitle.trim() || !newCourseId || !newDueDate) return
    const created = await createAssignment({
      title: newTitle.trim(),
      course_id: newCourseId,
      due_date: newDueDate,
      description: newDesc.trim() || '',
      status: 'pending',
      schedule_id: newScheduleId || undefined,
      reminders: newReminders.length > 0 ? newReminders : undefined,
    })
    if (created) {
      setAssignments(prev => [...prev, created])
      setNewTitle('')
      setNewCourseId('')
      setNewScheduleId('')
      setNewDueDate(todayDateTimeLocal())
      setNewDesc('')
      setNewReminders([])
      setShowAddModal(false)
    }
  }

  const handleEdit = (assignment: Assignment) => {
    setEditingId(assignment.id)
    setEditTitle(assignment.title)
    setEditDueDate(assignment.due_date.slice(0, 16))
    setEditDesc(assignment.description || '')
    setEditScheduleId(assignment.schedule_id || '')
    setEditReminders(assignment.reminders || [])
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    const updated = await updateAssignment(editingId, {
      title: editTitle.trim(),
      due_date: editDueDate,
      description: editDesc.trim(),
      schedule_id: editScheduleId || undefined,
      reminders: editReminders,
    })
    if (updated) {
      setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteAssignment(id)
    setAssignments(prev => prev.filter(a => a.id !== id))
    setExpandedId(null)
  }

  if (!loaded) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="全部" value={stats.all} color="var(--text-secondary)" />
        <StatCard label="待提交" value={stats.pending} color="var(--accent-warm)" />
        <StatCard label="已提交" value={stats.submitted} color="var(--accent-success)" />
        <StatCard label="已过期" value={stats.overdue} color="var(--accent-danger)" />
      </div>

      <div className="rounded-2xl p-4 glass">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>快速添加作业</h3>
          <button
            onClick={() => setQuickAddExpanded(!quickAddExpanded)}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={`transition-transform ${quickAddExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <AnimatePresence>
          {quickAddExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleQuickAddKeyDown}
                    placeholder="作业标题..."
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs sm:text-sm"
                    style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                  />
                  <select
                    value={newCourseId}
                    onChange={(e) => { setNewCourseId(e.target.value); setNewScheduleId('') }}
                    className="px-3 py-2 rounded-xl text-xs sm:text-sm"
                    style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="">选择课程</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs sm:text-sm"
                    style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                  />
                  <button
                    onClick={handleQuickAdd}
                    disabled={!newTitle.trim() || !newCourseId || !newDueDate}
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    添加
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => setQuickAddMoreExpanded(!quickAddMoreExpanded)}
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className={`transition-transform ${quickAddMoreExpanded ? 'rotate-180' : ''}`}
                    />
                    更多选项
                  </button>

                  <AnimatePresence>
                    {quickAddMoreExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-3">
                          <select
                            value={newScheduleId}
                            onChange={(e) => setNewScheduleId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm"
                            style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                          >
                            <option value="">不关联具体课时</option>
                            {schedules.filter(s => s.course_id === newCourseId).map(s => (
                              <option key={s.id} value={s.id}>{getScheduleLabel(s)}</option>
                            ))}
                          </select>
                          <textarea
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            placeholder="描述（可选）"
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                            style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                          />
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>DDL 提醒</label>
                            <div className="flex flex-wrap gap-2">
                              {DDL_REMINDER_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setNewReminders(prev =>
                                    prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                  )}
                                  className="px-3 py-1 rounded-lg text-xs transition-colors"
                                  style={{
                                    backgroundColor: newReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--bg-primary)',
                                    color: newReminders.includes(opt.value) ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${newReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--border-light)'}`,
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>按 Enter 键快速添加</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'pending', 'submitted', 'overdue'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                filter === f ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: filter === f ? 'var(--accent-info)' : 'var(--bg-card)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              {f === 'all' ? '全部' : f === 'pending' ? '待提交' : f === 'submitted' ? '已提交' : '已过期'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button className="p-2 rounded-xl glass-btn hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
            <Settings size={18} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-[10px] sm:text-xs flex items-center gap-1"
          >
            <Plus size={14} strokeWidth={2} />添加作业
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl glass">
            <p style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>暂无作业</p>
          </div>
        ) : (
          filteredAssignments.map(assignment => {
            const course = getCourse(assignment.course_id)
            const schedule = assignment.schedule_id ? schedules.find(s => s.id === assignment.schedule_id) : null
            const isOverdue = new Date(assignment.due_date).getTime() < Date.now() && assignment.status === 'pending'
            const isNear = !isOverdue && new Date(assignment.due_date).getTime() - Date.now() < 86400000 && assignment.status === 'pending'
            const isExpanded = expandedId === assignment.id

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden glass-strong"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: course?.color || 'var(--border-light)' }}
                        />
                        <span className="text-lg">📝</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {assignment.title}
                          </h4>
                          {course && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${course.color}26`, color: course.color }}>
                              {course.name}
                            </span>
                          )}
                          {schedule && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${course?.color}26`, color: course?.color }}>
                              {getScheduleLabel(schedule)}
                            </span>
                          )}
                          {isNear && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--accent-warm)26', color: 'var(--accent-warm)' }}>
                              <Bell size={11} strokeWidth={2} />即将截止
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--accent-danger)26', color: 'var(--accent-danger)' }}>
                              <AlertTriangle size={11} strokeWidth={2} />已过期
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {assignment.due_date.replace('T', ' ')}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-success)26', color: 'var(--accent-success)' }}>
                            {formatCountdown(assignment.due_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(assignment)
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        assignment.status === 'submitted' ? 'shadow-sm' : ''
                      }`}
                      style={{
                        backgroundColor: assignment.status === 'submitted' ? 'var(--accent-success)' : 'transparent',
                        border: `2px solid ${assignment.status === 'submitted' ? 'var(--accent-success)' : 'var(--border-light)'}`,
                      }}
                    >
                      {assignment.status === 'submitted' && <Check size={12} strokeWidth={3} style={{ color: 'white' }} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <div className="p-4">
                        {editingId === assignment.id ? (
                          <div className="space-y-2">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            />
                            <input
                              type="datetime-local"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            />
                            <select
                              value={editScheduleId}
                              onChange={(e) => setEditScheduleId(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            >
                              <option value="">不关联具体课时</option>
                              {schedules.filter(s => s.course_id === assignment.course_id).map(s => (
                                <option key={s.id} value={s.id}>{getScheduleLabel(s)}</option>
                              ))}
                            </select>
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="描述（可选）"
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                              style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                            />
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>DDL 提醒</label>
                              <div className="flex flex-wrap gap-2">
                                {DDL_REMINDER_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => setEditReminders(prev =>
                                      prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                    )}
                                    className="px-3 py-1 rounded-lg text-xs transition-colors"
                                    style={{
                                      backgroundColor: editReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--bg-primary)',
                                      color: editReminders.includes(opt.value) ? '#fff' : 'var(--text-secondary)',
                                      border: `1px solid ${editReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--border-light)'}`,
                                    }}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveEdit} className="btn-primary text-xs">保存</button>
                              <button onClick={() => setEditingId(null)} className="btn-ghost text-xs">取消</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {assignment.description && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>描述</p>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{assignment.description}</p>
                              </div>
                            )}
                            {assignment.reminders && assignment.reminders.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>提醒设置</p>
                                <div className="flex flex-wrap gap-1">
                                  {assignment.reminders.map(r => {
                                    const opt = DDL_REMINDER_OPTIONS.find(o => o.value === r)
                                    return (
                                      <span key={r} className="px-2 py-0.5 rounded-full text-xs"
                                        style={{ backgroundColor: 'var(--accent-info)26', color: 'var(--accent-info)', border: '1px solid var(--accent-info)40' }}>
                                        ⏰ {opt?.label || `${r}分钟前`}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                                创建于: {assignment.created_at.replace('T', ' ')}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(assignment)}
                                  className="btn-ghost text-xs flex items-center gap-1"
                                  style={{ color: 'var(--accent-info)' }}
                                >
                                  <Pencil size={12} strokeWidth={2} />编辑
                                </button>
                                <button
                                  onClick={() => handleDelete(assignment.id)}
                                  className="btn-ghost text-xs flex items-center gap-1"
                                  style={{ color: 'var(--accent-danger)' }}
                                >
                                  <Trash2 size={12} strokeWidth={2} />删除
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setNewScheduleId(''); setNewReminders([]) }} title="添加作业">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>作业标题</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入作业标题"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>所属课程</label>
            <select
              value={newCourseId}
              onChange={(e) => { setNewCourseId(e.target.value); setNewScheduleId('') }}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="">选择课程</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>关联课时（可选）</label>
            <select
              value={newScheduleId}
              onChange={(e) => setNewScheduleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="">不关联具体课时</option>
              {schedules.filter(s => s.course_id === newCourseId).map(s => (
                <option key={s.id} value={s.id}>{getScheduleLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>截止日期</label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>描述（可选）</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="输入作业描述"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>DDL 提醒</label>
            <div className="flex flex-wrap gap-2">
              {DDL_REMINDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNewReminders(prev =>
                    prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                  )}
                  className="px-3 py-1 rounded-lg text-xs transition-colors"
                  style={{
                    backgroundColor: newReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--bg-primary)',
                    color: newReminders.includes(opt.value) ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${newReminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--border-light)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddAssignment}
            disabled={!newTitle.trim() || !newCourseId || !newDueDate}
            className="btn-primary w-full text-sm disabled:opacity-50"
          >
            添加作业
          </button>
        </div>
      </Modal>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl text-left glass-strong">
      <div className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  )
}
