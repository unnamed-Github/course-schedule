import * as XLSX from 'xlsx'
import { Course, CourseSchedule } from '@/lib/types'

interface ExportRow {
  课程名: string
  教师: string
  教室: string
  星期: string
  开始节次: number
  结束节次: number
  单双周: string
  颜色: string
}

export function exportToCSV(courses: Course[], schedules: CourseSchedule[]) {
  const rows = buildExportRows(courses, schedules)
  const headers = ['课程名', '教师', '教室', '星期', '开始节次', '结束节次', '单双周', '颜色']
  const csvContent = [
    headers.join(','),
    ...rows.map((r) => [r.课程名, r.教师, r.教室, r.星期, r.开始节次, r.结束节次, r.单双周, r.颜色].join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, '课表.csv')
}

export function exportToExcel(courses: Course[], schedules: CourseSchedule[]) {
  const rows = buildExportRows(courses, schedules)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '课表')
  XLSX.writeFile(wb, '课表.xlsx')
}

function buildExportRows(courses: Course[], schedules: CourseSchedule[]): ExportRow[] {
  const DAY_MAP: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' }
  return schedules.map((s) => {
    const course = courses.find((c) => c.id === s.course_id)
    return {
      课程名: course?.name ?? '',
      教师: course?.teacher ?? '',
      教室: s.location,
      星期: DAY_MAP[s.day_of_week] ?? '',
      开始节次: s.start_period,
      结束节次: s.end_period,
      单双周: s.week_type === 'all' ? '每周' : s.week_type === 'odd' ? '单周' : '双周',
      颜色: course?.color ?? '',
    }
  })
}

export async function parseImportFile(file: File): Promise<ExportRow[]> {
  const text = await file.text()
  if (file.name.endsWith('.csv')) {
    return parseCSV(text)
  }
  const data = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(data, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<ExportRow>(ws)
}

function parseCSV(text: string): ExportRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = line.split(',')
    const row: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      if (h === '开始节次' || h === '结束节次') {
        row[h] = parseInt(values[i]) || 1
      } else {
        row[h] = values[i] ?? ''
      }
    })
    return row as unknown as ExportRow
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
