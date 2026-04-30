'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon } from 'lucide-react'

function isLateNight(): boolean {
  const h = new Date().getHours()
  return h >= 23 || h < 6
}

function isVeryLate(): boolean {
  const h = new Date().getHours()
  return h >= 1 && h < 6
}

function getTodayKey(): string {
  const d = new Date()
  return `late_night_dismissed_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function LateNightCare() {
  const [visible, setVisible] = useState(false)
  const [veryLate, setVeryLate] = useState(false)

  useEffect(() => {
    const check = () => {
      if (!isLateNight()) {
        setVisible(false)
        return
      }
      try {
        if (localStorage.getItem(getTodayKey())) return
      } catch {}
      setVeryLate(isVeryLate())
      setVisible(true)
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    try { localStorage.setItem(getTodayKey(), '1') } catch {}
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="relative overflow-hidden rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="absolute text-xs"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${15 + (i % 3) * 25}%`,
                  animation: `twinkle ${1.5 + (i % 3) * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.6,
                }}
              >
                ✦
              </span>
            ))}
          </div>

          <div className="relative flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Moon size={20} strokeWidth={1.5} className="text-indigo-300" />
              <div>
                <p className="text-sm font-medium text-indigo-100">
                  {veryLate ? '都凌晨了！明天还要上课呢 😴' : '夜深了，早点休息吧 🌙'}
                </p>
                <p className="text-xs text-indigo-300 mt-0.5">
                  {veryLate ? '身体比课表更重要' : '好梦从早睡开始'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(129, 140, 248, 0.2)', color: '#c7d2fe' }}
            >
              我知道了
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
