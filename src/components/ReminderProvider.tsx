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
    const perm = await requestNotificationPermission()
    setNotificationPermission(perm)
    return perm
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
      }}
    >
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
