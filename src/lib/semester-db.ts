import { supabase } from './supabase'
import type { Holiday, MakeupDay } from './semester'
import { getSemesterConfig } from './semester'

let supabaseAvailable = true
let supabaseCheckDone = false

async function checkSupabaseAvailability(): Promise<boolean> {
  if (supabaseCheckDone) return supabaseAvailable
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const { error } = await supabase.from('semester_config').select('count', { count: 'exact', head: true }).abortSignal(controller.signal)
    clearTimeout(timeout)
    supabaseAvailable = !error
  } catch {
    supabaseAvailable = false
  }
  supabaseCheckDone = true
  return supabaseAvailable
}

function getDefaults() {
  const config = getSemesterConfig()
  return {
    semesterStart: config.semesterStart,
    teachingWeeks: config.teachingWeeks,
    examWeeks: config.examWeeks,
    holidays: config.holidays,
    makeupDays: config.makeupDays,
  }
}

export async function getSemesterConfigFromDB(): Promise<{
  semesterStart: string
  teachingWeeks: number
  examWeeks: number
  holidays: Holiday[]
  makeupDays: MakeupDay[]
}> {
  try {
    if (!await checkSupabaseAvailability()) return getDefaults()

    const { data } = await supabase.from('semester_config').select('key, value')

    if (!data || data.length === 0) {
      return getDefaults()
    }

    const map = new Map(data.map((r: { key: string; value: string }) => [r.key, r.value]))
    const defaults = getDefaults()

    return {
      semesterStart: map.get('semester_start') ?? defaults.semesterStart,
      teachingWeeks: parseInt(map.get('teaching_weeks') ?? String(defaults.teachingWeeks)),
      examWeeks: parseInt(map.get('exam_weeks') ?? String(defaults.examWeeks)),
      holidays: JSON.parse(map.get('holidays') ?? JSON.stringify(defaults.holidays)),
      makeupDays: JSON.parse(map.get('makeup_days') ?? JSON.stringify(defaults.makeupDays)),
    }
  } catch (e) {
    return getDefaults()
  }
}

export async function updateSemesterConfigToDB(config: {
  semesterStart?: string
  teachingWeeks?: number
  examWeeks?: number
  holidays?: Holiday[]
  makeupDays?: MakeupDay[]
}): Promise<boolean> {
  try {
    if (!await checkSupabaseAvailability()) return false
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
  } catch (e) {
    console.error('updateSemesterConfigToDB error:', e)
    return false
  }
}
