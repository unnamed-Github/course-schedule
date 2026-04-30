'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Course, Memo } from '@/lib/types'
import { getCourses, getMemos, createMemo, deleteMemo } from '@/lib/data'
import { Modal } from './Modal'
import { Plus, StickyNote, X } from 'lucide-react'

const EMOJI_OPTIONS = ['📝', '💡', '🤔', '😊', '😤', '💪', '🎉', '📖', '✨', '⚠️']

export function MemosView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newMemo, setNewMemo] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📝')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    Promise.all([getCourses(), getMemos()]).then(([c, m]) => {
      setCourses(c)
      setMemos(m)
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
    })
    
    if (memo) {
      setMemos(prev => [memo, ...prev])
      setNewMemo('')
    }
  }

  const handleDeleteMemo = async (id: string) => {
    await deleteMemo(id)
    setMemos(prev => prev.filter(m => m.id !== id))
  }

  if (!loaded) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>课堂备忘</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs flex items-center gap-1"><Plus size={14} strokeWidth={2} />新增备忘</button>
      </div>

      {/* 备忘列表 */}
      <div className="space-y-3">
        {memos.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-light)' }}>
            <div className="flex justify-center mb-2"><StickyNote size={32} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} /></div>
            <p style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>还没有备忘，快来记录吧！</p>
          </div>
        ) : (
          memos.map((memo, index) => {
            const course = courses.find(c => c.id === memo.course_id)
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
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{memo.mood_emoji}</span>
                      {course && (
                        <span className="text-sm font-medium" style={{ color: course.color }}>
                          {course.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      className="opacity-30 hover:opacity-60 transition-opacity flex-shrink-0 cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <X size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{memo.content}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                    {memo.created_at.replace('T', ' ')}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 底部心情统计 */}
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

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增备忘">
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
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
