import { supabase } from './supabase'

export async function getUserSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from('user_settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function setUserSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase.from('user_settings').upsert({ key, value }, { onConflict: 'key' })
  if (error) { console.error('setUserSetting error:', error); return false }
  return true
}

export function getLocalSetting(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

export function setLocalSetting(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}

export function setSettingBoth(key: string, value: string) {
  setLocalSetting(key, value)
  setUserSetting(key, value).catch(() => {})
}

export async function syncSettingsFromDB() {
  const { data } = await supabase.from('user_settings').select('key, value')
  if (!data) return
  for (const row of data) {
    setLocalSetting(row.key, row.value)
  }
}
