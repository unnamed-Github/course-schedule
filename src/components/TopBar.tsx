"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/ThemeProvider"
import { getWeekNumber, getSemesterConfig, getWeekDateRange } from "@/lib/semester"

export function TopBar() {
  const { theme, toggle } = useTheme()
  const [weekNum, setWeekNum] = useState<number | null>(null)
  const [dateLabel, setDateLabel] = useState("")
  const totalWeeks = getSemesterConfig().teachingWeeks

  useEffect(() => {
    const wn = getWeekNumber()
    setWeekNum(wn)
    const range = getWeekDateRange(wn)
    const sm = range.start.getMonth() + 1
    const sd = range.start.getDate()
    const em = range.end.getMonth() + 1
    const ed = range.end.getDate()
    setDateLabel(`${sm}/${sd}—${em}/${ed}`)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-4"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
    >
      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="切换主题"
        style={{ color: 'var(--text-secondary)' }}
      >
        {theme === "light" ? "🌞" : "🌙"}
      </button>

      {weekNum !== null && (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          第{weekNum}/{totalWeeks}周 · {dateLabel}
        </span>
      )}

      <div className="w-9 flex items-center justify-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        {new Date().getMonth() + 1}/{new Date().getDate()}
      </div>
    </header>
  )
}
