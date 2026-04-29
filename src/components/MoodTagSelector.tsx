"use client"

import { motion } from 'framer-motion'
import type { MoodTag } from '@/lib/types'

const MOOD_OPTIONS: { value: MoodTag; emoji: string; label: string }[] = [
  { value: '⭐喜欢', emoji: '⭐', label: '喜欢' },
  { value: '🥱苟住', emoji: '🥱', label: '苟住' },
  { value: '💪硬扛', emoji: '💪', label: '硬扛' },
  { value: '🌈期待', emoji: '🌈', label: '期待' },
]

interface MoodTagSelectorProps {
  selected: MoodTag[]
  onChange: (tags: MoodTag[]) => void
}

export function MoodTagSelector({ selected, onChange }: MoodTagSelectorProps) {
  const toggle = (tag: MoodTag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <motion.button
            key={option.value}
            onClick={() => toggle(option.value)}
            whileTap={{ scale: 0.9 }}
            className="chip text-sm"
            style={{
              backgroundColor: isSelected ? `${getColorForMood(option.value)}15` : 'transparent',
              borderColor: isSelected ? getColorForMood(option.value) : 'var(--border)',
              color: isSelected ? getColorForMood(option.value) : 'var(--fg-secondary)',
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            <span>{option.emoji}</span>
            <span>{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

function getColorForMood(tag: MoodTag): string {
  switch (tag) {
    case '⭐喜欢': return '#F59E0B'
    case '🥱苟住': return '#6B7280'
    case '💪硬扛': return '#EF4444'
    case '🌈期待': return '#10B981'
  }
}
