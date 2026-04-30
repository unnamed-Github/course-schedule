"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GENTLE_WORDS = [
  '你已经做得很好了。',
  '累了就歇会儿，不赶。',
  '今天也辛苦了。',
  '每节课都是一块拼图。',
  '慢慢来，比较快。',
  '你比昨天更近了一步。',
]

const COOLDOWN_MS = 15 * 60 * 1000

export function EasterEgg() {
  const [visible, setVisible] = useState(false)
  const [word, setWord] = useState('')

  useEffect(() => {
    const check = () => {
      let lastShown: string | null = null
      try { lastShown = localStorage.getItem('easter_egg_last') } catch {}
      const now = Date.now()
      if (lastShown && now - parseInt(lastShown) < COOLDOWN_MS) return
      if (Math.random() > 0.2) return

      const w = GENTLE_WORDS[Math.floor(Math.random() * GENTLE_WORDS.length)]
      setWord(w)
      setVisible(true)
      try { localStorage.setItem('easter_egg_last', now.toString()) } catch {}
      setTimeout(() => setVisible(false), 5000)
    }
    const timer = setTimeout(check, 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-sm z-50 rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}
        >
          <div className="flex items-center gap-2">
            <span>🌊</span>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              {word}
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-xs ml-2 opacity-40 hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
