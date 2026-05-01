import { supabase } from './supabase'

let supabaseAvailable = true
let supabaseCheckDone = false
let checkPromise: Promise<boolean> | null = null

export async function checkSupabaseAvailability(): Promise<boolean> {
  if (supabaseCheckDone) return supabaseAvailable
  if (checkPromise) return checkPromise

  checkPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const { error } = await supabase
        .from('semester_config')
        .select('count', { count: 'exact', head: true })
        .abortSignal(controller.signal)
      clearTimeout(timeout)
      supabaseAvailable = !error
    } catch {
      supabaseAvailable = false
    }
    supabaseCheckDone = true
    checkPromise = null
    return supabaseAvailable
  })()

  return checkPromise
}

export function markSupabaseUnavailable() {
  supabaseAvailable = false
  supabaseCheckDone = true
  checkPromise = null
}

export function isSupabaseAvailable(): boolean {
  if (!supabaseCheckDone) return true
  return supabaseAvailable
}
