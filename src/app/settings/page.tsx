"use client"

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { getSemesterConfig } from '@/lib/semester'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'
import { useToast } from '@/components/ToastProvider'
import { useWarmthBanner } from '@/components/WarmthBannerContext'
import { ImportExportPanel } from '@/components/ImportExportPanel'
import { HolidayEditor } from '@/components/HolidayEditor'
import { MakeupDayEditor } from '@/components/MakeupDayEditor'
import { useSemesterConfig } from '@/hooks/useSemesterConfig'

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const { isEnabled: warmthBannerEnabled, toggleEnabled: toggleWarmthBanner } = useWarmthBanner()
  const { showToast } = useToast()
  const [highlightEnabled, setHighlightEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    return getLocalSetting('highlight_enabled', 'true') !== 'false'
  })

  const {
    teachingWeeks, setTeachingWeeks,
    examWeeks, setExamWeeks,
    totalWeeks,
    holidays,
    makeupDays,
    editingHolidayIdx, setEditingHolidayIdx,
    holidayForm, setHolidayForm,
    editingMakeupIdx, setEditingMakeupIdx,
    makeupForm, setMakeupForm,
    loadConfig,
    saveConfig,
    saveHolidays,
    saveMakeups,
  } = useSemesterConfig()

  useEffect(() => { loadConfig() }, [])

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>⚙️ 设置</h2>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <ImportExportPanel />
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>外观</h3>
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
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>学期信息</h3>
        <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between text-sm"><span>开学日期</span>
            <input type="date" className="rounded-lg px-2 py-1 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} defaultValue={getSemesterConfig().semesterStart} onChange={(e) => { if (e.target.value) saveConfig({ semesterStart: e.target.value }) }} />
          </div>
          <div className="flex justify-between text-sm"><span>总周数（含考试）</span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{totalWeeks} 周</span>
          </div>
          <div className="flex justify-between text-sm"><span>教学周</span>
            <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} value={teachingWeeks} onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); setTeachingWeeks(v); saveConfig({ teachingWeeks: v }) }} min={1} max={30} />
          </div>
          <div className="flex justify-between text-sm"><span>考试周</span>
            <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} value={examWeeks} onChange={(e) => { const v = Math.max(0, parseInt(e.target.value) || 0); setExamWeeks(v); saveConfig({ examWeeks: v }) }} min={0} max={10} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <HolidayEditor
          holidays={holidays}
          editingIdx={editingHolidayIdx}
          setEditingIdx={setEditingHolidayIdx}
          form={holidayForm}
          setForm={setHolidayForm}
          onSave={saveHolidays}
        />
        <MakeupDayEditor
          makeupDays={makeupDays}
          editingIdx={editingMakeupIdx}
          setEditingIdx={setEditingMakeupIdx}
          form={makeupForm}
          setForm={setMakeupForm}
          onSave={saveMakeups}
        />
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>关于</h3>
        <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <p>课表 · 竹 v1.0</p>
          <p>2026 春季学期 · 南科大</p>
          <p>温暖手账 · 云端同步 · 开源</p>
        </div>
      </div>
    </div>
  )
}
