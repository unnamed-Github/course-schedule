import { WeatherResponse, WEATHER_CITIES } from './types'
import { getLocalSetting, setLocalSetting } from './user-settings'

const CACHE_KEY = 'weather_cache_v7'
const CACHE_TS_KEY = 'weather_cache_ts_v7'
const CACHE_CITY_KEY = 'weather_city_name'
const CACHE_GEO_KEY = 'weather_use_geo'
const CACHE_TTL = 30 * 60 * 1000

export function requestGeoPosition(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
    )
  })
}

export function getUseGeo(): boolean {
  return getLocalSetting(CACHE_GEO_KEY, '') === 'true'
}

export function setUseGeo(enabled: boolean) {
  setLocalSetting(CACHE_GEO_KEY, enabled ? 'true' : 'false')
}

export function getWeatherCity(): { name: string; lat: number; lon: number } {
  const cityName = getLocalSetting('weather_city', '')
  if (cityName) {
    const found = WEATHER_CITIES.find((c) => c.name === cityName)
    if (found) return found
  }
  return WEATHER_CITIES[0]
}

export function getCachedCity(): string {
  return getLocalSetting(CACHE_CITY_KEY, WEATHER_CITIES[0].name)
}

export function setCachedCity(name: string) {
  setLocalSetting(CACHE_CITY_KEY, name)
}

export function getWeatherCache(): WeatherResponse | null {
  try {
    const ts = getLocalSetting(CACHE_TS_KEY, '0')
    if (Date.now() - parseInt(ts) > CACHE_TTL) return null
    const raw = getLocalSetting(CACHE_KEY, '')
    if (!raw) return null
    return JSON.parse(raw) as WeatherResponse
  } catch {
    return null
  }
}

export function setWeatherCache(data: WeatherResponse) {
  try {
    setLocalSetting(CACHE_KEY, JSON.stringify(data))
    setLocalSetting(CACHE_TS_KEY, String(Date.now()))
  } catch {}
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherResponse> {
  const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`[${res.status}] ${body.error || 'Weather fetch failed'}`)
  }
  const data: WeatherResponse = await res.json()
  return data
}
