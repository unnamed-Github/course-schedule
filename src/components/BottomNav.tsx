"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", icon: "📅", label: "周视图" },
  { href: "/day", icon: "📆", label: "日视图" },
  { href: "/courses", icon: "📚", label: "课程" },
  { href: "/settings", icon: "⚙️", label: "设置" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-6xl mx-auto">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1 transition-colors"
              style={{ color: isActive ? 'var(--accent-info)' : 'var(--text-secondary)' }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
