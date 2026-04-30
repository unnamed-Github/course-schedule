'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Course, Assignment } from '@/lib/types'
import { getCourses, getAssignments, updateAssignment, createAssignment } from '@/lib/data'
import { Modal } from './Modal'

type FilterType = 'all' | 'pending' | 'submitted' | 'overdue'

export function AssignmentsView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCourseId, setNewCourseId] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    Promise.all([getCourses(), getAssignments()]).then(([c, a]) => {
      setCourses(c)
      setAssignments(a)
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

  const handleAddAssignment = async () => {
    if (!newTitle.trim() || !newCourseId || !newDueDate) return
    const created = await createAssignment({
      title: newTitle.trim(),
      course_id: newCourseId,
      due_date: newDueDate,
      description: newDesc.trim() || '',
      status: 'pending',
    })
    if (created) {
      setAssignments(prev => [...prev, created])
      setNewTitle('')
      setNewCourseId('')
      setNewDueDate('')
      setNewDesc('')
      setShowAddModal(false)
    }
  }

  if (!loaded) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>作业</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">快速添加作业</button>
      </div>

      {/* 四宫格统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="全部" value={stats.all} color="var(--text-secondary)" />
        <StatCard label="待提交" value={stats.pending} color="var(--accent-warm)" />
        <StatCard label="已提交" value={stats.submitted} color="var(--accent-success)" />
        <StatCard label="已过期" value={stats.overdue} color="var(--accent-danger)" />
      </div>

      {/* 筛选标签 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'submitted', 'overdue'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
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

      {/* 作业列表 */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-light)' }}>
            <p style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>暂无作业</p>
          </div>
        ) : (
          filteredAssignments.map(assignment => {
            const course = getCourse(assignment.course_id)
            const isOverdue = new Date(assignment.due_date).getTime() < Date.now() && assignment.status === 'pending'
            const isNear = !isOverdue && new Date(assignment.due_date).getTime() - Date.now() < 86400000 && assignment.status === 'pending'
            const isExpanded = expandedId === assignment.id

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: course?.color || 'var(--border-light)' }}
                      />
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
                          {isNear && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--accent-warm)26', color: 'var(--accent-warm)' }}>
                              🔔 即将截止
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--accent-danger)26', color: 'var(--accent-danger)' }}>
                              ⚠️ 已过期
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          截止: {assignment.due_date.replace('T', ' ')}
                        </p>
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
                      {assignment.status === 'submitted' && <span className="text-white text-xs">✓</span>}
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
                        {assignment.description && (
                          <div className="mb-3">
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>描述</p>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{assignment.description}</p>
                          </div>
                        )}
                        <div className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                          创建于: {assignment.created_at.replace('T', ' ')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="快速添加作业">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>作业标题</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入作业标题"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>所属课程</label>
            <select
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="">选择课程</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>截止日期</label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
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
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
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
    <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="text-2xl font-bold mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  )
}
