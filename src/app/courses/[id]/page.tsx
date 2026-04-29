"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Course, CourseSchedule, Assignment, Memo, MoodTag } from '@/lib/types'
import { getCourse, getSchedules, updateCourse, getAssignments, createAssignment, updateAssignment, deleteAssignment, getMemos, createMemo, deleteMemo } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'
import { MoodTagSelector } from '@/components/MoodTagSelector'

const EMOJI_OPTIONS = ['😊', '🤔', '😴', '😤', '❤️', '✍️', '💡', '📖']

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', teacher: '', classroom: '', color: '', week_type: 'all' as 'all' | 'odd' | 'even' })

  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', due_date: '' })

  const [showMemoForm, setShowMemoForm] = useState(false)
  const [memoForm, setMemoForm] = useState({ content: '', mood_emoji: '😊', mood_tags: [] as MoodTag[] })

  useEffect(() => {
    getCourse(courseId).then((c) => {
      if (!c) return
      setCourse(c)
      setEditForm({ name: c.name, teacher: c.teacher, classroom: c.classroom, color: c.color, week_type: c.week_type })
    })
    getSchedules(courseId).then(setSchedules)
    getAssignments(courseId).then(setAssignments)
    getMemos(courseId).then(setMemos)
    setWeekNum(getWeekNumber())
  }, [courseId])

  const handleSaveEdit = async () => {
    const updated = await updateCourse(courseId, editForm)
    if (updated) { setCourse(updated); setEditing(false) }
  }

  const handleAddAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.due_date) return
    const a = await createAssignment({
      course_id: courseId,
      title: assignmentForm.title,
      description: assignmentForm.description,
      due_date: new Date(assignmentForm.due_date).toISOString(),
      status: 'pending',
    })
    setAssignments((prev) => [...prev, a])
    setAssignmentForm({ title: '', description: '', due_date: '' })
    setShowAssignmentForm(false)
  }

  const handleToggleAssignment = async (id: string, currentStatus: string) => {
    const updated = await updateAssignment(id, {
      status: currentStatus === 'submitted' ? 'pending' : 'submitted',
    })
    if (updated) setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  const handleDeleteAssignment = async (id: string) => {
    await deleteAssignment(id)
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAddMemo = async () => {
    if (!memoForm.content) return
    const m = await createMemo({
      course_id: courseId,
      content: memoForm.content,
      mood_emoji: memoForm.mood_emoji,
      mood_tags: memoForm.mood_tags,
    })
    setMemos((prev) => [m, ...prev])
    setMemoForm({ content: '', mood_emoji: '😊', mood_tags: [] })
    setShowMemoForm(false)
  }

  const handleDeleteMemo = async (id: string) => {
    await deleteMemo(id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p style={{ color: 'var(--fg-secondary)' }}>课程未找到</p>
      </div>
    )
  }

  const perWeek = schedules.length
  const totalClasses = perWeek * 15
  const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)
  const remaining = totalClasses - completedClasses

  const DAY_MAP: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' }

  const moodCounts: Record<string, number> = {}
  memos.forEach((m) => { moodCounts[m.mood_emoji] = (moodCounts[m.mood_emoji] ?? 0) + 1 })

  const tagCounts: Record<string, number> = {}
  memos.forEach((m) => {
    m.mood_tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1 })
  })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => router.back()} className="btn-ghost text-xs">← 返回课程列表</button>

      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div style={{ height: 4, backgroundColor: course.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: course.color }}
              >
                {course.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>{course.name}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--fg-secondary)' }}>
                  {course.teacher !== '—' ? course.teacher : ''}
                  {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                </p>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-ghost text-xs">
              {editing ? '取消' : '编辑'}
            </button>
          </div>

          {editing && (
            <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-2 gap-3">
                {(['name', 'teacher', 'classroom'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-[10px] block mb-1" style={{ color: 'var(--fg-secondary)' }}>
                      {field === 'name' ? '课程名' : field === 'teacher' ? '教师' : '教室'}
                    </label>
                    <input
                      value={editForm[field]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: 'var(--fg-secondary)' }}>颜色</label>
                  <input type="color" value={editForm.color} onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))} className="w-full h-10 rounded-xl cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: 'var(--fg-secondary)' }}>单双周</label>
                  <select value={editForm.week_type} onChange={(e) => setEditForm((f) => ({ ...f, week_type: e.target.value as 'all' | 'odd' | 'even' }))}
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                    <option value="all">每周</option>
                    <option value="odd">单周</option>
                    <option value="even">双周</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSaveEdit} className="rounded-xl px-4 py-2 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90">
                保存修改
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{perWeek}</div>
              <div className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>每周课时</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: '#F59E0B' }}>{completedClasses}</div>
              <div className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>已上</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: '#10B981' }}>{remaining}</div>
              <div className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>剩余</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {schedules.map((s) => (
              <span key={s.id} className="chip text-[10px]" style={{ borderColor: 'var(--border)' }}>
                {DAY_MAP[s.day_of_week]} {s.start_period}-{s.end_period}节
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mood Distribution */}
      {(Object.keys(moodCounts).length > 0 || Object.keys(tagCounts).length > 0) && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--fg)' }}>心情统计</h3>
          {Object.keys(moodCounts).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(moodCounts).sort(([, a], [, b]) => b - a).map(([emoji, count]) => (
                <span key={emoji} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--border)' }}>
                  {emoji} {count}次
                </span>
              ))}
            </div>
          )}
          {Object.keys(tagCounts).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待'] as MoodTag[]).map((tag) => {
                const count = tagCounts[tag] ?? 0
                if (count === 0) return null
                return (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: tag === '⭐喜欢' ? 'rgba(245,158,11,0.1)' : tag === '🥱苟住' ? 'rgba(107,114,128,0.1)' : tag === '💪硬扛' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      color: tag === '⭐喜欢' ? '#F59E0B' : tag === '🥱苟住' ? '#6B7280' : tag === '💪硬扛' ? '#EF4444' : '#10B981',
                    }}>
                    {tag} ×{count}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignments */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium" style={{ color: 'var(--fg)' }}>作业 ({assignments.length})</h3>
          <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className="btn-ghost text-xs">+ 添加</button>
        </div>

        {showAssignmentForm && (
          <div className="mb-3 p-4 rounded-2xl space-y-2" style={{ backgroundColor: 'var(--bg)' }}>
            <input
              placeholder="标题"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddAssignment() }}
              autoFocus
              className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--fg)', backgroundColor: 'var(--card-bg)' }} />
            <input placeholder="描述" value={assignmentForm.description} onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--fg)', backgroundColor: 'var(--card-bg)' }} />
            <input type="datetime-local" value={assignmentForm.due_date} onChange={(e) => setAssignmentForm((f) => ({ ...f, due_date: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--fg)', backgroundColor: 'var(--card-bg)' }} />
            <div className="flex gap-2">
              <button onClick={handleAddAssignment} className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90">添加</button>
              <button onClick={() => setShowAssignmentForm(false)} className="btn-ghost text-xs">取消</button>
            </div>
          </div>
        )}

        {assignments.length === 0 && !showAssignmentForm ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无作业</p>
        ) : (
          <div className="space-y-1">
            {assignments.sort((a, b) => a.due_date.localeCompare(b.due_date)).map((a) => {
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => handleToggleAssignment(a.id, a.status)} className="text-base flex-shrink-0">
                    {a.status === 'submitted' ? '✅' : '⬜'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${a.status === 'submitted' ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--fg)' }}>
                      {a.title}
                    </p>
                    <p className={`text-xs ${isOverdue ? 'text-[#EF4444]' : isNear ? 'text-[#F59E0B]' : ''}`}
                      style={!isOverdue && !isNear ? { color: 'var(--fg-secondary)' } : {}}>
                      截止: {a.due_date.slice(0, 16).replace('T', ' ')}
                      {isOverdue && ' ⚠️'}
                      {isNear && ' ⏰'}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteAssignment(a.id)} className="text-xs opacity-30 hover:opacity-60">✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Memos */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium" style={{ color: 'var(--fg)' }}>课堂备忘 ({memos.length})</h3>
          <button onClick={() => setShowMemoForm(!showMemoForm)} className="btn-ghost text-xs">+ 添加</button>
        </div>

        {showMemoForm && (
          <div className="mb-3 p-4 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--bg)' }}>
            <textarea placeholder="写下备忘..." value={memoForm.content} onChange={(e) => setMemoForm((f) => ({ ...f, content: e.target.value }))} rows={2}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none" style={{ border: '1px solid var(--border)', color: 'var(--fg)', backgroundColor: 'var(--card-bg)' }} />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px]" style={{ color: 'var(--fg-secondary)' }}>心情:</span>
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} onClick={() => setMemoForm((f) => ({ ...f, mood_emoji: emoji }))}
                  className={`text-lg p-1 rounded-lg ${memoForm.mood_emoji === emoji ? 'ring-1 ring-[var(--border)]' : ''}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <div>
              <span className="text-[10px] mb-1 block" style={{ color: 'var(--fg-secondary)' }}>心情标签:</span>
              <MoodTagSelector selected={memoForm.mood_tags} onChange={(tags) => setMemoForm((f) => ({ ...f, mood_tags: tags }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddMemo} className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90">添加</button>
              <button onClick={() => setShowMemoForm(false)} className="btn-ghost text-xs">取消</button>
            </div>
          </div>
        )}

        {memos.length === 0 && !showMemoForm ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>暂无备忘</p>
        ) : (
          <div className="space-y-2">
            {memos.map((m) => (
              <div key={m.id} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: 'var(--border)' }}>
                  {m.mood_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-full" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--fg)' }}>{m.content}</p>
                  </div>
                  {m.mood_tags && m.mood_tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {m.mood_tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: tag === '⭐喜欢' ? 'rgba(245,158,11,0.1)' : tag === '🥱苟住' ? 'rgba(107,114,128,0.1)' : tag === '💪硬扛' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            color: tag === '⭐喜欢' ? '#F59E0B' : tag === '🥱苟住' ? '#6B7280' : tag === '💪硬扛' ? '#EF4444' : '#10B981',
                          }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>
                    {m.created_at.slice(5, 16).replace('T', ' ')}
                  </p>
                </div>
                <button onClick={() => handleDeleteMemo(m.id)} className="text-xs opacity-0 group-hover:opacity-30 transition-opacity">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
