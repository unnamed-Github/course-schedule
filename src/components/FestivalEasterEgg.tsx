'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getTodayFestival, type Festival } from '@/lib/festivals'
import { PartyPopper } from 'lucide-react'

export function FestivalEasterEgg() {
  const [festival, setFestival] = useState<Festival | null>(null)

  useEffect(() => {
    setFestival(getTodayFestival())
  }, [])

  if (!festival) return null

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('festival-poster:show'))
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
      whileHover={{ scale: 1.2 }}
      onClick={handleClick}
      className="inline-flex items-center gap-1 cursor-pointer"
      title={festival.greeting}
    >
      <PartyPopper size={18} strokeWidth={1.8} style={{ color: 'var(--accent-warm)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--accent-warm)' }}>
        {festival.greeting}
      </span>
    </motion.span>
  )
}

export function useFestivalGreeting(): { greeting: string | null; subGreeting: string | null } {
  const [festival, setFestival] = useState<Festival | null>(null)

  useEffect(() => {
    setFestival(getTodayFestival())
  }, [])

  if (!festival) return { greeting: null, subGreeting: null }
  return { greeting: festival.greeting, subGreeting: festival.subGreeting }
}
