'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getTodayFestival } from '@/lib/festivals'
import { PartyPopper } from 'lucide-react'

export function FestivalEasterEgg() {
  const festival = useMemo(() => getTodayFestival(), [])

  if (!festival) return null

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
      whileHover={{ scale: 1.2 }}
      className="inline-flex items-center gap-1 cursor-default"
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
  const festival = getTodayFestival()
  if (!festival) return { greeting: null, subGreeting: null }
  return { greeting: festival.greeting, subGreeting: festival.subGreeting }
}
