"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getWeekNumber, getSemesterConfig } from "@/lib/semester"

export function TopBar() {
  const { theme, toggle } = useTheme()
  const [weekNum, setWeekNum] = useState<number | null>(null)
  const totalWeeks = getSemesterConfig().teachingWeeks

  useEffect(() => {
    setWeekNum(getWeekNumber())
  }, [])

  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-4"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
    >
      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border-light)]"
        aria-label="切换主题"
        style={{ color: 'var(--text-secondary)' }}
      >
        {theme === "light" ? "🌞" : "🌙"}
      </button>

      {weekNum !== null && (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          第{weekNum}/{totalWeeks}周 · {new Date().getMonth() + 1}/{new Date().getDate()}
        </span>
      )}

      <div className="w-9" />
    </header>
  )
}
