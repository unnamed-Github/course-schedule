'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CourseSchedule, Course, Assignment, Memo, ScheduleOverride, DDL_REMINDER_OPTIONS } from '@/lib/types'
import { getScheduleOverridesBatch, createAssignment, createMemo, getAssignments, getMemos } from '@/lib/data'
import { useData } from './DataContext'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'
import { getCurrentPeriod, getWeekNumber, getWeekDateRange, isHoliday, getMakeupInfo } from '@/lib/schedule'
import { PERIOD_TIMES, getSemesterConfig } from '@/lib/semester'
import { SkeletonGrid } from './Skeleton'
import { useToast } from './ToastProvider'
import { useScheduleOverride } from '@/hooks/useScheduleOverride'
import { ChevronLeft, ChevronRight, User, Clock, Trash2, RotateCcw, ClipboardList, Pin, Check, Square, StickyNote, Plus, Calendar } from 'lucide-react'
import { EMOJI_OPTIONS, DAY_MAP, PERIOD_GROUP_DEFS } from '@/lib/constants'

const PERIOD_GROUPS = PERIOD_GROUP_DEFS.map((g) => ({
  ...g,
  time: `${PERIOD_TIMES[g.start].start}-${PERIOD_TIMES[g.end].end}`,
}))

function countdownDisplay(dueDate: string): string {
  const diff = new Date(dueDate).getTime() - Date.now()
  if (diff < 0) return '已逾期'
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}天后`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}小时后`
  return '即将截止'
}

