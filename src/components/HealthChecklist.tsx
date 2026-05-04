'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useReminder } from './ReminderProvider'
import { Check } from 'lucide-react'
import { KegelGuideCard } from './KegelGuideCard'

interface WaterStatus {
  shouldDrink: boolean
  remainingSec: number
  progress: number
}

interface KegelStatus {
  nextTime: string
  remainingSec: number
  checkedToday: boolean
  allTimesPassed: boolean
}

const WATER_GOAL = 8

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '该行动了'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}小时${rm}分钟`
  }
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

function computeWaterStatus(waterInterval: number, lastWaterCheck: number, now: number): WaterStatus {
  if (lastWaterCheck === 0) {
    return { remainingSec: waterInterval * 60, progress: 0, shouldDrink: false }
  }
  const intervalMs = waterInterval * 60000
  const elapsed = now - lastWaterCheck
  const remainingMs = Math.max(0, intervalMs - elapsed)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const progress = Math.min(1, elapsed / intervalMs)
  return { remainingSec, progress, shouldDrink: remainingSec <= 0 }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function computeKegelStatus(kegelTimes: string, lastKegelCheck: number, now: number): KegelStatus {
  const d = new Date(now)
  const todayKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  const d2 = lastKegelCheck > 0 ? new Date(lastKegelCheck) : null
  const lastKey = d2 ? d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0') : ''
  const checkedToday = lastKey === todayKey

  const nowDate = new Date(now)
  const nowSec = nowDate.getHours() * 3600 + nowDate.getMinutes() * 60 + nowDate.getSeconds()
  const times = kegelTimes.split(',').map(t => t.trim()).filter(Boolean).map(t => timeToMinutes(t) * 60).sort((a, b) => a - b)

  const allTimesPassed = times.length > 0 && nowSec >= times[times.length - 1]

  if (checkedToday) return { nextTime: '', remainingSec: 0, checkedToday: true, allTimesPassed }

  for (const t of times) {
    if (nowSec < t) {
      const remainingSec = t - nowSec
      return { nextTime: formatKegelTime(Math.floor(t / 60)), remainingSec, checkedToday: false, allTimesPassed: false }
    }
  }
  return { nextTime: '', remainingSec: 0, checkedToday: false, allTimesPassed: true }
}

function formatKegelTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function HealthChecklist() {
  const {
    waterEnabled,
    waterInterval,
    kegelEnabled,
    kegelTimes,
    lastWaterCheck,
    lastKegelCheck,
    waterCountToday,
    checkWater,
    checkKegel,
    uncheckKegel,
  } = useReminder()

  const [waterStatus, setWaterStatus] = useState<WaterStatus>({ remainingSec: 0, progress: 0, shouldDrink: false })
  const [kegelStatus, setKegelStatus] = useState<KegelStatus>({ nextTime: '', remainingSec: 0, checkedToday: false, allTimesPassed: false })
  const [waterJustDone, setWaterJustDone] = useState(false)
  const [kegelJustDone, setKegelJustDone] = useState(false)
  const [showKegelGuide, setShowKegelGuide] = useState(false)

  const handleKegelClick = useCallback(() => {
    if (kegelStatus.checkedToday) {
      uncheckKegel()
    } else {
      checkKegel()
    }
    setShowKegelGuide(true)
  }, [checkKegel, uncheckKegel, kegelStatus.checkedToday])

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      setWaterStatus(computeWaterStatus(waterInterval, lastWaterCheck, now))
      setKegelStatus(computeKegelStatus(kegelTimes, lastKegelCheck, now))
      setWaterJustDone(lastWaterCheck > 0 && now - lastWaterCheck < 2000)
      setKegelJustDone(lastKegelCheck > 0 && now - lastKegelCheck < 2000)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [waterInterval, lastWaterCheck, kegelTimes, lastKegelCheck])

  if (!waterEnabled && !kegelEnabled) return null

  const waterProgress = Math.min(1, waterCountToday / WATER_GOAL)
  const kegelIsDone = kegelStatus.checkedToday

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 glass"
    >
      <div className="flex items-center gap-4">
        {waterEnabled && (
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border-light)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={waterStatus.shouldDrink ? 'var(--accent-danger)' : waterProgress >= 1 ? 'var(--accent-success)' : 'var(--accent-info)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${waterProgress * 87.96} 87.96`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: waterStatus.shouldDrink ? 'var(--accent-danger)' : waterProgress >= 1 ? 'var(--accent-success)' : 'var(--accent-info)' }}>
                💧
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {waterProgress >= 1 ? '今日目标达成 🎉' : waterStatus.shouldDrink ? '该喝水了！' : '距下次喝水'}
              </p>
              <p className="text-[10px]" style={{ color: waterProgress >= 1 ? 'var(--accent-success)' : waterStatus.shouldDrink ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                {waterProgress >= 1 ? `已喝 ${waterCountToday} 杯，真棒` : `${waterCountToday}/${WATER_GOAL} 杯 · ${waterStatus.shouldDrink ? '已经到时间了' : formatCountdown(waterStatus.remainingSec)}`}
              </p>
            </div>
            <button
              onClick={checkWater}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${waterJustDone ? 'scale-110' : ''}`}
              style={{
                backgroundColor: waterJustDone ? 'var(--accent-success)' : 'transparent',
                border: `2px solid ${waterJustDone ? 'var(--accent-success)' : 'var(--border-light)'}`,
              }}
            >
              {waterJustDone && <Check size={14} strokeWidth={3} style={{ color: 'white' }} />}
            </button>
          </div>
        )}

        {waterEnabled && kegelEnabled && (
          <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--border-light)' }} />
        )}

        {kegelEnabled && (
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: kegelIsDone ? 'rgba(16,185,129,0.12)' : 'rgba(168,85,247,0.12)' }}
            >
              💪
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {kegelIsDone ? '今天已完成 ✅' : kegelStatus.allTimesPassed ? '今日提醒已过' : `下一个提醒 ${kegelStatus.nextTime}`}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {kegelIsDone ? '点击可撤销' : kegelStatus.allTimesPassed ? '随时可以做一组' : `还有 ${formatCountdown(kegelStatus.remainingSec)}`}
              </p>
            </div>
            <button
              onClick={handleKegelClick}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${kegelJustDone ? 'scale-110' : ''}`}
              style={{
                backgroundColor: kegelIsDone || kegelJustDone ? 'var(--accent-success)' : 'transparent',
                border: `2px solid ${kegelIsDone || kegelJustDone ? 'var(--accent-success)' : 'var(--border-light)'}`,
              }}
            >
              {(kegelIsDone || kegelJustDone) && <Check size={14} strokeWidth={3} style={{ color: 'white' }} />}
            </button>
          </div>
        )}
      </div>
      <KegelGuideCard open={showKegelGuide} onClose={() => setShowKegelGuide(false)} />
    </motion.div>
  )
}
