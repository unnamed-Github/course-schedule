"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "@/components/ThemeProvider"

const NAV_ITEMS = [
  { href: "/", label: "周视图" },
  { href: "/day", label: "日视图" },
  { href: "/courses", label: "课程" },
]

export function NavBar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-40 bg-cream/90 dark:bg-[#1E1B18]/90 backdrop-blur border-b border-sand/40 dark:border-ink-light/20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-rust dark:text-terracotta tracking-tight">
          课表 · 竹
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-btn text-sm transition-colors ${
                  isActive
                    ? "bg-warm-beige dark:bg-ink-light/20 text-rust dark:text-terracotta font-medium"
                    : "text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={toggle}
            className="ml-2 p-2 rounded-btn hover:bg-warm-beige dark:hover:bg-ink-light/20 transition-colors text-ink-light dark:text-sand/60"
            aria-label="切换主题"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  )
}
