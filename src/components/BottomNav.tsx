"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, CalendarDays, BookOpen, ClipboardList, StickyNote, Settings } from 'lucide-react'
import { useView, ViewType } from './ViewContext'

const TABS: { href?: string; view?: ViewType; icon: React.ReactNode; label: string }[] = [
  { href: "/", icon: <CalendarDays size={20} strokeWidth={1.8} />, label: "周视图" },
  { href: "/day", icon: <Calendar size={20} strokeWidth={1.8} />, label: "日视图" },
  { href: "/courses", icon: <BookOpen size={20} strokeWidth={1.8} />, label: "课程" },
  { view: "assignments", icon: <ClipboardList size={20} strokeWidth={1.8} />, label: "作业" },
  { view: "memos", icon: <StickyNote size={20} strokeWidth={1.8} />, label: "备忘" },
  { href: "/settings", icon: <Settings size={20} strokeWidth={1.8} />, label: "设置" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { currentView, setCurrentView } = useView()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--nav-glass-bg)',
        borderTop: '1px solid var(--border-light)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-6xl mx-auto">
        {TABS.map((tab) => {
          const isRouteActive = tab.href ? (pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href + '/'))) : false
          const isViewActive = tab.view ? currentView === tab.view : false
          const isActive = isRouteActive || isViewActive

          if (tab.view) {
            return (
              <button
                key={tab.view}
                onClick={() => setCurrentView(tab.view!)}
                className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1 transition-colors cursor-pointer"
                style={{ color: isActive ? 'var(--accent-info)' : 'var(--text-secondary)' }}
              >
                {tab.icon}
                <span className={`text-[10px] whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className="flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1 transition-colors cursor-pointer"
              style={{ color: isActive ? 'var(--accent-info)' : 'var(--text-secondary)' }}
            >
              {tab.icon}
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
