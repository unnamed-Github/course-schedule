import { supabase } from './supabase'
import type { Holiday, MakeupDay } from './semester'

const DEFAULT_SEMESTER_START = '2026-02-25'
const DEFAULT_TEACHING_WEEKS = 15
const DEFAULT_EXAM_WEEKS = 2
const DEFAULT_HOLIDAYS: Holiday[] = [
  { name: '清明节', start: '2026-04-05', end: '2026-04-05' },
  { name: '劳动节', start: '2026-05-01', end: '2026-05-05' },
  { name: '端午节', start: '2026-06-19', end: '2026-06-19' },
]
const DEFAULT_MAKEUP_DAYS: MakeupDay[] = [
  { date: '2026-02-28', replacesDayOfWeek: 1, weekType: 'all' },
  { date: '2026-05-09', replacesDayOfWeek: 2, weekType: 'odd' },
]

export async function getSemesterConfigFromDB(): Promise<{
  semesterStart: string
  teachingWeeks: number
  examWeeks: number
  holidays: Holiday[]
  makeupDays: MakeupDay[]
}> {
  const { data } = await supabase.from('semester_config').select('key, value')

  if (!data || data.length === 0) {
    return {
      semesterStart: DEFAULT_SEMESTER_START,
      teachingWeeks: DEFAULT_TEACHING_WEEKS,
      examWeeks: DEFAULT_EXAM_WEEKS,
      holidays: DEFAULT_HOLIDAYS,
      makeupDays: DEFAULT_MAKEUP_DAYS,
    }
  }

  const map = new Map(data.map((r: { key: string; value: string }) => [r.key, r.value]))

  return {
    semesterStart: map.get('semester_start') ?? DEFAULT_SEMESTER_START,
    teachingWeeks: parseInt(map.get('teaching_weeks') ?? String(DEFAULT_TEACHING_WEEKS)),
    examWeeks: parseInt(map.get('exam_weeks') ?? String(DEFAULT_EXAM_WEEKS)),
    holidays: JSON.parse(map.get('holidays') ?? JSON.stringify(DEFAULT_HOLIDAYS)),
    makeupDays: JSON.parse(map.get('makeup_days') ?? JSON.stringify(DEFAULT_MAKEUP_DAYS)),
  }
}

export async function updateSemesterConfigToDB(config: {
  semesterStart?: string
  teachingWeeks?: number
  examWeeks?: number
  holidays?: Holiday[]
  makeupDays?: MakeupDay[]
}): Promise<boolean> {
  const current = await getSemesterConfigFromDB()
  const merged = { ...current, ...config }

  const upserts = [
    { key: 'semester_start', value: merged.semesterStart },
    { key: 'teaching_weeks', value: String(merged.teachingWeeks) },
    { key: 'exam_weeks', value: String(merged.examWeeks) },
    { key: 'holidays', value: JSON.stringify(merged.holidays) },
    { key: 'makeup_days', value: JSON.stringify(merged.makeupDays) },
  ]

  const { error } = await supabase.from('semester_config').upsert(upserts, { onConflict: 'key' })
  if (error) { console.error('updateSemesterConfigToDB error:', error); return false }
  return true
}
