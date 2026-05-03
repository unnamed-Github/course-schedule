import { WeatherResponse, WEATHER_CITIES } from './types'
import { getLocalSetting, setLocalSetting } from './user-settings'

const CACHE_KEY = 'weather_cache'
const CACHE_TS_KEY = 'weather_cache_ts'
const CACHE_CITY_KEY = 'weather_city_name'
const CACHE_TTL = 30 * 60 * 1000

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
