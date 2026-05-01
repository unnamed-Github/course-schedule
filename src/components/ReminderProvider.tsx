'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { getHealthReminderSetting, setSettingBoth } from '@/lib/user-settings'
import { sendNotification, getNotificationPermission, requestNotificationPermission } from '@/lib/notification-utils'
import { pickWaterMessage, getKegelMessage, pickNightMessage } from '@/lib/reminder-messages'

interface ReminderContextType {
  waterEnabled: boolean
  waterInterval: number
  kegelEnabled: boolean
  kegelTimes: string
  nightEnabled: boolean
  notificationPermission: NotificationPermission
  toggleWater: () => void
  setWaterInterval: (v: number) => void
  toggleKegel: () => void
  setKegelTimes: (times: string) => void
  toggleNight: () => void
  requestPermission: () => Promise<NotificationPermission>
  dismissPermissionPrompt: () => void
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function currentMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function isInSilentHours(silentStart: string, silentEnd: string): boolean {
  const now = currentMinutes()
  const start = timeToMinutes(silentStart)
  const end = timeToMinutes(silentEnd)
  if (start < end) {
    return now >= start && now < end
  }
  return now >= start || now < end
}

function isInTimeRange(startTime: string, endTime: string): boolean {
  const now = currentMinutes()
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (start < end) {
    return now >= start && now < end
  }
  return now >= start || now < end
}

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [waterEnabled, setWaterEnabled] = useState(() => getHealthReminderSetting('water_reminder_enabled') !== 'false')
  const [waterInterval, setWaterIntervalState] = useState(() => parseInt(getHealthReminderSetting('water_interval')) || 40)
  const [kegelEnabled, setKegelEnabled] = useState(() => getHealthReminderSetting('kegel_reminder_enabled') !== 'false')
  const [kegelTimes, setKegelTimesState] = useState(() => getHealthReminderSetting('kegel_times') || '10:00,15:00,20:00')
  const [nightEnabled, setNightEnabled] = useState(() => getHealthReminderSetting('night_reminder_enabled') !== 'false')
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission)

  const [permissionPromptDismissed, setPermissionPromptDismissed] = useState(() => {
    try { return localStorage.getItem('notification_prompt_dismissed') === '1' } catch { return false }
  })
  const [permissionError, setPermissionError] = useState(false)

  const lastWaterRef = useRef(0)
  const lastKegelDayRef = useRef('')
  const lastNightRef = useRef(0)

  const toggleWater = useCallback(() => {
    setWaterEnabled(v => {
      const next = !v
      setSettingBoth('water_reminder_enabled', String(next))
      return next
    })
  }, [])

  const setWaterInterval = useCallback((v: number) => {
    setWaterIntervalState(v)
    setSettingBoth('water_interval', String(v))
  }, [])

  const toggleKegel = useCallback(() => {
    setKegelEnabled(v => {
      const next = !v
      setSettingBoth('kegel_reminder_enabled', String(next))
      return next
    })
  }, [])

  const setKegelTimes = useCallback((times: string) => {
    setKegelTimesState(times)
    setSettingBoth('kegel_times', times)
  }, [])

  const toggleNight = useCallback(() => {
    setNightEnabled(v => {
      const next = !v
      setSettingBoth('night_reminder_enabled', String(next))
      return next
    })
  }, [])

  const requestPermission = useCallback(async () => {
    setPermissionError(false)
    try {
      const perm = await requestNotificationPermission()
      setNotificationPermission(perm)
      if (perm !== 'granted') setPermissionError(true)
      return perm
    } catch {
      setPermissionError(true)
      return 'denied' as NotificationPermission
    }
  }, [])

  const dismissPermissionPrompt = useCallback(() => {
    setPermissionPromptDismissed(true)
    try { localStorage.setItem('notification_prompt_dismissed', '1') } catch {}
  }, [])

  useEffect(() => {
    const checkReminders = () => {
      const silentStart = getHealthReminderSetting('silent_start')
      const silentEnd = getHealthReminderSetting('silent_end')

      if (isInSilentHours(silentStart, silentEnd)) return

      const nowMin = currentMinutes()

      if (waterEnabled && (nowMin - lastWaterRef.current >= waterInterval || lastWaterRef.current === 0)) {
        lastWaterRef.current = nowMin
        sendNotification('💧 喝水提醒', pickWaterMessage())
      }

      if (kegelEnabled) {
        const today = new Date().toISOString().slice(0, 10)
        if (lastKegelDayRef.current !== today) {
          const times = kegelTimes.split(',').map(t => t.trim()).filter(Boolean)
          for (const t of times) {
            const target = timeToMinutes(t)
            if (nowMin >= target && nowMin < target + 5) {
              lastKegelDayRef.current = today
              sendNotification('💪 提肛提醒', getKegelMessage())
              break
            }
          }
        }
      }

      if (nightEnabled) {
        const nightStart = getHealthReminderSetting('night_start')
        if (isInTimeRange(nightStart, silentStart)) {
          if (nowMin - lastNightRef.current >= 15 || lastNightRef.current === 0) {
            lastNightRef.current = nowMin
            sendNotification('🌙 熬夜提醒', pickNightMessage())
          }
        }
      }
    }

    checkReminders()
    const timer = setInterval(checkReminders, 30000)
    return () => clearInterval(timer)
  }, [waterEnabled, waterInterval, kegelEnabled, kegelTimes, nightEnabled])

  const showPermissionBanner = notificationPermission === 'default' && !permissionPromptDismissed

  return (
    <ReminderContext.Provider
      value={{
        waterEnabled,
        waterInterval,
        kegelEnabled,
        kegelTimes,
        nightEnabled,
        notificationPermission,
        toggleWater,
        setWaterInterval,
        toggleKegel,
        setKegelTimes,
        toggleNight,
        requestPermission,
        dismissPermissionPrompt,
      }}
    >
      {showPermissionBanner && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div
            className="rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1e3a5f 100%)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-100">🔔 开启健康提醒</p>
              <p className="text-xs text-blue-200 mt-0.5">
                {permissionError ? '通知被拒，可在浏览器设置中手动开启' : '喝水、提肛、熬夜提醒需要通知权限'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!permissionError && (
                <button
                  onClick={requestPermission}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#3B82F6', color: '#fff' }}
                >
                  开启
                </button>
              )}
              <button
                onClick={dismissPermissionPrompt}
                className="px-2 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80"
                style={{ color: '#93c5fd' }}
              >
                暂不
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </ReminderContext.Provider>
  )
}

export function useReminder() {
  const context = useContext(ReminderContext)
  if (!context) {
    throw new Error('useReminder must be used within a ReminderProvider')
  }
  return context
}
