"use client"

import { motion } from 'framer-motion'
import { MOOD_TAGS, type MoodTag, getMoodColor } from '@/lib/types'

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
      {MOOD_TAGS.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <motion.button
            key={option.value}
            onClick={() => toggle(option.value)}
            whileTap={{ scale: 0.9 }}
            className="chip text-sm"
            style={{
              backgroundColor: isSelected ? `${option.color}15` : 'transparent',
              borderColor: isSelected ? option.color : 'var(--border)',
              color: isSelected ? option.color : 'var(--fg-secondary)',
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
