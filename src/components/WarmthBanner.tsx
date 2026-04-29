"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, getSchedules } from '@/lib/data'
import { getTodayCourses } from '@/lib/schedule'

const MORNING_GREETINGS = ['早上好', '上午好']
const AFTERNOON_GREETINGS = ['下午好', '午后好']
const EVENING_GREETINGS = ['晚上好', '晚间好']

const BUSY_WORDS = ['今天满课，加油呀～', '撑住，课多也有课多的风景', '满课的战士，今天也辛苦了']
const NORMAL_WORDS = ['今天节奏刚好，稳着来 🌿', '按部就班就是胜利', '一步一步，不急不躁']
const LIGHT_WORDS = ['今天课不多，偷得半日闲 ☕', '轻松的一天，享受一下', '放慢脚步也很好']

export function WarmthBanner() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const hiddenDate = localStorage.getItem('warmth_banner_hidden')
    if (hiddenDate === today) {
      setVisible(false)
      return
    }

    Promise.all([getCourses(), getSchedules()]).then(([, schedules]) => {
      const todayCourses = getTodayCourses(schedules)
      const count = todayCourses.length

      const hour = new Date().getHours()
      const timeGreetings = hour < 12 ? MORNING_GREETINGS : hour < 18 ? AFTERNOON_GREETINGS : EVENING_GREETINGS
      const timeGreet = timeGreetings[Math.floor(Math.random() * timeGreetings.length)]

      let pool = BUSY_WORDS
      if (count >= 4) pool = BUSY_WORDS
      else if (count >= 2) pool = NORMAL_WORDS
      else pool = LIGHT_WORDS

      const word = pool[Math.floor(Math.random() * pool.length)]
      setMessage(`${timeGreet}，${count}节课。${word}`)
    })
  }, [])

  const handleClose = () => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('warmth_banner_hidden', today)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mb-4 rounded-2xl overflow-hidden relative"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: 'var(--accent-warm)' }} />
          <div className="py-3 px-5 flex items-center justify-between">
            <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
              {message}
            </p>
            <button
              onClick={handleClose}
              className="w-6 h-6 flex items-center justify-center rounded-full opacity-40 hover:opacity-70 transition-opacity text-sm flex-shrink-0 ml-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
