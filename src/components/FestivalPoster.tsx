'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTodayFestival } from '@/lib/festivals'
import { X } from 'lucide-react'

export function FestivalPoster() {
  const festival = useMemo(() => getTodayFestival(), [])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!festival) return
    const today = new Date().toISOString().split('T')[0]
    const key = `festival_poster_shown_${today}`
    try {
      if (localStorage.getItem(key)) return
    } catch {}
    const timer = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(timer)
  }, [festival])

  const handleClose = () => {
    setVisible(false)
    const today = new Date().toISOString().split('T')[0]
    try {
      localStorage.setItem(`festival_poster_shown_${today}`, '1')
    } catch {}
  }

  if (!festival) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 40%, #164E63 100%)',
              boxShadow: '0 25px 60px rgba(8, 145, 178, 0.3)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 20% 80%, rgba(34, 211, 238, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)' }} />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <X size={16} strokeWidth={2} />
            </button>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="text-6xl mb-4"
              >
                {festival.emoji}
              </motion.div>

              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2"
                style={{ color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                {festival.greeting}
              </motion.h2>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-sm mb-8"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {festival.subGreeting}
              </motion.p>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-2"
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
                  />
                ))}
              </motion.div>

              <motion.button
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={handleClose}
                className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(4px)' }}
              >
                知道了
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
