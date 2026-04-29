"use client"

import { useEffect, useState } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { getTodayCourses, getWeekNumber } from '@/lib/schedule'

const GREETINGS = {
  busy: [
    '今天课很多，加油 💪',
    '满课的战士，竹',
    '撑住，课多也有课多的风景',
  ],
  normal: [
    '今天节奏刚好，稳着来 🌿',
    '按部就班就是胜利',
    '一步一步，不急不躁',
  ],
  light: [
    '今天课不多，偷得半日闲 ☕',
    '轻松的一天，享受一下',
    '放慢脚步也很好',
  ],
}

const GENTLE_WORDS = [
  '你已经做得很好了。',
  '累了就歇会儿，不赶。',
  '竹子一节一节长，你也是。',
  '今天也辛苦了。',
  '每节课都是一块拼图。',
]

export function Greeting() {
  const [greeting, setGreeting] = useState('')
  const [gentleWord, setGentleWord] = useState('')

  useEffect(() => {
    Promise.all([getCourses(), getSchedules()]).then(([courses, schedules]) => {
      const todayCourses = getTodayCourses(schedules)
      const count = todayCourses.length

      let pool: string[]
      if (count >= 4) pool = GREETINGS.busy
      else if (count >= 2) pool = GREETINGS.normal
      else pool = GREETINGS.light

      const weekNum = getWeekNumber()
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const gIdx = (dayOfYear + weekNum) % pool.length
      setGreeting(pool[gIdx])

      // Gentle word: once per day
      const lastShown = localStorage.getItem('gentle_word_date')
      const today = new Date().toDateString()
      if (lastShown !== today) {
        const wIdx = dayOfYear % GENTLE_WORDS.length
        setGentleWord(GENTLE_WORDS[wIdx])
        localStorage.setItem('gentle_word_date', today)
      }
    })
  }, [])

  if (!greeting) return null

  return (
    <div className="text-center py-2">
      <p className="text-sm text-ink-light dark:text-sand/50">{greeting}</p>
      {gentleWord && (
        <p className="text-xs text-ink-light/60 dark:text-sand/30 mt-1 italic">
          「{gentleWord}」
        </p>
      )}
    </div>
  )
}
