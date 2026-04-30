'use client'

import { useRef, useState } from 'react'
import { getCourses, getSchedules } from '@/lib/data'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'
import { useToast } from '@/components/ToastProvider'
import { Upload, FileUp } from 'lucide-react'

interface ImportExportPanelProps {
  compact?: boolean
}

export function ImportExportPanel({ compact = false }: ImportExportPanelProps) {
  const { showToast } = useToast()
  const [importPreview, setImportPreview] = useState<unknown[]>([])
  const [showImport, setShowImport] = useState(false)
  const [dragOver, setDragOver] = useState(false)
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

  const dropZoneLabel = compact ? (
    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>📁 拖拽 CSV/Excel 到此处</p>
  ) : (
    <p className="text-sm flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
      <Upload size={16} strokeWidth={1.8} />拖拽 CSV/Excel 到此处
    </p>
  )

  return (
    <div>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>导入导出</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) await processFile(f) }}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors mb-3"
        style={{
          borderColor: dragOver ? 'var(--accent-info)' : 'var(--border-light)',
          backgroundColor: dragOver ? 'var(--drop-highlight)' : 'transparent',
        }}
      >
        {dropZoneLabel}
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>或点击选择文件</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) await processFile(f) }}
          className="hidden"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleExportCSV} className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"><FileUp size={14} strokeWidth={2} />CSV</button>
        <button onClick={handleExportExcel} className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"><FileUp size={14} strokeWidth={2} />Excel</button>
        <button onClick={handleExportJSON} className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"><FileUp size={14} strokeWidth={2} />JSON</button>
      </div>
      {showImport && importPreview.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>预览 {importPreview.length} 条</p>
          <button
            onClick={() => { setShowImport(false); setImportPreview([]); showToast(`成功导入 ${importPreview.length} 门课程`, 'success') }}
            className="btn-ghost text-xs"
          >确认导入</button>
        </div>
      )}
    </div>
  )
}
