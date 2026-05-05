'use client'

import { useState } from 'react'
import { useReminder } from '@/components/ReminderProvider'
import { Bell, BellOff } from 'lucide-react'
import { DDL_REMINDER_OPTIONS, formatReminderLabel } from '@/lib/types'

const WATER_INTERVALS = [
  { value: 30, label: '30 分钟' },
  { value: 40, label: '40 分钟' },
  { value: 50, label: '50 分钟' },
  { value: 60, label: '60 分钟' },
]

export function HealthReminderSettings() {
  const {
    waterEnabled,
    waterInterval,
    kegelEnabled,
    kegelTimes,
    nightEnabled,
    ddlEnabled,
    ddlReminderDefaults,
    notificationPermission,
    toggleWater,
    setWaterInterval,
    toggleKegel,
    setKegelTimes,
    toggleNight,
    toggleDdl,
    setDdlReminderDefaults,
    requestPermission,
  } = useReminder()

  const [customDefaultInput, setCustomDefaultInput] = useState('')

  return (
    <div className="rounded-2xl p-5 glass-strong">
      <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>💚 健康提醒</h3>

      <div className="space-y-4">
        {notificationPermission !== 'granted' && (
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5 mb-2"
            style={{
              backgroundColor: notificationPermission === 'denied' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
              border: `1px solid ${notificationPermission === 'denied' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {notificationPermission === 'denied' ? (
                <BellOff size={16} style={{ color: '#EF4444' }} />
              ) : (
                <Bell size={16} style={{ color: '#3B82F6' }} />
              )}
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {notificationPermission === 'denied'
                  ? '通知已被拒绝，请在浏览器设置中开启'
                  : '需要通知权限才能发送提醒'}
              </span>
            </div>
            {notificationPermission === 'default' && (
              <button
                onClick={requestPermission}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#3B82F6', color: '#fff' }}
              >
                开启通知
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>💧 喝水提醒</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>每 {waterInterval} 分钟</span>
          </div>
          <button
            onClick={toggleWater}
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: waterEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm"
              style={{ left: waterEnabled ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>

        {waterEnabled && (
          <div className="pl-4 flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>间隔</span>
            <div className="flex gap-1">
              {WATER_INTERVALS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setWaterInterval(value)}
                  className="px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: waterInterval === value ? 'var(--accent-info)' : 'var(--bg-primary)',
                    color: waterInterval === value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${waterInterval === value ? 'var(--accent-info)' : 'var(--border-light)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>💪 提肛提醒</span>
          <button
            onClick={toggleKegel}
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: kegelEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm"
              style={{ left: kegelEnabled ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>

        {kegelEnabled && (
          <div className="pl-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>每日时间点</span>
              <input
                type="text"
                value={kegelTimes}
                onChange={(e) => setKegelTimes(e.target.value)}
                placeholder="10:00,15:00,20:00"
                className="rounded-lg px-2 py-1 text-xs flex-1"
                style={{
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              用逗号分隔，如：10:00,15:00,20:00
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>🌙 熬夜提醒</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>23:30 后</span>
          </div>
          <button
            onClick={toggleNight}
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: nightEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm"
              style={{ left: nightEnabled ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>⏰ 作业 DDL 提醒</span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>截止前通知</span>
          </div>
          <button
            onClick={toggleDdl}
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: ddlEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm"
              style={{ left: ddlEnabled ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>

        {ddlEnabled && (
          <div className="pl-4 space-y-2">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>默认提醒时间</span>
            <div className="flex flex-wrap gap-1.5">
              {DDL_REMINDER_OPTIONS.map(opt => {
                const isActive = ddlReminderDefaults.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (isActive) {
                        setDdlReminderDefaults(ddlReminderDefaults.filter(v => v !== opt.value))
                      } else {
                        setDdlReminderDefaults([...ddlReminderDefaults, opt.value])
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--accent-info)' : 'var(--bg-primary)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'var(--accent-info)' : 'var(--border-light)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
              {ddlReminderDefaults.filter(r => !DDL_REMINDER_OPTIONS.some(o => o.value === r)).map(r => (
                <span key={r} className="px-2 py-1 rounded-lg text-xs flex items-center gap-0.5"
                  style={{ backgroundColor: 'var(--accent-info)', color: '#fff', border: '1px solid var(--accent-info)' }}>
                  {formatReminderLabel(r)}
                  <button onClick={() => setDdlReminderDefaults(ddlReminderDefaults.filter(v => v !== r))} className="ml-0.5 hover:opacity-70">×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={customDefaultInput}
                onChange={(e) => setCustomDefaultInput(e.target.value)}
                placeholder="自定义分钟数"
                className="w-28 px-2 py-1 rounded-lg text-xs"
                style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = parseInt(customDefaultInput)
                    if (v > 0 && !ddlReminderDefaults.includes(v)) {
                      setDdlReminderDefaults([...ddlReminderDefaults, v])
                      setCustomDefaultInput('')
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const v = parseInt(customDefaultInput)
                  if (v > 0 && !ddlReminderDefaults.includes(v)) {
                    setDdlReminderDefaults([...ddlReminderDefaults, v])
                    setCustomDefaultInput('')
                  }
                }}
                className="px-2 py-1 rounded-lg text-xs"
                style={{ border: '1px solid var(--accent-info)', color: 'var(--accent-info)', backgroundColor: 'var(--bg-primary)' }}
              >+ 添加</button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>新建作业时自动应用这些提醒</p>
          </div>
        )}
      </div>
    </div>
  )
}
