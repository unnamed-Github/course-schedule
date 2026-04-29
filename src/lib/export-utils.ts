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

function csvEscape(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvParseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

export function exportToCSV(courses: Course[], schedules: CourseSchedule[]) {
  const rows = buildExportRows(courses, schedules)
  const headers = ['课程名', '教师', '教室', '星期', '开始节次', '结束节次', '单双周', '颜色']
  const csvContent = [
    headers.map(csvEscape).join(','),
    ...rows.map((r) =>
      [r.课程名, r.教师, r.教室, r.星期, r.开始节次, r.结束节次, r.单双周, r.颜色]
        .map(csvEscape)
        .join(',')
    ),
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

function validateExportRow(raw: Record<string, string | number>): ExportRow {
  return {
    课程名: String(raw['课程名'] ?? ''),
    教师: String(raw['教师'] ?? ''),
    教室: String(raw['教室'] ?? ''),
    星期: String(raw['星期'] ?? ''),
    开始节次: parseInt(String(raw['开始节次']), 10) || 1,
    结束节次: parseInt(String(raw['结束节次']), 10) || 1,
    单双周: String(raw['单双周'] ?? '每周'),
    颜色: String(raw['颜色'] ?? ''),
  }
}

export async function parseImportFile(file: File): Promise<ExportRow[]> {
  const text = await file.text()
  if (file.name.endsWith('.csv')) {
    return parseCSV(text)
  }
  const data = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(data, { type: 'array' })
  if (wb.SheetNames.length === 0) return []
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return []
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws)
  return rawRows.map(validateExportRow)
}

function parseCSV(text: string): ExportRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = csvParseLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = csvParseLine(line)
    const row: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      if (h === '开始节次' || h === '结束节次') {
        row[h] = parseInt(values[i], 10) || 1
      } else {
        row[h] = values[i] ?? ''
      }
    })
    return validateExportRow(row)
  })
}

function downloadBlob(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
