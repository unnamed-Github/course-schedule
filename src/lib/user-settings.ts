import { supabase } from './supabase'

let supabaseAvailable = true
let supabaseCheckDone = false

async function checkSupabaseAvailability(): Promise<boolean> {
  if (supabaseCheckDone) return supabaseAvailable
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const { error } = await supabase.from('user_settings').select('count', { count: 'exact', head: true }).abortSignal(controller.signal)
    clearTimeout(timeout)
    supabaseAvailable = !error
  } catch {
    supabaseAvailable = false
  }
  supabaseCheckDone = true
  return supabaseAvailable
}

export async function getUserSetting(key: string): Promise<string | null> {
  if (!await checkSupabaseAvailability()) return null
  const { data } = await supabase.from('user_settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function setUserSetting(key: string, value: string): Promise<boolean> {
  if (!await checkSupabaseAvailability()) return false
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

export async function deleteUserSetting(key: string) {
  if (!await checkSupabaseAvailability()) return
  const { error } = await supabase.from('user_settings').delete().eq('key', key)
  if (error) console.error('deleteUserSetting error:', error)
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
  const { data } = await supabase.from('user_settings').select('key, value')
  if (!data) return
  for (const row of data) {
    setLocalSetting(row.key, row.value)
  }
}
