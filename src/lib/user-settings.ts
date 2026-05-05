import { supabase } from './supabase'
import { checkSupabaseAvailability, isSupabaseAvailable } from './supabase-availability'

export const HEALTH_REMINDER_DEFAULTS = {
  water_reminder_enabled: 'true',
  water_interval: '40',
  kegel_reminder_enabled: 'true',
  kegel_times: '10:00,15:00,20:00',
  night_reminder_enabled: 'true',
  night_start: '23:30',
  silent_start: '00:30',
  silent_end: '08:00',
  ddl_reminder_enabled: 'true',
  ddl_reminder_defaults: '[]',
}

export function getHealthReminderSetting(key: string): string {
  return getLocalSetting(key, (HEALTH_REMINDER_DEFAULTS as Record<string, string>)[key] ?? '')
}

export async function getUserSetting(key: string): Promise<string | null> {
  if (!await checkSupabaseAvailability()) return null
  try {
    const { data } = await supabase.from('user_settings').select('value').eq('key', key).single()
    return data?.value ?? null
  } catch {
    return null
  }
}

export async function setUserSetting(key: string, value: string): Promise<boolean> {
  if (!await checkSupabaseAvailability()) return false
  try {
    const { error } = await supabase.from('user_settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) { return false }
    return true
  } catch {
    return false
  }
}

export function getLocalSetting(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

export function setLocalSetting(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

export async function deleteUserSetting(key: string) {
  if (!await checkSupabaseAvailability()) return
  try {
    await supabase.from('user_settings').delete().eq('key', key)
  } catch {
    // Do nothing
  }
}

export function setSettingBoth(key: string, value: string) {
  setLocalSetting(key, value)
  setUserSetting(key, value).catch(() => {})
}

export function removeSettingBoth(key: string) {
  try { localStorage.removeItem(key) } catch {}
  deleteUserSetting(key).catch(() => {})
}

export async function syncSettingsFromDB() {
  if (!await checkSupabaseAvailability()) return
  try {
    const { data } = await supabase.from('user_settings').select('key, value')
    if (!data) return
    for (const row of data) {
      setLocalSetting(row.key, row.value)
    }
  } catch {
    // Do nothing
  }
}
