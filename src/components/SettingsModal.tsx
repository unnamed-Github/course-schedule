"use client"

import { useEffect, useRef, useState } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useTheme } from '@/components/ThemeProvider'
import { getSemesterConfig, setSemesterCache, clearSemesterCache } from '@/lib/semester'
import { getSemesterConfigFromDB, updateSemesterConfigToDB } from '@/lib/semester-db'
import type { Holiday, MakeupDay } from '@/lib/semester'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'
import { useToast } from '@/components/ToastProvider'
import { useWarmthBanner } from '@/components/WarmthBannerContext'
import { Modal } from './Modal'

type SettingsTab = 'display' | 'data'

export function SettingsModal({ open: isOpen, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggle } = useTheme()
  const { isEnabled: warmthBannerEnabled, toggleEnabled: toggleWarmthBanner } = useWarmthBanner()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('display')
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [highlightEnabled, setHighlightEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    return getLocalSetting('highlight_enabled', 'true') !== 'false'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [teachingWeeks, setTeachingWeeks] = useState(15)
  const [examWeeks, setExamWeeks] = useState(2)
  const totalWeeks = teachingWeeks + examWeeks
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [makeupDays, setMakeupDays] = useState<MakeupDay[]>([])
  const [editingHolidayIdx, setEditingHolidayIdx] = useState<number | null>(null)
  const [holidayForm, setHolidayForm] = useState<Holiday>({ name: '', start: '', end: '' })
  const [editingMakeupIdx, setEditingMakeupIdx] = useState<number | null>(null)
  const [makeupForm, setMakeupForm] = useState<MakeupDay>({ date: '', replacesDayOfWeek: 1, weekType: 'all' })

  useEffect(() => {
    if (isOpen) {
      getSemesterConfigFromDB().then((config) => {
        setSemesterCache(config)
        setTeachingWeeks(config.teachingWeeks)
        setExamWeeks(config.examWeeks)
        setHolidays([...config.holidays])
        setMakeupDays([...config.makeupDays])
      })
    }
  }, [isOpen])

  const processFile = async (file: File) => {
    try {
      const rows = await parseImportFile(file)
      setImportPreview(rows)
      setShowImport(true)
    } catch {
      showToast('导入失败，请检查文件格式', 'error')
    }
  }

  const handleExportCSV = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToCSV(courses, schedules)
    showToast('已导出 CSV ✅', 'success')
  }

  const handleExportExcel = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToExcel(courses, schedules)
    showToast('已导出 Excel ✅', 'success')
  }

  const handleExportJSON = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    const data = { courses, schedules, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '课表.json'; a.click(); URL.revokeObjectURL(url)
    showToast('已导出 JSON ✅', 'success')
  }

  const saveSemesterConfig = async (updates: Partial<{ semesterStart: string; teachingWeeks: number; examWeeks: number; holidays: Holiday[]; makeupDays: MakeupDay[] }>) => {
    const config = getSemesterConfig()
    const newConfig = { ...config, ...updates }
    setSemesterCache(newConfig)
    const ok = await updateSemesterConfigToDB(updates as any)
    if (ok) {
      showToast('学期信息已保存', 'success')
    } else {
      showToast('保存失败，请检查网络', 'error')
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="设置">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('display')}
          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: activeTab === 'display' ? 'var(--accent-info)' : 'transparent',
            color: activeTab === 'display' ? 'white' : 'var(--text-secondary)',
          }}
        >
          显示
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: activeTab === 'data' ? 'var(--accent-info)' : 'transparent',
            color: activeTab === 'data' ? 'white' : 'var(--text-secondary)',
          }}
        >
          数据
        </button>
      </div>

      {activeTab === 'display' && (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{theme === 'light' ? '☀️ 亮色模式' : '🌙 暗色模式'}</span>
              <button onClick={toggle} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: theme === 'dark' ? 'var(--accent-info)' : 'var(--border-light)' }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: theme === 'dark' ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>当前课程高亮</span>
              <button onClick={() => { const v = !highlightEnabled; setHighlightEnabled(v); setSettingBoth('highlight_enabled', String(v)) }} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: highlightEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: highlightEnabled ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>每日问候横幅</span>
              <button onClick={toggleWarmthBanner} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: warmthBannerEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: warmthBannerEnabled ? 'calc(100% - 22px)' : '2px' }} />
              </button>
            </div>
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>学期信息</h3>
            <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex justify-between text-sm"><span>开学日期</span>
                <input type="date" className="rounded-lg px-2 py-1 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} defaultValue={getSemesterConfig().semesterStart} onChange={(e) => { if (e.target.value) saveSemesterConfig({ semesterStart: e.target.value } as any) }} />
              </div>
              <div className="flex justify-between text-sm"><span>总周数（含考试）</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{totalWeeks} 周</span>
              </div>
              <div className="flex justify-between text-sm"><span>教学周</span>
                <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} value={teachingWeeks} onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); setTeachingWeeks(v); saveSemesterConfig({ teachingWeeks: v }) }} min={1} max={30} />
              </div>
              <div className="flex justify-between text-sm"><span>考试周</span>
                <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} value={examWeeks} onChange={(e) => { const v = Math.max(0, parseInt(e.target.value) || 0); setExamWeeks(v); saveSemesterConfig({ examWeeks: v }) }} min={0} max={10} />
              </div>
            </div>
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>📅 节假日</h3>
              <button onClick={() => { setHolidayForm({ name: '', start: '', end: '' }); setEditingHolidayIdx(-1) }} className="btn-ghost text-xs">+ 添加</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {holidays.map((h, i) => (
                editingHolidayIdx === i ? (
                  <div key={i} className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <input value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="假日名称" className="w-full rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    <div className="flex gap-2">
                      <input type="date" value={holidayForm.start} onChange={(e) => setHolidayForm({ ...holidayForm, start: e.target.value })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                      <input type="date" value={holidayForm.end} onChange={(e) => setHolidayForm({ ...holidayForm, end: e.target.value })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => {
                        if (!holidayForm.name || !holidayForm.start) return
                        const newHolidays = [...holidays]
                        if (editingHolidayIdx === -1) newHolidays.push({ ...holidayForm, end: holidayForm.end || holidayForm.start })
                        else newHolidays[editingHolidayIdx] = { ...holidayForm, end: holidayForm.end || holidayForm.start }
                        setHolidays(newHolidays); setEditingHolidayIdx(null); saveSemesterConfig({ holidays: newHolidays })
                      }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                      <button onClick={() => setEditingHolidayIdx(null)} className="btn-ghost text-xs">取消</button>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-center justify-between text-xs py-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>{h.name} {h.start}{h.end !== h.start ? ` — ${h.end}` : ''}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setHolidayForm({ ...h }); setEditingHolidayIdx(i) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                      <button onClick={() => { const newH = holidays.filter((_, j) => j !== i); setHolidays(newH); saveSemesterConfig({ holidays: newH }) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
                    </div>
                  </div>
                )
              ))}
              {editingHolidayIdx === -1 && (
                <div className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <input value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="假日名称" className="w-full rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                  <div className="flex gap-2">
                    <input type="date" value={holidayForm.start} onChange={(e) => setHolidayForm({ ...holidayForm, start: e.target.value })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    <input type="date" value={holidayForm.end} onChange={(e) => setHolidayForm({ ...holidayForm, end: e.target.value })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                  </div>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => {
                      if (!holidayForm.name || !holidayForm.start) return
                      const newHolidays = [...holidays, { ...holidayForm, end: holidayForm.end || holidayForm.start }]
                      setHolidays(newHolidays); setEditingHolidayIdx(null); saveSemesterConfig({ holidays: newHolidays })
                    }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                    <button onClick={() => setEditingHolidayIdx(null)} className="btn-ghost text-xs">取消</button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>调休日</h4>
                <button onClick={() => { setMakeupForm({ date: '', replacesDayOfWeek: 1, weekType: 'all' }); setEditingMakeupIdx(-1) }} className="btn-ghost text-xs">+ 添加</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {makeupDays.map((m, i) => (
                  editingMakeupIdx === i ? (
                    <div key={i} className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <input type="date" value={makeupForm.date} onChange={(e) => setMakeupForm({ ...makeupForm, date: e.target.value })} className="w-full rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                      <div className="flex gap-2">
                        <select value={makeupForm.replacesDayOfWeek} onChange={(e) => setMakeupForm({ ...makeupForm, replacesDayOfWeek: parseInt(e.target.value) })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                          {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>补周{d}</option>)}
                        </select>
                        <select value={makeupForm.weekType} onChange={(e) => setMakeupForm({ ...makeupForm, weekType: e.target.value as 'all' | 'odd' | 'even' })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                          <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                        </select>
                      </div>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => {
                          if (!makeupForm.date) return
                          const newMakeups = [...makeupDays]
                          if (editingMakeupIdx === -1) newMakeups.push(makeupForm)
                          else newMakeups[editingMakeupIdx] = makeupForm
                          setMakeupDays(newMakeups); setEditingMakeupIdx(null); saveSemesterConfig({ makeupDays: newMakeups })
                        }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                        <button onClick={() => setEditingMakeupIdx(null)} className="btn-ghost text-xs">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <span>{m.date} 补周{m.replacesDayOfWeek} · {m.weekType === 'odd' ? '单周' : m.weekType === 'even' ? '双周' : '每周'}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setMakeupForm({ ...m }); setEditingMakeupIdx(i) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                        <button onClick={() => { const newM = makeupDays.filter((_, j) => j !== i); setMakeupDays(newM); saveSemesterConfig({ makeupDays: newM }) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
                      </div>
                    </div>
                  )
                ))}
                {editingMakeupIdx === -1 && (
                  <div className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <input type="date" value={makeupForm.date} onChange={(e) => setMakeupForm({ ...makeupForm, date: e.target.value })} className="w-full rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }} />
                    <div className="flex gap-2">
                      <select value={makeupForm.replacesDayOfWeek} onChange={(e) => setMakeupForm({ ...makeupForm, replacesDayOfWeek: parseInt(e.target.value) })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                        {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>补周{d}</option>)}
                      </select>
                      <select value={makeupForm.weekType} onChange={(e) => setMakeupForm({ ...makeupForm, weekType: e.target.value as 'all' | 'odd' | 'even' })} className="flex-1 rounded-lg px-2 py-1 text-xs" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}>
                        <option value="all">每周</option><option value="odd">单周</option><option value="even">双周</option>
                      </select>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => {
                        if (!makeupForm.date) return
                        const newMakeups = [...makeupDays, makeupForm]
                        setMakeupDays(newMakeups); setEditingMakeupIdx(null); saveSemesterConfig({ makeupDays: newMakeups })
                      }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>保存</button>
                      <button onClick={() => setEditingMakeupIdx(null)} className="btn-ghost text-xs">取消</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <p>课表 · 竹 v1.0</p>
              <p>2026 春季学期 · 南科大</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>导入导出</h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) await processFile(f) }}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-3"
              style={{ borderColor: dragOver ? 'var(--accent-info)' : 'var(--border-light)', backgroundColor: dragOver ? 'var(--drop-highlight)' : 'transparent' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>📁 拖拽 CSV/Excel 到此处</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>或点击选择文件</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await processFile(f) }} className="hidden" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportCSV} className="btn-primary text-sm flex-1" style={{ justifyContent: 'center' }}>📤 CSV</button>
              <button onClick={handleExportExcel} className="btn-primary text-sm flex-1" style={{ justifyContent: 'center' }}>📤 Excel</button>
              <button onClick={handleExportJSON} className="btn-primary text-sm flex-1" style={{ justifyContent: 'center' }}>📤 JSON</button>
            </div>
            {showImport && importPreview.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>预览 {importPreview.length} 条</p>
                <button onClick={() => { setShowImport(false); setImportPreview([]); showToast(`成功导入 ${importPreview.length} 门课程`, 'success') }} className="btn-ghost text-xs">确认导入</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
