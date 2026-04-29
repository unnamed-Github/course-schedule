"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"
import { getWeekNumber } from "@/lib/semester"

export function NavBar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [weekNum, setWeekNum] = useState<number | null>(null)

  useEffect(() => {
    setWeekNum(getWeekNumber())
  }, [])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
          课表 · 竹
        </Link>
        <div className="flex items-center gap-3">
          {weekNum !== null && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--border)', color: 'var(--fg-secondary)' }}>
              📅 第{weekNum}/15周
            </span>
          )}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]"
            aria-label="切换主题"
            style={{ color: 'var(--fg-secondary)' }}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
    </header>
  )
}
