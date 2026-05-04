'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSemesterConfig, getWeekNumber } from '@/lib/semester'
import { Target } from 'lucide-react'

function getDaysRemaining(): number {
  const config = getSemesterConfig()
  const start = new Date(config.semesterStart)
  const endDate = new Date(start)
  endDate.setDate(start.getDate() + (config.teachingWeeks + config.examWeeks) * 7)
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getCountdownStyle(days: number) {
  if (days > 60) return { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)', label: '一步一步来' }
  if (days > 30) return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: '坚持就是胜利' }
  if (days > 10) return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', label: '胜利在望！' }
  return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: '冲刺！' }
}

export function SemesterCountdown() {
  const [expanded, setExpanded] = useState(false)
  const [days, setDays] = useState(0)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + 8,
        left: rect.right - 224
      })
    }
  }, [])

  useEffect(() => {
    setDays(getDaysRemaining())
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    if (expanded) {
      updatePosition()
      window.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [expanded, updatePosition])

  const style = getCountdownStyle(days)
  const config = getSemesterConfig()
  const weekNum = getWeekNumber()
  const totalWeeks = config.teachingWeeks + config.examWeeks
  const progressPct = Math.min(100, Math.max(0, ((weekNum - 1) / totalWeeks) * 100))

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        <Target size={12} strokeWidth={2} />
        <span suppressHydrationWarning>{mounted ? `还有${days}天` : '学期中'}</span>
      </button>

      <AnimatePresence>
        {expanded && typeof document !== 'undefined' && createPortal(
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] w-56 rounded-2xl p-4 shadow-lg glass-strong"
            style={{
              top: popupPosition.top,
              left: popupPosition.left
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: style.color }}>
              {style.label}
            </p>
            <p className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              {days} <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>天</span>
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span>学期进度</span>
                <span>第{weekNum}/{totalWeeks}周</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-light)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, backgroundColor: style.color }}
                />
              </div>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}
