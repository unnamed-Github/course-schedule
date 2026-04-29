"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GENTLE_WORDS = [
  '你已经做得很好了。',
  '累了就歇会儿，不赶。',
  '竹子一节一节长，你也是。',
  '今天也辛苦了。',
  '每节课都是一块拼图。',
  '慢慢来，比较快。',
  '保持呼吸，一切都会好的。',
  '你比昨天更近了一步。',
]

const COOLDOWN_MS = 15 * 60 * 1000
const SHOW_DELAY_MS = 10000
const HIDE_DELAY_MS = 4000

export function EasterEgg() {
  const [visible, setVisible] = useState(false)
  const [word, setWord] = useState('')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const checkAndMaybeShow = () => {
      const lastShown = localStorage.getItem('easter_egg_last')
      const now = Date.now()
      if (lastShown && now - parseInt(lastShown) < COOLDOWN_MS) return

      // 20% chance to show
      if (Math.random() > 0.2) return

      const w = GENTLE_WORDS[Math.floor(Math.random() * GENTLE_WORDS.length)]
      setWord(w)
      setVisible(true)
      localStorage.setItem('easter_egg_last', now.toString())

      hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS)
    }

    const timer = setTimeout(checkAndMaybeShow, SHOW_DELAY_MS)
    return () => {
      clearTimeout(timer)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-16 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80"
        >
          <div
            className="rounded-2xl p-4 shadow-xl flex items-center justify-between"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-sm italic" style={{ color: 'var(--fg-secondary)' }}>
              「{word}」
            </p>
            <button
              onClick={() => setVisible(false)}
              className="text-xs ml-2 opacity-50 hover:opacity-100"
              style={{ color: 'var(--fg-secondary)' }}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
