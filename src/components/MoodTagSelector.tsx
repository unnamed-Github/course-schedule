"use client"

import { motion } from 'framer-motion'
import { MOOD_TAGS, type MoodTag } from '@/lib/types'

interface MoodTagSelectorProps {
  selected: MoodTag[]
  onChange: (tags: MoodTag[]) => void
}

export function MoodTagSelector({ selected, onChange }: MoodTagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_TAGS.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <motion.button
            key={option.value}
            onClick={() => {
              if (isSelected) onChange(selected.filter((t) => t !== option.value))
              else onChange([...selected, option.value])
            }}
            whileTap={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.2 }}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: isSelected ? `${option.color}1A` : 'transparent',
              border: `1px solid ${isSelected ? option.color : 'var(--border-light)'}`,
              color: isSelected ? option.color : 'var(--text-secondary)',
            }}
          >
            <span className="mr-1">{option.emoji}</span>
            <span>{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
