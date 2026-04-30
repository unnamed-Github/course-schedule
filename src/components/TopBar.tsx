"use client"

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { getWeekNumber, getSemesterConfig, getWeekDateRange } from '@/lib/semester'
import { useView, ViewType } from './ViewContext'

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
      className="sticky top-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}
    >
      {/* 顶部信息栏 */}
      <div className="h-12 flex items-center justify-between px-4">
        <button
          onClick={() => setCurrentView('week')}
          className="font-semibold text-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--accent-info)' }}
        >
          课表
        </button>

        {weekNum !== null && (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            第{weekNum}/{totalWeeks}周 · {dateLabel}
          </span>
        )}

        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="切换主题"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === "light" ? "🌞" : "🌙"}
        </button>
      </div>

      {/* Tab导航栏 */}
      <div className="flex items-center justify-center gap-1 px-2 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = currentView === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: isActive ? 'var(--accent-info)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
