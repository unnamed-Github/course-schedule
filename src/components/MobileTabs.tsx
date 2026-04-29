"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", icon: "📅", label: "周视图" },
  { href: "/day", icon: "📆", label: "日视图" },
  { href: "/courses", icon: "📚", label: "课程" },
  { href: "/settings", icon: "⚙️", label: "设置" },
]

export function MobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{
        backgroundColor: 'var(--tab-bg)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -1px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href + '/'))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1 transition-colors relative"
              style={{ color: isActive ? 'var(--fg)' : 'var(--fg-secondary)' }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
