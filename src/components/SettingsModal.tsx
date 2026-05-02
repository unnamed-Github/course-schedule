"use client"

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { getSemesterConfig } from '@/lib/semester'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'
import { useToast } from '@/components/ToastProvider'
import { useWarmthBanner } from '@/components/WarmthBannerContext'
import { Modal } from './Modal'
import { ImportExportPanel } from './ImportExportPanel'
import { HolidayEditor } from './HolidayEditor'
import { MakeupDayEditor } from './MakeupDayEditor'
import { useSemesterConfig } from '@/hooks/useSemesterConfig'
import { Sun, Moon, CalendarDays, Sparkles } from 'lucide-react'
import { APP_VERSION } from '@/lib/version'
import { useGlassSettings, GLASS_DEFAULTS } from '@/hooks/useGlassSettings'

type SettingsTab = 'display' | 'data' | 'glass'

export function SettingsModal({ open: isOpen, onClose }: { open: boolean; onClose: () => void }) {
  const { settings: glass, updateSetting: updateGlass } = useGlassSettings()

  const { theme, toggle } = useTheme()
  const { isEnabled: warmthBannerEnabled, toggleEnabled: toggleWarmthBanner } = useWarmthBanner()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('display')
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

  useEffect(() => {
    if (isOpen) loadConfig()
  }, [isOpen])

  return (
    <Modal open={isOpen} onClose={onClose} title="设置">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('display')}
          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer focus-visible:shadow-[var(--focus-ring)]"
          style={{
            backgroundColor: activeTab === 'display' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'display' ? 'white' : 'var(--text-secondary)',
          }}
        >
          显示
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer focus-visible:shadow-[var(--focus-ring)]"
          style={{
            backgroundColor: activeTab === 'data' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'data' ? 'white' : 'var(--text-secondary)',
          }}
        >
          数据
        </button>
        <button
          onClick={() => setActiveTab('glass')}
          className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer focus-visible:shadow-[var(--focus-ring)]"
          style={{
            backgroundColor: activeTab === 'glass' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'glass' ? 'white' : 'var(--text-secondary)',
          }}
        >
          玻璃
        </button>
      </div>

      {activeTab === 'display' && (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                {theme === 'light' ? <><Sun size={16} strokeWidth={1.8} />亮色模式</> : <><Moon size={16} strokeWidth={1.8} />暗色模式</>}
              </span>
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

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <p>课表 · 竹 v{APP_VERSION}</p>
              <p>2026 春季学期 · 南科大</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          <ImportExportPanel compact />
        </div>
      )}

      {activeTab === 'glass' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles size={16} strokeWidth={1.8} />
              开启玻璃效果
            </span>
            <button
              onClick={() => updateGlass('glass_enabled', String(!glass.enabled))}
              className="w-11 h-6 rounded-full relative transition-colors"
              style={{ backgroundColor: glass.enabled ? 'var(--accent-info)' : 'var(--border-light)' }}
            >
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: glass.enabled ? 'calc(100% - 22px)' : '2px' }} />
            </button>
          </div>

          {glass.enabled && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>模糊强度</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{glass.blur}px</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={glass.blur}
                  onChange={(e) => updateGlass('glass_blur', e.target.value)}
                  className="w-full accent-current"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>背景透明度</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{glass.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={40}
                  value={glass.opacity}
                  onChange={(e) => updateGlass('glass_opacity', e.target.value)}
                  className="w-full accent-current"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>色彩饱和度</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{glass.saturation.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={1}
                  value={Math.round(glass.saturation * 10)}
                  onChange={(e) => updateGlass('glass_saturation', (Number(e.target.value) / 10).toFixed(1))}
                  className="w-full accent-current"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateGlass('glass_blur', GLASS_DEFAULTS.glass_blur)
                    updateGlass('glass_opacity', GLASS_DEFAULTS.glass_opacity)
                    updateGlass('glass_saturation', GLASS_DEFAULTS.glass_saturation)
                  }}
                  className="btn-ghost text-xs"
                >
                  恢复默认
                </button>
              </div>
            </>
          )}

          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              玻璃效果采用 iOS 26 Liquid Glass 风格。调整参数后，所有启用玻璃效果的组件将实时更新。在低性能设备上可关闭此效果以提升流畅度。
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
