"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Course, CourseSchedule, Assignment, Memo } from '@/lib/types'
import { getCourse, getSchedules, updateCourse, getAssignments, createAssignment, updateAssignment, deleteAssignment, getMemos, createMemo, deleteMemo } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'

const MOOD_OPTIONS = ['😊', '🤔', '😴', '😤', '❤️', '✍️', '💡', '📖']

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
  const [memoForm, setMemoForm] = useState({ content: '', mood_emoji: '😊' })

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
    if (updated) {
      setCourse(updated)
      setEditing(false)
    }
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
    if (updated) {
      setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    }
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
    })
    setMemos((prev) => [m, ...prev])
    setMemoForm({ content: '', mood_emoji: '😊' })
    setShowMemoForm(false)
  }

  const handleDeleteMemo = async (id: string) => {
    await deleteMemo(id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-ink-light dark:text-sand/50">课程未找到</p>
      </div>
    )
  }

  const perWeek = schedules.length
  const totalClasses = perWeek * 15
  const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)
  const remaining = totalClasses - completedClasses

  const DAY_MAP: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' }

  // Mood distribution
  const moodCounts: Record<string, number> = {}
  memos.forEach((m) => {
    moodCounts[m.mood_emoji] = (moodCounts[m.mood_emoji] ?? 0) + 1
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-ink-light dark:text-sand/50 hover:text-ink dark:hover:text-sand transition-colors"
      >
        ← 返回课程列表
      </button>

      {/* Course header */}
      <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: course.color }}
            >
              {course.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink dark:text-sand">{course.name}</h1>
              <p className="text-sm text-ink-light dark:text-sand/50 mt-1">
                {course.teacher !== '—' && course.teacher}
                {course.classroom !== '—' && ` · ${course.classroom}`}
              </p>
              {course.week_type !== 'all' && (
                <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full bg-warm-beige dark:bg-ink-light/10 text-ink-light dark:text-sand/50">
                  {course.week_type === 'odd' ? '单周' : '双周'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors"
          >
            {editing ? '取消' : '编辑'}
          </button>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-sand/20 dark:border-ink-light/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-light dark:text-sand/50 block mb-1">课程名</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-btn bg-warm-beige dark:bg-ink-light/10 px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
                />
              </div>
              <div>
                <label className="text-xs text-ink-light dark:text-sand/50 block mb-1">教师</label>
                <input
                  value={editForm.teacher}
                  onChange={(e) => setEditForm((f) => ({ ...f, teacher: e.target.value }))}
                  className="w-full rounded-btn bg-warm-beige dark:bg-ink-light/10 px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
                />
              </div>
              <div>
                <label className="text-xs text-ink-light dark:text-sand/50 block mb-1">教室</label>
                <input
                  value={editForm.classroom}
                  onChange={(e) => setEditForm((f) => ({ ...f, classroom: e.target.value }))}
                  className="w-full rounded-btn bg-warm-beige dark:bg-ink-light/10 px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
                />
              </div>
              <div>
                <label className="text-xs text-ink-light dark:text-sand/50 block mb-1">颜色</label>
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full h-10 rounded-btn cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-ink-light dark:text-sand/50 block mb-1">单双周</label>
                <select
                  value={editForm.week_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, week_type: e.target.value as 'all' | 'odd' | 'even' }))}
                  className="w-full rounded-btn bg-warm-beige dark:bg-ink-light/10 px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
                >
                  <option value="all">每周</option>
                  <option value="odd">单周</option>
                  <option value="even">双周</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-btn bg-rust dark:bg-terracotta text-white text-sm hover:opacity-90 transition-opacity"
            >
              保存修改
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-ink dark:text-sand">{perWeek}</div>
            <div className="text-xs text-ink-light dark:text-sand/50">每周课时</div>
          </div>
          <div>
            <div className="text-lg font-bold text-rust dark:text-terracotta">{completedClasses}</div>
            <div className="text-xs text-ink-light dark:text-sand/50">已上课时</div>
          </div>
          <div>
            <div className="text-lg font-bold text-moss dark:text-sage">{remaining}</div>
            <div className="text-xs text-ink-light dark:text-sand/50">剩余课时</div>
          </div>
        </div>

        {/* Schedule times */}
        <div className="mt-4 pt-4 border-t border-sand/20 dark:border-ink-light/10">
          <h3 className="text-xs font-medium text-ink-light dark:text-sand/50 mb-2">上课时间</h3>
          <div className="flex flex-wrap gap-2">
            {schedules.map((s) => (
              <span
                key={s.id}
                className="text-xs px-2 py-1 rounded-full bg-warm-beige dark:bg-ink-light/10 text-ink-light dark:text-sand/60"
              >
                {DAY_MAP[s.day_of_week]} 第{s.start_period}-{s.end_period}节
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mood distribution */}
      {memos.length > 0 && (
        <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card p-5">
          <h3 className="text-sm font-medium text-ink dark:text-sand mb-3">心情分布</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(moodCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([emoji, count]) => (
                <div
                  key={emoji}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-beige dark:bg-ink-light/10"
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs text-ink-light dark:text-sand/50">{count}次</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ink dark:text-sand">
            作业 ({assignments.length})
          </h3>
          <button
            onClick={() => setShowAssignmentForm(!showAssignmentForm)}
            className="text-sm px-3 py-1 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors"
          >
            + 添加
          </button>
        </div>

        {showAssignmentForm && (
          <div className="mb-4 p-4 rounded-card bg-warm-beige/50 dark:bg-ink-light/5 space-y-3">
            <input
              placeholder="标题"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-btn bg-cream dark:bg-[#1E1B18] px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
            />
            <input
              placeholder="描述（可选）"
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-btn bg-cream dark:bg-[#1E1B18] px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
            />
            <input
              type="datetime-local"
              value={assignmentForm.due_date}
              onChange={(e) => setAssignmentForm((f) => ({ ...f, due_date: e.target.value }))}
              className="w-full rounded-btn bg-cream dark:bg-[#1E1B18] px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddAssignment}
                className="px-4 py-2 rounded-btn bg-rust dark:bg-terracotta text-white text-sm hover:opacity-90 transition-opacity"
              >
                添加
              </button>
              <button
                onClick={() => setShowAssignmentForm(false)}
                className="px-4 py-2 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {assignments.length === 0 && !showAssignmentForm && (
          <p className="text-sm text-ink-light/50 dark:text-sand/30 py-4 text-center">暂无作业</p>
        )}

        <div className="space-y-2">
          {assignments
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map((a) => {
              const isDue = new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div
                  key={a.id}
                  className={`rounded-card p-3 flex items-center gap-3 ${
                    isDue ? 'bg-rust/5 dark:bg-terracotta/5 border border-rust/20 dark:border-terracotta/20' : 'bg-warm-beige/30 dark:bg-ink-light/5'
                  }`}
                >
                  <button
                    onClick={() => handleToggleAssignment(a.id, a.status)}
                    className="text-lg flex-shrink-0 hover:scale-110 transition-transform"
                  >
                    {a.status === 'submitted' ? '✅' : '⬜'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${a.status === 'submitted' ? 'line-through text-ink-light/50 dark:text-sand/30' : ''}`}>
                      {a.title}
                    </p>
                    {a.description && (
                      <p className="text-xs text-ink-light dark:text-sand/50 truncate">{a.description}</p>
                    )}
                    <p className={`text-xs mt-0.5 ${isDue ? 'text-rust dark:text-terracotta font-medium' : 'text-ink-light dark:text-sand/50'}`}>
                      截止: {a.due_date.slice(0, 16).replace('T', ' ')}
                      {isDue && ' ⚠️ 即将截止'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(a.id)}
                    className="text-ink-light/30 dark:text-sand/20 hover:text-rust dark:hover:text-terracotta text-sm flex-shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
        </div>
      </div>

      {/* Memos */}
      <div className="rounded-card bg-paper dark:bg-[#252220] shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ink dark:text-sand">
            课堂备忘 ({memos.length})
          </h3>
          <button
            onClick={() => setShowMemoForm(!showMemoForm)}
            className="text-sm px-3 py-1 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors"
          >
            + 添加
          </button>
        </div>

        {showMemoForm && (
          <div className="mb-4 p-4 rounded-card bg-warm-beige/50 dark:bg-ink-light/5 space-y-3">
            <textarea
              placeholder="写下备忘..."
              value={memoForm.content}
              onChange={(e) => setMemoForm((f) => ({ ...f, content: e.target.value }))}
              rows={2}
              className="w-full rounded-btn bg-cream dark:bg-[#1E1B18] px-3 py-2 text-sm border border-sand/30 dark:border-ink-light/20 text-ink dark:text-sand resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-light dark:text-sand/50">心情:</span>
              {MOOD_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMemoForm((f) => ({ ...f, mood_emoji: emoji }))}
                  className={`text-lg p-1 rounded-lg transition-colors ${
                    memoForm.mood_emoji === emoji ? 'bg-warm-beige dark:bg-ink-light/20 ring-1 ring-sand dark:ring-ink-light/30' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddMemo}
                className="px-4 py-2 rounded-btn bg-rust dark:bg-terracotta text-white text-sm hover:opacity-90 transition-opacity"
              >
                添加
              </button>
              <button
                onClick={() => setShowMemoForm(false)}
                className="px-4 py-2 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {memos.length === 0 && !showMemoForm && (
          <p className="text-sm text-ink-light/50 dark:text-sand/30 py-4 text-center">暂无备忘</p>
        )}

        <div className="space-y-2">
          {memos.map((m) => (
            <div
              key={m.id}
              className="rounded-card p-3 bg-warm-beige/30 dark:bg-ink-light/5 flex items-start gap-3 group"
            >
              <span className="text-lg flex-shrink-0">{m.mood_emoji}</span>
              <p className="text-sm flex-1">{m.content}</p>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDeleteMemo(m.id)}
                  className="text-ink-light/20 dark:text-sand/10 group-hover:text-ink-light/40 dark:group-hover:text-sand/30 text-xs transition-colors"
                >
                  ✕
                </button>
                <span className="text-[10px] text-ink-light/40 dark:text-sand/20">
                  {m.created_at.slice(5, 16).replace('T', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
