"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"
import { getWeekNumber, getSemesterConfig } from "@/lib/semester"

const TABS = [
  { href: "/", label: "周视图" },
  { href: "/day", label: "日视图" },
  { href: "/courses", label: "课程" },
  { href: "/settings", label: "设置" },
]

export function NavBar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [weekNum, setWeekNum] = useState<number | null>(null)
  const totalWeeks = getSemesterConfig().teachingWeeks

  useEffect(() => {
    setWeekNum(getWeekNumber())
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight.getTime() - Date.now()
    const timer = setTimeout(() => {
      setWeekNum(getWeekNumber())
    }, msUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0" style={{ color: 'var(--fg)' }}>
          课表 · 竹
        </Link>

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  color: isActive ? 'var(--fg)' : 'var(--fg-secondary)',
                  backgroundColor: isActive ? 'var(--border)' : 'transparent',
                }}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {weekNum !== null && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--border)', color: 'var(--fg-secondary)' }}>
              📅 第{weekNum}/{totalWeeks}周
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
