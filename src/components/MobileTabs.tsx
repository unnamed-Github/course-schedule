"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "📅 周", shortLabel: "周" },
  { href: "/day", label: "☀️ 日", shortLabel: "日" },
  { href: "/courses", label: "📚 课程", shortLabel: "课" },
]

export function MobileTabs() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream/95 dark:bg-[#1E1B18]/95 backdrop-blur border-t border-sand/40 dark:border-ink-light/20 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors ${
                isActive
                  ? "text-rust dark:text-terracotta"
                  : "text-ink-light dark:text-sand/50"
              }`}
            >
              <span className="text-lg">{tab.shortLabel}</span>
              <span className="text-[10px]">{tab.label.replace(/^[^\s]+\s/, "")}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
