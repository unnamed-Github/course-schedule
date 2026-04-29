"use client"

import { useEffect, useState, useRef } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleExportCSV = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToCSV(courses, schedules)
  }

  const handleExportExcel = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToExcel(courses, schedules)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>⚙️ 设置</h2>

      {/* Data */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>导入导出</h3>
        <div className="flex flex-wrap gap-2">
          <label className="btn-ghost text-sm cursor-pointer flex-1 text-center">
            📥 导入课表
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
          <button onClick={handleExportCSV} className="btn-ghost text-sm flex-1">📤 导出 CSV</button>
          <button onClick={handleExportExcel} className="btn-ghost text-sm flex-1">📤 导出 Excel</button>
        </div>
        {showImport && importPreview.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--fg-secondary)' }}>预览 {importPreview.length} 条</p>
            <button onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-ghost text-xs">
              确认导入 (演示)
            </button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>外观</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            {theme === 'light' ? '☀️ 亮色模式' : '🌙 暗色模式'}
          </span>
          <button
            onClick={toggle}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{ backgroundColor: theme === 'dark' ? '#F59E0B' : 'var(--border)' }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-sm"
              style={{ left: theme === 'dark' ? 'calc(100% - 22px)' : '2px' }}
            />
          </button>
        </div>
      </div>

      {/* Semester Info */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>学期信息</h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--fg-secondary)' }}>
          <div className="flex justify-between">
            <span>开学日期</span>
            <span>2026-02-25</span>
          </div>
          <div className="flex justify-between">
            <span>教学周</span>
            <span>第 1-15 周</span>
          </div>
          <div className="flex justify-between">
            <span>考试周</span>
            <span>第 16-17 周</span>
          </div>
          <div className="flex justify-between">
            <span>节假日</span>
            <span>清明 4/5 · 五一 5/1-5 · 端午 6/19</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>关于</h3>
        <div className="space-y-1 text-xs" style={{ color: 'var(--fg-secondary)' }}>
          <p>课表 · 竹 v1.0</p>
          <p>2026 春季学期 · 南科大</p>
          <p>温暖手帐 · 云端同步 · 开源</p>
        </div>
      </div>
    </div>
  )
}
