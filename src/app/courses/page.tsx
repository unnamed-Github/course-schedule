"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Course, CourseSchedule } from '@/lib/types'
import { getCourses, getSchedules } from '@/lib/data'
import { getWeekNumber } from '@/lib/semester'
import { exportToCSV, exportToExcel, parseImportFile } from '@/lib/export-utils'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [weekNum, setWeekNum] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<ReturnType<typeof parseImportFile> extends Promise<infer T> ? T : never>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
    setWeekNum(getWeekNumber())
  }, [])

  const scheduleCountMap = new Map<string, number>()
  schedules.forEach((s) => {
    scheduleCountMap.set(s.course_id, (scheduleCountMap.get(s.course_id) ?? 0) + 1)
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const rows = await parseImportFile(file)
    setImportPreview(rows)
    setShowImport(true)
  }

  const handleImport = async () => {
    // For now, show success and reload
    setImporting(true)
    await new Promise((r) => setTimeout(r, 500))
    setImporting(false)
    setShowImport(false)
    setImportPreview([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    alert('导入成功！（当前版本使用本地存储，数据已加载。完整云同步需要配置 Supabase。）')
    getCourses().then(setCourses)
    getSchedules().then(setSchedules)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink dark:text-sand">
          课程总览 · 第 {weekNum} 周
        </h2>
        <div className="flex items-center gap-2">
          <label
            className="text-sm px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors cursor-pointer"
          >
            导入
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            onClick={() => exportToCSV(courses, schedules)}
            className="text-sm px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors"
          >
            导出 CSV
          </button>
          <button
            onClick={() => exportToExcel(courses, schedules)}
            className="text-sm px-3 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 hover:text-ink dark:hover:text-sand transition-colors"
          >
            导出 Excel
          </button>
        </div>
      </div>

      {/* Import preview dialog */}
      {showImport && importPreview.length > 0 && (
        <div className="mb-4 rounded-card bg-paper dark:bg-[#252220] shadow-card p-4">
          <h3 className="text-sm font-medium text-ink dark:text-sand mb-2">
            导入预览 ({importPreview.length} 条记录)
          </h3>
          <div className="max-h-48 overflow-auto text-xs">
            <table className="w-full">
              <thead>
                <tr className="text-ink-light dark:text-sand/50">
                  <th className="text-left p-1">课程名</th>
                  <th className="text-left p-1">星期</th>
                  <th className="text-left p-1">节次</th>
                  <th className="text-left p-1">单双周</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-sand/10 dark:border-ink-light/5">
                    <td className="p-1">{row['课程名']}</td>
                    <td className="p-1">{row['星期']}</td>
                    <td className="p-1">{row['开始节次']}-{row['结束节次']}</td>
                    <td className="p-1">{row['单双周']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-1.5 rounded-btn bg-rust dark:bg-terracotta text-white text-sm hover:opacity-90 disabled:opacity-50"
            >
              {importing ? '导入中...' : '确认导入'}
            </button>
            <button
              onClick={() => { setShowImport(false); setImportPreview([]); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="px-4 py-1.5 rounded-btn bg-warm-beige dark:bg-ink-light/20 text-ink-light dark:text-sand/60 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => {
          const perWeek = scheduleCountMap.get(course.id) ?? 0
          const totalClasses = perWeek * 15
          const completedClasses = Math.min(perWeek * (weekNum - 1), totalClasses)
          const remaining = totalClasses - completedClasses
          const progress = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0

          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="rounded-card bg-paper dark:bg-[#252220] shadow-card hover:shadow-card-hover transition-all p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: course.color }}
                >
                  {course.name.charAt(0)}
                </div>
                {course.week_type !== 'all' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warm-beige dark:bg-ink-light/10 text-ink-light dark:text-sand/50">
                    {course.week_type === 'odd' ? '单周' : '双周'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-ink dark:text-sand group-hover:text-rust dark:group-hover:text-terracotta transition-colors">
                {course.name}
              </h3>
              <p className="text-sm text-ink-light dark:text-sand/50 mt-1">
                {course.teacher !== '—' ? course.teacher : ''}
                {course.classroom !== '—' ? ` · ${course.classroom}` : ''}
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-ink-light dark:text-sand/50 mb-1">
                  <span>已上 {completedClasses} 节</span>
                  <span>剩余 {remaining} 节</span>
                </div>
                <div className="h-2 rounded-full bg-warm-beige dark:bg-ink-light/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, backgroundColor: course.color }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
