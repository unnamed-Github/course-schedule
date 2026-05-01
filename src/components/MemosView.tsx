'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Course, Memo, CourseSchedule } from '@/lib/types'
import { getCourses, getMemos, getSchedules, createMemo, deleteMemo, updateMemo } from '@/lib/data'
import { Modal } from './Modal'
import { Plus, StickyNote, X, Pencil } from 'lucide-react'
import { DAY_LABELS, WEEK_TYPE_SHORT } from '@/lib/constants'

const EMOJI_OPTIONS = ['📝', '💡', '🤔', '😊', '😤', '💪', '🎉', '📖', '✨', '⚠️']

function getScheduleLabel(schedule: CourseSchedule): string {
  return `${DAY_LABELS[schedule.day_of_week]} ${schedule.start_period}-${schedule.end_period}节${WEEK_TYPE_SHORT[schedule.week_type]}`
}

export function MemosView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newMemo, setNewMemo] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📝')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editEmoji, setEditEmoji] = useState('📝')
  const [editScheduleId, setEditScheduleId] = useState<string>('')

  useEffect(() => {
    Promise.all([getCourses(), getMemos(), getSchedules()]).then(([c, m, sc]) => {
      setCourses(c)
      setMemos(m)
      setSchedules(sc)
      if (c.length > 0) setSelectedCourseId(c[0].id)
      setLoaded(true)
    })
  }, [])

  const courseMemoCounts = courses.reduce((acc, course) => {
    acc[course.id] = memos.filter(m => m.course_id === course.id).length
    return acc
  }, {} as Record<string, number>)

  const sortedCourses = [...courses].sort((a, b) =>
    (courseMemoCounts[b.id] || 0) - (courseMemoCounts[a.id] || 0)
  )

  const handleAddMemo = async () => {
    if (!newMemo.trim() || !selectedCourseId) return

    const memo = await createMemo({
      course_id: selectedCourseId,
      content: newMemo,
      mood_emoji: selectedEmoji,
      mood_tags: [],
      schedule_id: selectedScheduleId || undefined,
    })

    if (memo) {
      setMemos(prev => [memo, ...prev])
      setNewMemo('')
      setSelectedScheduleId('')
    }
  }

  const handleDeleteMemo = async (id: string) => {
    await deleteMemo(id)
    setMemos(prev => prev.filter(m => m.id !== id))
  }

  const handleEditMemo = (memo: Memo) => {
    setEditingId(memo.id)
    setEditContent(memo.content)
    setEditEmoji(memo.mood_emoji || '📝')
    setEditScheduleId(memo.schedule_id || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return
    const updated = await updateMemo(editingId, {
      content: editContent.trim(),
      mood_emoji: editEmoji,
      schedule_id: editScheduleId || undefined,
    })
    if (updated) {
      setMemos(prev => prev.map(m => m.id === updated.id ? updated : m))
    }
    setEditingId(null)
  }

  if (!loaded) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>课堂备忘</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={14} strokeWidth={2} />新增备忘</button>
      </div>

      <div className="space-y-3">
        {memos.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-light)' }}>
            <div className="flex justify-center mb-2"><StickyNote size={32} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} /></div>
            <p style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>还没有备忘，快来记录吧！</p>
          </div>
        ) : (
          memos.map((memo, index) => {
            const course = courses.find(c => c.id === memo.course_id)
            const schedule = memo.schedule_id ? schedules.find(s => s.id === memo.schedule_id) : null
            return (
              <motion.div
                key={memo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-2xl flex gap-3"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div
                  className="w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: course?.color || 'var(--border-light)' }}
                />
                <div className="flex-1 min-w-0">
                  {editingId === memo.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button key={emoji} onClick={() => setEditEmoji(emoji)} className={`text-lg p-0.5 rounded-lg transition-colors ${editEmoji === emoji ? 'bg-[var(--border-light)]' : ''}`}>{emoji}</button>
                        ))}
                      </div>
                      <select
                        value={editScheduleId}
                        onChange={(e) => setEditScheduleId(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <option value="">不关联具体课时</option>
                        {schedules.filter(s => s.course_id === memo.course_id).map(s => (
                          <option key={s.id} value={s.id}>{getScheduleLabel(s)}</option>
                        ))}
                      </select>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                        style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="btn-primary text-xs">保存</button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost text-xs">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{memo.mood_emoji}</span>
                          {course && (
                            <span className="text-sm font-medium" style={{ color: course.color }}>
                              {course.name}
                            </span>
                          )}
                          {schedule && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${course?.color || '#888'}26`, color: course?.color || '#888' }}>
                              {getScheduleLabel(schedule)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleEditMemo(memo)}
                            className="opacity-30 hover:opacity-60 transition-opacity cursor-pointer"
                            style={{ color: 'var(--accent-info)' }}
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDeleteMemo(memo.id)}
                            className="opacity-30 hover:opacity-60 transition-opacity cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <X size={14} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{memo.content}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                        {memo.created_at.replace('T', ' ')}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {sortedCourses.some(c => (courseMemoCounts[c.id] || 0) > 0) && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            哪门课备忘最多
          </p>
          <div className="space-y-2">
            {sortedCourses.filter(c => (courseMemoCounts[c.id] || 0) > 0).map(course => {
              const count = courseMemoCounts[course.id] || 0
              const maxCount = Math.max(...Object.values(courseMemoCounts), 1)
              const percentage = (count / maxCount) * 100

              return (
                <div key={course.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: course.color }}>
                        {course.name}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${course.color}26` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: course.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setSelectedScheduleId('') }} title="新增备忘">
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedScheduleId('') }}
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <select
              value={selectedEmoji}
              onChange={(e) => setSelectedEmoji(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              {EMOJI_OPTIONS.map(emoji => (
                <option key={emoji} value={emoji}>{emoji}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>关联课时（可选）</label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            >
              {schedules.filter(s => s.course_id === selectedCourseId).map(s => (
                <option key={s.id} value={s.id}>{getScheduleLabel(s)}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            placeholder="写下你的备忘..."
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-sm resize-none"
            style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => { handleAddMemo(); if (newMemo.trim()) setShowAddModal(false) }}
            disabled={!newMemo.trim()}
            className="btn-primary w-full text-sm disabled:opacity-50"
          >
            添加备忘
          </button>
        </div>
      </Modal>
    </div>
  )
}
