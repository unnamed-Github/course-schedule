"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"

export function NavBar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md" style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--fg)] tracking-tight">
          课表 · 竹
        </Link>
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]"
          aria-label="切换主题"
          style={{ color: 'var(--fg-secondary)' }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  )
}
