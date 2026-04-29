"use client"

import { useEffect } from 'react'

function getTintOpacity(hour: number): string {
  if (hour >= 22 || hour < 6) return 'rgba(30,30,60,0.015)'
  if (hour >= 18) return 'rgba(30,40,60,0.01)'
  if (hour >= 15) return 'rgba(245,158,11,0.012)'
  if (hour >= 9) return 'transparent'
  return 'rgba(255,220,200,0.02)'
}

export function DayPhaseTint() {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'day-phase-tint'
    document.head.appendChild(style)

    const update = () => {
      const opacity = getTintOpacity(new Date().getHours())
      style.textContent = `html::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:${opacity};transition:background 2s ease}`
    }

    update()
    const timer = setInterval(update, 60000)
    return () => {
      clearInterval(timer)
      style.remove()
    }
  }, [])

  return null
}
