"use client"

import { useRef, useState } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useTheme } from '@/components/ThemeProvider'
import { getSemesterConfig } from '@/lib/semester'
import { useToast } from '@/components/ToastProvider'

const semester = getSemesterConfig()

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const { showToast } = useToast()
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    try {
      const rows = await parseImportFile(file)
      setImportPreview(rows)
      setShowImport(true)
    } catch {
      showToast('导入失败，请检查文件格式', 'error')
    }
  }

  const handleExportCSV = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToCSV(courses, schedules)
    showToast('已导出 CSV ✅', 'success')
  }

  const handleExportExcel = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    exportToExcel(courses, schedules)
    showToast('已导出 Excel ✅', 'success')
  }

  const handleExportJSON = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    const data = { courses, schedules, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '课表.json'; a.click(); URL.revokeObjectURL(url)
    showToast('已导出 JSON ✅', 'success')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>⚙️ 设置</h2>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>导入导出</h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) await processFile(f) }}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-3"
          style={{ borderColor: dragOver ? 'var(--accent-info)' : 'var(--border-light)', backgroundColor: dragOver ? 'var(--drop-highlight)' : 'transparent' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>📁 拖拽 CSV/Excel 到此处</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>或点击选择文件</p>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await processFile(f) }} className="hidden" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="btn-ghost text-sm flex-1">📤 CSV</button>
          <button onClick={handleExportExcel} className="btn-ghost text-sm flex-1">📤 Excel</button>
          <button onClick={handleExportJSON} className="btn-ghost text-sm flex-1">📤 JSON</button>
        </div>
        {showImport && importPreview.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>预览 {importPreview.length} 条</p>
            <button onClick={() => { setShowImport(false); setImportPreview([]); showToast(`成功导入 ${importPreview.length} 门课程`, 'success') }} className="btn-ghost text-xs">确认导入</button>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>外观</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{theme === 'light' ? '☀️ 亮色模式' : '🌙 暗色模式'}</span>
            <button onClick={toggle} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: theme === 'dark' ? 'var(--accent-info)' : 'var(--border-light)' }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: theme === 'dark' ? 'calc(100% - 22px)' : '2px' }} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>当前课程高亮</span>
            <button onClick={() => setHighlightEnabled(!highlightEnabled)} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: highlightEnabled ? 'var(--accent-info)' : 'var(--border-light)' }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: highlightEnabled ? 'calc(100% - 22px)' : '2px' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>学期信息</h3>
        <div className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between text-sm"><span>开学日期</span>
            <input type="date" className="rounded-lg px-2 py-1 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} defaultValue="2026-02-25" />
          </div>
          <div className="flex justify-between text-sm"><span>教学周</span>
            <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} defaultValue={15} min={1} max={30} />
          </div>
          <div className="flex justify-between text-sm"><span>考试周</span>
            <input type="number" className="rounded-lg px-2 py-1 w-20 text-sm" style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} defaultValue={2} min={0} max={10} />
          </div>
          <div className="flex justify-between text-sm"><span>节假日</span><span>清明 4/5 · 五一 5/1-5 · 端午 6/19</span></div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>📅 节假日与调休</h3>
        {semester.holidays.map((h) => (
          <div key={h.name} className="flex items-center justify-between text-xs py-1" style={{ color: 'var(--text-secondary)' }}>
            <span>{h.name}</span><span>{h.start}{h.end !== h.start ? ` — ${h.end}` : ''}</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--border-light)' }}>
          {semester.makeupDays.map((m) => (
            <div key={m.date} className="flex items-center justify-between text-xs py-0.5" style={{ color: 'var(--text-secondary)' }}>
              <span>{m.date}</span><span>补周{m.replacesDayOfWeek} · {m.weekType === 'odd' ? '单周' : m.weekType === 'even' ? '双周' : '每周'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>关于</h3>
        <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <p>课表 · 竹 v1.0</p>
          <p>2026 春季学期 · 南科大</p>
          <p>温暖手帐 · 云端同步 · 开源</p>
        </div>
      </div>
    </div>
  )
}