export function WeekView() {
  const { showToast } = useToast()
  const { courses, schedules, assignments, memos, loaded, loadError, reload, reloadAssignments, reloadMemos } = useData()
  const [weekNum, setWeekNum] = useState(0)
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)
  const [currentDay, setCurrentDay] = useState<number>(0)
  const [expandedSchedule, setExpandedSchedule] = useState<CourseSchedule | null>(null)
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const [weekOverrides, setWeekOverrides] = useState<ScheduleOverride[]>([])

  const [showQuickAssign, setShowQuickAssign] = useState(false)
  const [quickAssignTitle, setQuickAssignTitle] = useState('')
  const [quickAssignDueDate, setQuickAssignDueDate] = useState(() => {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  })
  const [quickReminders, setQuickReminders] = useState<number[]>([])
  const [showQuickMemo, setShowQuickMemo] = useState(false)
  const [quickMemoContent, setQuickMemoContent] = useState('')
  const [quickMemoEmoji, setQuickMemoEmoji] = useState('📝')
  const [quickAddScheduleId, setQuickAddScheduleId] = useState<string | undefined>(undefined)

  const localDate = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

  const loadOverrides = useCallback(() => {
    if (!weekRange) return
    const startDate = localDate(weekRange.start)
    const endDate = localDate(weekRange.end)
    getScheduleOverridesBatch(startDate, endDate)
      .then(setWeekOverrides)
      .catch(() => setWeekOverrides([]))
  }, [weekRange])

  const {
    confirmCancelId,
    handleOverrideAction,
    handleConfirmCancel,
    handleRevertOverride,
    cancelConfirmation,
  } = useScheduleOverride({
    onLoadOverrides: loadOverrides,
    onCloseDetail: () => setExpandedSchedule(null),
  })

  useEffect(() => {
    const wn = getWeekNumber()
    setWeekNum(wn)
    setWeekRange(getWeekDateRange(wn))
    const now = new Date()
    const dow = now.getDay()
    setCurrentDay(dow === 0 ? 7 : dow)
    setCurrentPeriod(getCurrentPeriod(now))
    const timer = setInterval(() => setCurrentPeriod(getCurrentPeriod()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadOverrides()
  }, [loadOverrides])

  useEffect(() => {
    setHighlightEnabled(getLocalSetting('highlight_enabled', 'true') !== 'false')
    const onStorage = () => setHighlightEnabled(getLocalSetting('highlight_enabled', 'true') !== 'false')
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    setShowQuickAssign(false)
    setShowQuickMemo(false)
  }, [expandedSchedule])

  const totalWeeks = getSemesterConfig().teachingWeeks

  const changeWeek = useCallback((delta: number) => {
    const newWeek = Math.max(1, Math.min(totalWeeks, weekNum + delta))
    setWeekNum(newWeek)
    setWeekRange(getWeekDateRange(newWeek))
    setCurrentDay(0)
    setCurrentPeriod(null)
    setExpandedSchedule(null)
  }, [weekNum, totalWeeks])

  const selectWeek = useCallback((w: number) => {
    setWeekNum(w)
    setWeekRange(getWeekDateRange(w))
    setCurrentDay(0)
    setCurrentPeriod(null)
    setExpandedSchedule(null)
  }, [])

  const toggleHighlight = useCallback(() => {
    const next = !highlightEnabled
    setHighlightEnabled(next)
    setSettingBoth('highlight_enabled', String(next))
  }, [highlightEnabled])

  const refreshAssignments = useCallback(() => {
    reloadAssignments()
  }, [reloadAssignments])

  const refreshMemos = useCallback(() => {
    reloadMemos()
  }, [reloadMemos])

  const handleQuickAddAssignment = async (courseId: string, scheduleId?: string) => {
    if (!quickAssignTitle.trim() || !quickAssignDueDate) return
    const [year, month, day] = quickAssignDueDate.split('-').map(Number)
    const dueMs = new Date(year, month - 1, day, 23, 59).getTime()
    const created = await createAssignment({
      title: quickAssignTitle.trim(),
      course_id: courseId,
      due_date: new Date(dueMs).toISOString(),
      description: '',
      status: 'pending',
      schedule_id: scheduleId || undefined,
      reminders: quickReminders.length > 0 ? quickReminders : undefined,
    })
    if (created) {
      setQuickAssignTitle('')
      setQuickAssignDueDate('')
      setQuickReminders([])
      setShowQuickAssign(false)
      refreshAssignments()
      showToast('作业已添加 ✅', 'success')
    }
  }

  const handleQuickAddMemo = async (courseId: string, scheduleId?: string) => {
    if (!quickMemoContent.trim()) return
    const created = await createMemo({
      course_id: courseId,
      content: quickMemoContent.trim(),
      mood_emoji: quickMemoEmoji,
      mood_tags: [],
      schedule_id: scheduleId || undefined,
    })
    if (created) {
      setQuickMemoContent('')
      setQuickMemoEmoji('📝')
      setShowQuickMemo(false)
      refreshMemos()
      showToast('备忘已添加 ✅', 'success')
    }
  }

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])

  const weekOverrideMap = useMemo(() => {
    const map = new Map<string, ScheduleOverride>()
    for (const o of weekOverrides) {
      map.set(`${o.schedule_id}_${o.date}`, o)
    }
    return map
  }, [weekOverrides])

  const getDayOverride = (scheduleId: string, dateStr: string) => {
    return weekOverrideMap.get(`${scheduleId}_${dateStr}`) ?? null
  }

  const weekHolidays = useMemo(() => {
    const holidays = new Map<number, ReturnType<typeof isHoliday>>()
    const makeups = new Map<number, ReturnType<typeof getMakeupInfo>>()
    const dayDateMap = new Map<number, string>()
    if (!weekRange) return { holidays, makeups, dayDateMap }
    const d = new Date(weekRange.start)
    for (let i = 0; i < 7; i++) {
      const current = new Date(d)
      current.setDate(d.getDate() + i)
      const dow = current.getDay() || 7
      holidays.set(dow, isHoliday(current))
      makeups.set(dow, getMakeupInfo(current))
      dayDateMap.set(dow, localDate(current))
    }
    return { holidays, makeups, dayDateMap }
  }, [weekRange])

  const showDays = useMemo(() => {
    const days = [1, 2, 3, 4, 5]
    for (const day of [6, 7]) {
      if (weekHolidays.makeups.get(day)) {
        days.push(day)
      }
    }
    days.sort((a, b) => a - b)
    return days
  }, [weekHolidays])

  function isCurrentCourse(schedule: CourseSchedule) {
    if (currentDay === 0 || currentPeriod === null) return false
    
    // Check week_type
    if (schedule.week_type === 'odd' && weekNum % 2 === 0) return false
    if (schedule.week_type === 'even' && weekNum % 2 !== 0) return false
    
    return schedule.day_of_week === currentDay && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
  }

  const getCourseAssignmentCount = (courseId: string) => {
    return assignments.filter(a => a.course_id === courseId && a.status === 'pending').length
  }

  if (!loaded) return <SkeletonGrid />
  if (loadError) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>加载失败，请检查网络连接</p>
        <button onClick={reload} className="btn-primary text-sm">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 周切换 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => changeWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors duration-200 cursor-pointer" style={{ color: 'var(--text-secondary)' }}><ChevronLeft size={16} strokeWidth={1.8} /></button>
          <select
            value={weekNum}
            onChange={(e) => selectWeek(parseInt(e.target.value))}
            className="rounded-lg px-2 py-1 text-xs sm:text-sm font-medium cursor-pointer glass-subtle"
            style={{ color: 'var(--text-primary)' }}
          >
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>第 {w} 周</option>
            ))}
          </select>
          <button onClick={() => changeWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--border-light)] transition-colors duration-200 cursor-pointer" style={{ color: 'var(--text-secondary)' }}><ChevronRight size={16} strokeWidth={1.8} /></button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            {weekRange ? `${weekRange.start.getMonth() + 1}/${weekRange.start.getDate()}—${weekRange.end.getMonth() + 1}/${weekRange.end.getDate()}` : ''}
          </span>
          <button
            onClick={toggleHighlight}
            className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: highlightEnabled ? 'var(--accent-warm)' : 'var(--bg-card)',
              color: highlightEnabled ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${highlightEnabled ? 'var(--accent-warm)' : 'var(--border-light)'}`,
            }}
          >
            {highlightEnabled ? '高亮' : '关闭'}
          </button>
        </div>
      </div>

      {/* 课表网格 */}
      <div className="overflow-x-auto">
        <div className="min-w-[520px] rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-light)' }}>
          {/* 星期标题 */}
          <div className="grid glass" style={{ gridTemplateColumns: `64px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)' }}>
            <div className="p-2 sm:p-3" />
            {showDays.map((day) => {
                const makeup = weekHolidays.makeups.get(day)
                return (
                  <div key={day} className="p-2 sm:p-3 text-center">
                    <span className="text-xs sm:text-sm font-semibold" style={{ color: day === currentDay ? 'var(--accent-info)' : 'var(--text-secondary)' }}>
                      周{DAY_MAP[day]}
                      {day >= 6 && makeup && (
                        <span className="ml-1 text-[10px]" style={{ color: 'var(--accent-warm)' }}>(补周{DAY_MAP[makeup.replacesDayOfWeek]})</span>
                      )}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* 时间段行 */}
          {PERIOD_GROUPS.map((group) => (
            <div key={group.label} className="grid" style={{ gridTemplateColumns: `64px repeat(${showDays.length}, 1fr)`, borderBottom: '1px solid var(--border-light)', minHeight: '72px' }}>
              <div className="p-2 sm:p-3 flex flex-col justify-center text-right glass">
                <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{group.label}</span>
                <span className="text-[9px] sm:text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{group.time}</span>
              </div>

              {showDays.map((day) => {
                const holiday = weekHolidays.holidays.get(day)
                const makeup = weekHolidays.makeups.get(day)
                const targetDay = (day >= 6 && makeup) ? makeup.replacesDayOfWeek : day
                const daySchedules = schedules.filter((s) => {
                  if (s.day_of_week !== targetDay) return false
                  if (s.week_type === 'odd' && weekNum % 2 === 0) return false
                  if (s.week_type === 'even' && weekNum % 2 !== 0) return false
                  if (s.start_period > group.end || s.end_period < group.start) return false
                  return true
                })

                return (
                  <div key={day} className="p-1.5 sm:p-2 flex flex-col gap-1.5 overflow-hidden min-w-0" style={{ backgroundColor: holiday ? 'var(--holiday-cell)' : 'transparent' }}>
                    {holiday && makeup ? (
                      <div className="flex-1 flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: 'var(--makeup-badge)' }}>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>补课</span>
                      </div>
                    ) : holiday ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-sm italic" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{holiday.name}</span>
                      </div>
                    ) : daySchedules.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center rounded-2xl" style={{ border: '1px dashed var(--border-light)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>无课程</span>
                      </div>
                    ) : (
                      daySchedules.map((schedule) => {
                        const course = courseMap.get(schedule.course_id)
                        if (!course) return null
                        const dateStr = weekHolidays.dayDateMap.get(day) ?? ''
                        const overrideEntry = getDayOverride(schedule.id, dateStr)
                        const isCancelled = overrideEntry?.type === 'cancelled'
                        const isEndedEarly = overrideEntry?.type === 'ended_early'
                        const active = !isCancelled && highlightEnabled && isCurrentCourse(schedule)
                        const isExpanded = !isCancelled && expandedSchedule?.id === schedule.id
                        const assignmentCount = getCourseAssignmentCount(course.id)

                        return (
                          <motion.div
                            key={schedule.id}
                            onClick={() => { if (!isCancelled) setExpandedSchedule(isExpanded ? null : schedule) }}
                            className="rounded-xl sm:rounded-2xl p-2 sm:p-3 relative overflow-hidden"
                            style={{
                              backgroundColor: course.color,
                              color: 'white',
                              opacity: isCancelled ? 0.45 : 1,
                              cursor: isCancelled ? 'default' : 'pointer',
                              ...(active ? { boxShadow: '0 0 0 3px var(--accent-warm)' } : {}),
                            }}
                            whileHover={isCancelled ? {} : { scale: 1.02, boxShadow: active ? '0 0 0 3px var(--accent-warm)' : 'var(--shadow-md)' }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm font-semibold truncate" style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{course.name}</div>
                                <div className="text-[10px] sm:text-xs opacity-80 truncate mt-0.5" style={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>{schedule.location !== '—' ? schedule.location : ''}</div>
                                {isCancelled && (
                                  <div className="text-[10px] opacity-90 mt-1 font-medium">已取消</div>
                                )}
                                {isEndedEarly && (
                                  <div className="text-[10px] opacity-90 mt-1 font-medium" style={{ color: '#D1FAE5' }}>已下课</div>
                                )}
                                {active && !isEndedEarly && (
                                  <div
                                    onClick={(e) => { e.stopPropagation(); handleOverrideAction(schedule.id, dateStr, 'ended_early') }}
                                    className="text-[10px] opacity-90 mt-1 font-medium cursor-pointer hover:opacity-70"
                                    style={{ color: '#D1FAE5' }}
                                  >
                                    提前下课
                                  </div>
                                )}
                              </div>
                              {assignmentCount > 0 && !isCancelled && (
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                  <span className="text-xs font-bold" style={{ color: course.color }}>{assignmentCount}</span>
                                </div>
                              )}
                            </div>

                            {/* 展开详情 */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                  animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-2 border-t border-white/20">
                                    {course.teacher !== '—' && (
                                      <p className="text-xs opacity-80 mb-1 flex items-center gap-1"><User size={12} strokeWidth={2} />{course.teacher}</p>
                                    )}
                                    <p className="text-xs opacity-80 flex items-center gap-1"><Clock size={12} strokeWidth={2} />第{schedule.start_period}-{schedule.end_period}节</p>
                                  </div>

                                  {(() => {
                                    const courseAssignments = assignments.filter(a => a.course_id === course.id)
                                    const courseMemos = memos.filter(m =>
                                      m.course_id === course.id && (m.schedule_id === schedule.id || !m.schedule_id)
                                    ).slice(0, 3)
                                    const hasContent = courseAssignments.length > 0 || courseMemos.length > 0

                                    if (!hasContent) {
                                      return (
                                        <div className="mt-2 pt-2 border-t border-white/20">
                                          <p className="text-[10px] opacity-50">暂无作业和备忘</p>
                                        </div>
                                      )
                                    }

                                    return (
                                      <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                                        {courseAssignments.length > 0 && (
                                          <div>
                                            <p className="text-[10px] opacity-70 font-medium flex items-center gap-1 mb-1"><ClipboardList size={10} strokeWidth={2} />作业 ({courseAssignments.length})</p>
                                            <div className="space-y-0.5">
                                              {courseAssignments.map(a => {
                                                const isOverdue = new Date(a.due_date).getTime() < Date.now() && a.status === 'pending'
                                                return (
                                                  <div key={a.id} className="flex items-center gap-1.5 text-[10px]" style={{ opacity: a.status === 'submitted' ? 0.45 : 1 }}>
                                                    {a.status === 'submitted' ? <Check size={10} strokeWidth={2.5} style={{ color: '#6EE7B7' }} /> : <Square size={10} strokeWidth={1.5} style={{ opacity: 0.5 }} />}
                                                    <span className="truncate flex-1">{a.title}</span>
                                                    {a.status === 'pending' && (
                                                      <span style={{ color: isOverdue ? '#FCA5A5' : 'rgba(255,255,255,0.6)' }}>{countdownDisplay(a.due_date)}</span>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}
                                        {courseMemos.length > 0 && (
                                          <div>
                                            <p className="text-[10px] opacity-70 font-medium flex items-center gap-1 mb-1"><Pin size={10} strokeWidth={2} />备忘 ({courseMemos.length})</p>
                                            <div className="space-y-0.5">
                                              {courseMemos.map(m => (
                                                <div key={m.id} className="flex items-start gap-1.5 text-[10px]">
                                                  <span className="flex-shrink-0">{m.mood_emoji}</span>
                                                  <span className="truncate opacity-80">{m.content}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}

                                  {/* 操作按钮 */}
                                  <div className="mt-3 pt-2 border-t border-white/20">
                                    {overrideEntry ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRevertOverride(schedule.id, dateStr) }}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                      >
                                        <RotateCcw size={12} strokeWidth={2} />
                                        {overrideEntry.type === 'cancelled' ? '恢复本课' : '撤销下课'}
                                      </button>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {confirmCancelId === schedule.id ? (
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] opacity-80">确认取消？</span>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleConfirmCancel(dateStr) }}
                                                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                              >
                                                确认
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); cancelConfirmation() }}
                                                className="px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                                              >
                                                取消
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleOverrideAction(schedule.id, dateStr, 'cancelled') }}
                                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                            >
                                              <Trash2 size={12} strokeWidth={2} />
                                              取消本课
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setShowQuickAssign(!showQuickAssign); setShowQuickMemo(false); setQuickAddScheduleId(schedule.id) }}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                                          >
                                            <Plus size={12} strokeWidth={2} />
                                            作业
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setShowQuickMemo(!showQuickMemo); setShowQuickAssign(false); setQuickAddScheduleId(schedule.id) }}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                                          >
                                            <StickyNote size={12} strokeWidth={2} />
                                            备忘
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 快捷添加作业表单 */}
                                  <AnimatePresence>
                                    {showQuickAssign && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                                          <input
                                            value={quickAssignTitle}
                                            onChange={(e) => setQuickAssignTitle(e.target.value)}
                                            placeholder="作业标题"
                                            className="w-full rounded-lg px-2 py-1 text-[10px] outline-none"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div className="flex items-center gap-2">
                                            <Calendar size={12} strokeWidth={2} style={{ opacity: 0.6 }} />
                                            <input
                                              type="date"
                                              value={quickAssignDueDate}
                                              onChange={(e) => setQuickAssignDueDate(e.target.value)}
                                              className="flex-1 rounded-lg px-2 py-1 text-[10px] outline-none"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {DDL_REMINDER_OPTIONS.map(opt => (
                                              <button
                                                key={opt.value}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setQuickReminders(prev =>
                                                    prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                                                  )
                                                }}
                                                className="px-2 py-0.5 rounded text-[9px] transition-colors"
                                                style={{
                                                  backgroundColor: quickReminders.includes(opt.value) ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
                                                  color: 'white',
                                                  border: '1px solid rgba(255,255,255,0.2)',
                                                }}
                                              >
                                                {opt.label}
                                              </button>
                                            ))}
                                          </div>
                                          <div className="flex gap-1 justify-end">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleQuickAddAssignment(course.id, quickAddScheduleId) }}
                                              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                            >
                                              添加
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setShowQuickAssign(false) }}
                                              className="px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                                            >
                                              取消
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* 快捷添加备忘表单 */}
                                  <AnimatePresence>
                                    {showQuickMemo && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-2 pt-2 border-t border-white/20 space-y-2">
                                          <div className="flex flex-wrap gap-1">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                              <button
                                                key={emoji}
                                                onClick={(e) => { e.stopPropagation(); setQuickMemoEmoji(emoji) }}
                                                className="w-6 h-6 rounded flex items-center justify-center text-xs transition-all"
                                                style={{
                                                  backgroundColor: quickMemoEmoji === emoji ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                                  border: quickMemoEmoji === emoji ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                                                }}
                                              >
                                                {emoji}
                                              </button>
                                            ))}
                                          </div>
                                          <input
                                            value={quickMemoContent}
                                            onChange={(e) => setQuickMemoContent(e.target.value)}
                                            placeholder="备忘内容"
                                            className="w-full rounded-lg px-2 py-1 text-[10px] outline-none"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div className="flex gap-1 justify-end">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleQuickAddMemo(course.id, quickAddScheduleId) }}
                                              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                            >
                                              添加
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setShowQuickMemo(false) }}
                                              className="px-2 py-1 rounded text-[10px] font-medium cursor-pointer"
                                              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
                                            >
                                              取消
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
