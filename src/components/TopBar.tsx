"use client"

import { useEffect, useState } from 'react'
import { Sun, Moon, GraduationCap } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { getWeekNumber, getSemesterConfig, getWeekDateRange } from '@/lib/semester'
import { useView, ViewType } from './ViewContext'
import { SemesterCountdown } from './SemesterCountdown'
import { FestivalEasterEgg } from './FestivalEasterEgg'

const TABS: { id: ViewType; label: string }[] = [
  { id: 'week', label: '周视图' },
  { id: 'day', label: '日视图' },
  { id: 'courses', label: '课程' },
  { id: 'assignments', label: '作业' },
  { id: 'memos', label: '备忘' },
]

export function TopBar() {
  const { theme, toggle } = useTheme()
  const { currentView, setCurrentView } = useView()
  const [weekNum, setWeekNum] = useState<number | null>(null)
  const [dateLabel, setDateLabel] = useState('')
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
      className="sticky top-0 z-30 flex flex-col glass-nav"
    >
      <div className="h-12 flex items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => setCurrentView('week')}
          className="flex items-center gap-1.5 font-semibold text-lg rounded-lg px-1 -ml-1 transition-opacity hover:opacity-75 focus-visible:opacity-75 cursor-pointer"
          style={{ color: 'var(--accent-primary)', boxShadow: 'none' }}
        >
          <GraduationCap size={22} strokeWidth={1.8} />
          课表
          <FestivalEasterEgg />
        </button>

        {weekNum !== null && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            第{weekNum}/{totalWeeks}周 · {dateLabel}
          </span>
        )}

        <div className="flex items-center gap-1">
          <SemesterCountdown />
          <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-[var(--border-light)] focus-visible:shadow-[var(--focus-ring)]"
          aria-label="切换主题"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === "light" ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
        </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-0.5 px-2 sm:px-4 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = currentView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className="px-4 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap relative cursor-pointer rounded-lg focus-visible:shadow-[var(--focus-ring)]"
              style={{
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? 'var(--makeup-badge)' : 'transparent',
              }}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}
