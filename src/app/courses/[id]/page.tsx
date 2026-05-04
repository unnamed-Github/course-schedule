"use client"

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Course, CourseSchedule, Assignment, Memo, MoodTag, getMoodColor, DDL_REMINDER_OPTIONS } from '@/lib/types'
import { getCourse, getSchedules, updateCourse, getAssignments, createAssignment, updateAssignment, deleteAssignment, getMemos, createMemo, deleteMemo, createSchedule, updateSchedule, deleteSchedule } from '@/lib/data'
import { getWeekNumber, getSemesterConfig } from '@/lib/semester'
import { MoodTagSelector } from '@/components/MoodTagSelector'
import { useToast } from '@/components/ToastProvider'
import { EMOJI_OPTIONS } from '@/lib/constants'
import { ClipboardList, Pin, Check, Square, X, ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react'

export const dynamic = 'auto'

function countdown(dueDate: string): string {
  const diff = new Date(dueDate).getTime() - Date.now()
  if (diff < 0) return '已逾期'
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}天后截止`
  if (hours > 0) return `${hours}小时后截止`
  return '即将截止'
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const { showToast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [weekNum, setWeekNum] = useState(0)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', teacher: '', classroom: '', color: '', week_type: 'all' as 'all' | 'odd' | 'even' })

  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', due_date: '', reminders: [] as number[] })
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [editAssignmentForm, setEditAssignmentForm] = useState({ title: '', description: '', due_date: '', reminders: [] as number[] })

  const [showMemoForm, setShowMemoForm] = useState(false)
  const [memoForm, setMemoForm] = useState({ content: '', mood_emoji: '😊', mood_tags: [] as MoodTag[] })
  
  // Schedule editing
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: 1, start_period: 1, end_period: 2, location: '', week_type: 'all' as 'all' | 'odd' | 'even' })

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

    const onDataChanged = () => {
      getAssignments(courseId).then(setAssignments)
      getMemos(courseId).then(setMemos)
    }
    window.addEventListener('data-changed', onDataChanged)

    return () => window.removeEventListener('data-changed', onDataChanged)
  }, [courseId])

  const handleSaveEdit = async () => {
    try {
      const u = await updateCourse(courseId, editForm)
      if (u) {
        setCourse(u)
        setEditing(false)
        showToast('课程已更新', 'success')
      }
    } catch (e) {
      showToast('更新失败', 'error')
    }
  }
  
  const handleAddSchedule = async () => {
    try {
      const s = await createSchedule({ 
        course_id: courseId, 
        day_of_week: scheduleForm.day_of_week, 
        start_period: scheduleForm.start_period, 
        end_period: scheduleForm.end_period, 
        location: scheduleForm.location, 
        week_type: scheduleForm.week_type 
      })
      if (s) {
        setSchedules(prev => [...prev, s])
        setEditingScheduleId(null)
        showToast('时间已添加', 'success')
      }
    } catch (e) {
      showToast('添加失败', 'error')
    }
  }
  
  const handleEditSchedule = (s: CourseSchedule) => {
    setEditingScheduleId(s.id)
    setScheduleForm({ 
      day_of_week: s.day_of_week, 
      start_period: s.start_period, 
      end_period: s.end_period, 
      location: s.location, 
      week_type: s.week_type 
    })
  }
  
  const handleSaveSchedule = async () => {
    if (!editingScheduleId) return
    try {
      const s = await updateSchedule(editingScheduleId, scheduleForm)
      if (s) {
        setSchedules(prev => prev.map(x => x.id === s.id ? s : x))
        setEditingScheduleId(null)
        showToast('时间已更新', 'success')
      }
    } catch (e) {
      showToast('更新失败', 'error')
    }
  }
  
  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id)
      setSchedules(prev => prev.filter(x => x.id !== id))
      showToast('时间已删除', 'success')
    } catch (e) {
      showToast('删除失败', 'error')
    }
  }
  const handleAddAssignment = async () => {
    try {
      if (!assignmentForm.title || !assignmentForm.due_date) return
      const a = await createAssignment({ course_id: courseId, title: assignmentForm.title, description: assignmentForm.description, due_date: new Date(assignmentForm.due_date).toISOString(), status: 'pending', reminders: assignmentForm.reminders.length > 0 ? assignmentForm.reminders : undefined })
      if (a) {
        setAssignments((prev) => [...prev, a])
        setAssignmentForm({ title: '', description: '', due_date: '', reminders: [] })
        setShowAssignmentForm(false)
        showToast('作业已添加', 'success')
      } else {
        showToast('添加作业失败', 'error')
      }
    } catch (e) {
      showToast('添加作业失败', 'error')
    }
  }
  const handleToggleAssignment = async (id: string, s: string) => {
    try {
      const u = await updateAssignment(id, { status: s === 'submitted' ? 'pending' : 'submitted' })
      if (u) {
        setAssignments((prev) => prev.map((a) => (a.id === id ? u : a)))
        showToast(u.status === 'submitted' ? '作业已完成' : '作业重新标记为待完成', 'success')
      }
    } catch (e) {
      showToast('更新失败', 'error')
    }
  }
  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      showToast('作业已删除', 'success')
    } catch (e) {
      showToast('删除失败', 'error')
    }
  }
  const handleEditAssignment = (a: Assignment) => {
    setEditingAssignmentId(a.id)
    const d = new Date(a.due_date)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    setEditAssignmentForm({ title: a.title, description: a.description || '', due_date: local, reminders: a.reminders || [] })
  }
  const handleSaveEditAssignment = async () => {
    if (!editingAssignmentId || !editAssignmentForm.title.trim()) return
    try {
      const u = await updateAssignment(editingAssignmentId, {
        title: editAssignmentForm.title.trim(),
        description: editAssignmentForm.description.trim(),
        due_date: new Date(editAssignmentForm.due_date).toISOString(),
        reminders: editAssignmentForm.reminders,
      })
      if (u) {
        setAssignments((prev) => prev.map((a) => (a.id === editingAssignmentId ? u : a)))
        showToast('作业已更新', 'success')
      }
    } catch (e) {
      showToast('更新失败', 'error')
    }
    setEditingAssignmentId(null)
  }
  const handleAddMemo = async () => {
    try {
      if (!memoForm.content) return
      const m = await createMemo({ course_id: courseId, content: memoForm.content, mood_emoji: memoForm.mood_emoji, mood_tags: memoForm.mood_tags })
      if (m) {
        setMemos((prev) => [m, ...prev])
        setMemoForm({ content: '', mood_emoji: '😊', mood_tags: [] })
        setShowMemoForm(false)
        showToast('备忘已添加', 'success')
      } else {
        showToast('添加备忘失败', 'error')
      }
    } catch (e) {
      showToast('添加备忘失败', 'error')
    }
  }
  const handleDeleteMemo = async (id: string) => {
    try {
      await deleteMemo(id)
      setMemos((prev) => prev.filter((m) => m.id !== id))
      showToast('备忘已删除', 'success')
    } catch (e) {
      showToast('删除失败', 'error')
    }
  }

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    memos.forEach((m) => { m.mood_tags?.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }) })
    return counts
  }, [memos])

  if (!course) return <div className="max-w-2xl mx-auto text-center py-20"><p style={{ color: 'var(--text-secondary)' }}>课程未找到</p></div>

  const perWeek = schedules.length
  const totalWeeks = getSemesterConfig().teachingWeeks
  const totalClasses = perWeek * totalWeeks
  const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)
  const remaining = totalClasses - completedClasses
  const progressRate = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0
  const circumference = 2 * Math.PI * 28
  const progressOffset = circumference - (progressRate / 100) * circumference

  const DAY_MAP: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' }

  const sortedAssignments = [...assignments].sort((a, b) => a.due_date.localeCompare(b.due_date))

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => router.back()} className="btn-ghost text-xs flex items-center gap-1"><ChevronLeft size={14} strokeWidth={1.8} />返回课程列表</button>

      {/* ======== HEADER CARD ======== */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden glass-strong">
        <div style={{ height: 5, background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}66 100%)` }} />
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: course.color }}>
                {course.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{course.name}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {course.teacher !== '—' ? course.teacher : ''}
                  {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
                </p>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-ghost text-sm">{editing ? '取消' : '编辑'}</button>
          </div>

          {editing && (
            <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border-light)' }}>
              {/* Basic course info */}
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>基本信息</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['name', 'teacher', 'classroom'] as const).map((f) => (
                    <div key={f}>
                      <label className="text-[10px] block mb-1" style={{ color: 'var(--text-secondary)' }}>{f === 'name' ? '课程名' : f === 'teacher' ? '教师' : '教室'}</label>
                      <input value={editForm[f]} onChange={(e) => setEditForm((pf) => ({ ...pf, [f]: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                    </div>
                  ))}
                  <div><label className="text-[10px] block mb-1" style={{ color: 'var(--text-secondary)' }}>颜色</label><input type="color" value={editForm.color} onChange={(e) => setEditForm((pf) => ({ ...pf, color: e.target.value }))} className="w-full h-10 rounded-xl cursor-pointer" /></div>
                </div>
                <button onClick={handleSaveEdit} className="rounded-xl px-4 py-2 text-xs text-white font-medium hover:opacity-90" style={{ backgroundColor: 'var(--accent-info)' }}>保存信息</button>
              </div>

              {/* Schedule management */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>上课时间</p>
                  {!editingScheduleId && (
                    <button onClick={() => setEditingScheduleId('new')} className="btn-ghost text-xs flex items-center gap-0.5"><Plus size={12} strokeWidth={2} />添加</button>
                  )}
                </div>

                {/* Existing schedules */}
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      {editingScheduleId === s.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                            <option value={1}>周一</option><option value={2}>周二</option><option value={3}>周三</option><option value={4}>周四</option><option value={5}>周五</option>
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{DAY_MAP[s.day_of_week]} {s.start_period}-{s.end_period}节</span>
                          {s.location && s.location !== '—' && <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· {s.location}</span>}
                          {s.week_type !== 'all' && <span className="chip text-[10px]" style={{ backgroundColor: 'var(--accent-info)', color: 'white' }}>{s.week_type === 'odd' ? '单周' : '双周'}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {editingScheduleId === s.id ? (
                          <>
                            <button onClick={handleSaveSchedule} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                            <button onClick={() => setEditingScheduleId(null)} className="btn-ghost text-xs">取消</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditSchedule(s)} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                            <button onClick={() => handleDeleteSchedule(s.id)} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add new schedule form */}
                  {editingScheduleId === 'new' && (
                    <div className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })} className="rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)' }}>
                        <option value={1}>周一</option><option value={2}>周二</option><option value={3}>周三</option><option value={4}>周四</option><option value={5}>周五</option>
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
            </div>
          )}

          {/* Progress ring + stats */}
          <div className="flex items-center gap-5 mt-5">
            <svg width="64" height="64" className="flex-shrink-0">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border-light)" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={course.color} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={progressOffset}
                transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
              <text x="32" y="35" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700">{progressRate}%</text>
            </svg>
            <div className="grid grid-cols-3 flex-1 text-center gap-2">
              <div><div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{perWeek}</div><div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>周课时</div></div>
              <div><div className="text-base font-bold" style={{ color: 'var(--accent-warm)' }}>{completedClasses}</div><div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>已上</div></div>
              <div><div className="text-base font-bold" style={{ color: 'var(--accent-success)' }}>{remaining}</div><div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>剩余</div></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {schedules.map((s) => (
              <span key={s.id} className="chip">{DAY_MAP[s.day_of_week]} {s.start_period}-{s.end_period}节</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ======== MOOD ======== */}
      <div className="rounded-2xl p-5 glass-strong">
        <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--text-primary)' }}>心情统计</h3>
        {Object.keys(tagCounts).length > 0 ? (
          <div className="space-y-2">
            {(['⭐喜欢', '🥱苟住', '💪硬扛', '🌈期待'] as MoodTag[]).map((tag) => {
              const count = tagCounts[tag] ?? 0
              const totalCount = Object.values(tagCounts).reduce((a, b) => a + b, 0)
              const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="w-24 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{tag}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-light)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: getMoodColor(tag) }}
                    />
                  </div>
                  <span className="w-8 text-xs text-right" style={{ color: 'var(--text-secondary)' }}>{count}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>还没有记录心情，上课时记得标记哦～</p>
        )}
      </div>

      {/* ======== ASSIGNMENTS ======== */}
      <div className="rounded-2xl p-5 glass-strong">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><ClipboardList size={14} strokeWidth={1.8} />作业 ({assignments.length})</h3>
          <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className="btn-ghost text-xs flex items-center gap-0.5"><Plus size={12} strokeWidth={2} />添加</button>
        </div>

        {showAssignmentForm && (
          <div className="mb-3 p-4 rounded-2xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <input placeholder="标题" value={assignmentForm.title} onChange={(e) => setAssignmentForm((f) => ({ ...f, title: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handleAddAssignment() }} autoFocus className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
            <input placeholder="描述" value={assignmentForm.description} onChange={(e) => setAssignmentForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
            <input type="datetime-local" value={assignmentForm.due_date} onChange={(e) => setAssignmentForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
            <div className="flex flex-wrap gap-1">
              {DDL_REMINDER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAssignmentForm((f) => ({
                    ...f,
                    reminders: f.reminders.includes(opt.value)
                      ? f.reminders.filter(v => v !== opt.value)
                      : [...f.reminders, opt.value],
                  }))}
                  className="px-2 py-0.5 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: assignmentForm.reminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--bg-card)',
                    color: assignmentForm.reminders.includes(opt.value) ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAssignment} className="btn-primary text-xs">添加</button>
              <button onClick={() => setShowAssignmentForm(false)} className="btn-ghost text-xs">取消</button>
            </div>
          </div>
        )}

        {assignments.length === 0 && !showAssignmentForm ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无作业</p>
        ) : (
          <div className="space-y-0.5">
            {sortedAssignments.map((a) => {
              const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
              const isNear = !isOverdue && new Date(a.due_date).getTime() - Date.now() < 86400000 && a.status === 'pending'
              return (
                <div key={a.id} className="py-2.5 px-3 rounded-xl hover:bg-[var(--border-light)]/30 transition-colors">
                  {editingAssignmentId === a.id ? (
                    <div className="space-y-2">
                      <input value={editAssignmentForm.title} onChange={(e) => setEditAssignmentForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                      <input value={editAssignmentForm.description} onChange={(e) => setEditAssignmentForm((f) => ({ ...f, description: e.target.value }))} placeholder="描述" className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                      <input type="datetime-local" value={editAssignmentForm.due_date} onChange={(e) => setEditAssignmentForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full rounded-xl px-3 py-2 text-sm glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
                      <div className="flex flex-wrap gap-1">
                        {DDL_REMINDER_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setEditAssignmentForm((f) => ({
                              ...f,
                              reminders: f.reminders.includes(opt.value)
                                ? f.reminders.filter(v => v !== opt.value)
                                : [...f.reminders, opt.value],
                            }))}
                            className="px-2 py-0.5 rounded text-xs transition-colors"
                            style={{
                              backgroundColor: editAssignmentForm.reminders.includes(opt.value) ? 'var(--accent-info)' : 'var(--bg-card)',
                              color: editAssignmentForm.reminders.includes(opt.value) ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--border-light)',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEditAssignment} className="btn-primary text-xs">保存</button>
                        <button onClick={() => setEditingAssignmentId(null)} className="btn-ghost text-xs">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleAssignment(a.id, a.status)} className="text-base flex-shrink-0 cursor-pointer">{a.status === 'submitted' ? <Check size={16} strokeWidth={2.5} style={{ color: 'var(--accent-success)' }} /> : <Square size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />}</button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : course.color, minHeight: '16px', width: 2 }} />
                          <p className={`text-sm truncate ${a.status === 'submitted' ? 'opacity-40' : ''}`} style={{ color: 'var(--text-primary)' }}>{a.title}{a.status === 'submitted' && <Check size={12} strokeWidth={2.5} style={{ color: 'var(--accent-success)', display: 'inline', marginLeft: '4px', verticalAlign: '-2px' }} />}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 ml-[10px]">
                          <span className="text-[10px]" style={{ color: isOverdue ? 'var(--accent-danger)' : isNear ? 'var(--accent-warm)' : 'var(--text-secondary)' }}>{countdown(a.due_date)}</span>
                          <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{new Date(a.due_date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\//g, '-')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleEditAssignment(a)} className="cursor-pointer opacity-30 hover:opacity-60 transition-opacity" style={{ color: 'var(--accent-info)' }}><Pencil size={13} strokeWidth={2} /></button>
                        <button onClick={() => handleDeleteAssignment(a.id)} className="cursor-pointer opacity-30 hover:opacity-60 transition-opacity" style={{ color: 'var(--accent-danger)' }}><Trash2 size={13} strokeWidth={2} /></button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ======== MEMOS ======== */}
      <div className="rounded-2xl p-5 glass-strong">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><Pin size={14} strokeWidth={1.8} />课堂备忘 ({memos.length})</h3>
          <button onClick={() => setShowMemoForm(!showMemoForm)} className="btn-ghost text-xs flex items-center gap-0.5"><Plus size={12} strokeWidth={2} />添加</button>
        </div>

        {showMemoForm && (
          <div className="mb-3 p-4 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <textarea placeholder="写下备忘..." value={memoForm.content} onChange={(e) => setMemoForm((f) => ({ ...f, content: e.target.value }))} rows={2} className="w-full rounded-xl px-3 py-2 text-sm resize-none glass-subtle" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>心情:</span>
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} onClick={() => setMemoForm((f) => ({ ...f, mood_emoji: emoji }))} className={`text-lg p-1 rounded-lg transition-colors ${memoForm.mood_emoji === emoji ? 'bg-[var(--border-light)]' : ''}`}>{emoji}</button>
              ))}
            </div>
            <div><span className="text-[10px] mb-1 block" style={{ color: 'var(--text-secondary)' }}>心情标签:</span><MoodTagSelector selected={memoForm.mood_tags} onChange={(tags) => setMemoForm((f) => ({ ...f, mood_tags: tags }))} /></div>
            <div className="flex gap-2">
              <button onClick={handleAddMemo} className="btn-primary text-xs">添加</button>
              <button onClick={() => setShowMemoForm(false)} className="btn-ghost text-xs">取消</button>
            </div>
          </div>
        )}

        {memos.length === 0 && !showMemoForm ? (
          <p className="text-xs py-3 text-center" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>暂无备忘</p>
        ) : (
          <div className="space-y-2.5">
            {memos.map((m) => (
              <div key={m.id} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: 'var(--border-light)' }}>{m.mood_emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block max-w-full" style={{ backgroundColor: `${course.color}08`, border: `1px solid ${course.color}1A` }}>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.content}</p>
                  </div>
                  {m.mood_tags && m.mood_tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {m.mood_tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${getMoodColor(tag)}1A`, color: getMoodColor(tag) }}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>{m.created_at.slice(5, 16).replace('T', ' ')}</p>
                </div>
                <button onClick={() => handleDeleteMemo(m.id)} className="cursor-pointer opacity-0 group-hover:opacity-30 transition-opacity mt-1"><X size={14} strokeWidth={1.8} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
