"use client"

import { useRef, useState } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useTheme } from '@/components/ThemeProvider'
import { getSemesterConfig } from '@/lib/semester'

const semester = getSemesterConfig()

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleExportJSON = async () => {
    const [courses, schedules] = await Promise.all([getCourses(), getSchedules()])
    const data = { courses, schedules, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '课表.json'; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>⚙️ 设置</h2>

      {/* 导入导出 */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>导入导出</h3>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) await processFile(f) }}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-3"
          style={{ borderColor: dragOver ? 'var(--accent-info)' : 'var(--border-light)', backgroundColor: dragOver ? 'rgba(59,130,246,0.04)' : 'transparent' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>📁 拖拽 CSV/Excel 文件到此处</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>或点击选择文件</p>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await processFile(f) }} className="hidden" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { const [c, s] = await Promise.all([getCourses(), getSchedules()]); exportToCSV(c, s) }} className="btn-ghost text-sm flex-1">📤 CSV</button>
          <button onClick={async () => { const [c, s] = await Promise.all([getCourses(), getSchedules()]); exportToExcel(c, s) }} className="btn-ghost text-sm flex-1">📤 Excel</button>
          <button onClick={handleExportJSON} className="btn-ghost text-sm flex-1">📤 JSON</button>
        </div>
        {showImport && importPreview.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>预览 {importPreview.length} 条</p>
            <button onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-ghost text-xs">确认导入</button>
          </div>
        )}
      </div>

      {/* 外观 */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>外观</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{theme === 'light' ? '☀️ 亮色模式' : '🌙 暗色模式'}</span>
          <button onClick={toggle} className="w-11 h-6 rounded-full relative transition-colors" style={{ backgroundColor: theme === 'dark' ? 'var(--accent-info)' : 'var(--border-light)' }}>
            <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm" style={{ left: theme === 'dark' ? 'calc(100% - 22px)' : '2px' }} />
          </button>
        </div>
      </div>

      {/* 学期 */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>学期信息</h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between"><span>开学日期</span><span>2026-02-25</span></div>
          <div className="flex justify-between"><span>教学周</span><span>第 1-15 周</span></div>
          <div className="flex justify-between"><span>考试周</span><span>第 16-17 周</span></div>
          <div className="flex justify-between"><span>节假日</span><span>清明 4/5 · 五一 5/1-5 · 端午 6/19</span></div>
        </div>
      </div>

      {/* 节假日 / 调休管理 */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>📅 节假日与调休</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>假期安排</p>
            <div className="space-y-1.5">
              {semester.holidays.map((h) => (
                <div key={h.name} className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>{h.name}</span>
                  <span>{h.start}{h.end !== h.start ? ` — ${h.end}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>调课 / 补课</p>
            <div className="space-y-1.5">
              {semester.makeupDays.map((m) => (
                <div key={m.date} className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>{m.date}</span>
                  <span>补周{m.replacesDayOfWeek} · {m.weekType === 'odd' ? '单周' : m.weekType === 'even' ? '双周' : '每周'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 关于 */}
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
