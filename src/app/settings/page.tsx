"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('highlight_enabled')
    if (stored !== null) setHighlightEnabled(stored === 'true')
  }, [])

  const toggleHighlight = () => {
    const next = !highlightEnabled
    setHighlightEnabled(next)
    localStorage.setItem('highlight_enabled', String(next))
  }

  const processFile = useCallback(async (file: File) => {
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    await processFile(file)
  }

  const handleExportCSV = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToCSV(courses, schedules)
  }

  const handleExportExcel = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToExcel(courses, schedules)
  }

  const handleExportJSON = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    const data = { courses, schedules, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '课表.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSendFeedback = () => {
    if (!feedback.trim()) return
    setFeedbackSent(true)
    setTimeout(() => { setFeedback(''); setFeedbackSent(false) }, 2000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>⚙️ 设置</h2>

      {/* Import / Export */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>导入导出</h3>

        {/* Drag & drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-3"
          style={{
            borderColor: dragOver ? '#F59E0B' : 'var(--border)',
            backgroundColor: dragOver ? 'rgba(245,158,11,0.04)' : 'transparent',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            {dragOver ? '📥 松开即可导入' : '📥 拖拽 CSV/Excel 文件到此处'}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--fg-secondary)', opacity: 0.5 }}>或点击选择文件</p>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="btn-ghost text-sm flex-1">📤 CSV</button>
          <button onClick={handleExportExcel} className="btn-ghost text-sm flex-1">📤 Excel</button>
          <button onClick={handleExportJSON} className="btn-ghost text-sm flex-1">📤 JSON</button>
        </div>

        {showImport && importPreview.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--fg-secondary)' }}>预览 {importPreview.length} 条</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-ghost text-xs">
                确认导入 (演示)
              </button>
              <button onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-ghost text-xs" style={{ color: 'var(--fg-secondary)' }}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>外观</h3>
        <div className="space-y-3">
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
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
              🔆 课程高亮
            </span>
            <button
              onClick={toggleHighlight}
              className="w-12 h-7 rounded-full relative transition-colors"
              style={{ backgroundColor: highlightEnabled ? '#F59E0B' : 'var(--border)' }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-transform shadow-sm"
                style={{ left: highlightEnabled ? 'calc(100% - 22px)' : '2px' }}
              />
            </button>
          </div>
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

      {/* Feedback */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>反馈</h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="有什么想说的？bug、建议、或者只是想说句话..."
          rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none mb-2"
          style={{ border: '1px solid var(--border)', color: 'var(--fg)', backgroundColor: 'var(--bg)' }}
        />
        <button
          onClick={handleSendFeedback}
          className="rounded-xl px-4 py-1.5 text-xs text-white font-medium bg-[#F59E0B] hover:opacity-90 disabled:opacity-50"
          disabled={!feedback.trim() || feedbackSent}
        >
          {feedbackSent ? '已发送 ✓' : '发送反馈'}
        </button>
      </div>

      {/* About */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>关于</h3>
        <div className="space-y-1 text-xs" style={{ color: 'var(--fg-secondary)' }}>
          <p>课表 · 竹 v1.0</p>
          <p>2026 春季学期 · 南科大</p>
          <p>温暖手帐 · 云端同步 · 开源</p>
          <p className="mt-2" style={{ opacity: 0.5 }}>
            <a href="https://github.com/unnamed-Github/course-schedule" target="_blank" rel="noopener noreferrer" className="hover:underline">
              GitHub →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
