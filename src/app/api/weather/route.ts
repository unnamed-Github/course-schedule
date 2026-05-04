import { NextRequest, NextResponse } from 'next/server'
import type { WeatherCondition, UVLevel, AQILevelCN, WeatherData } from '@/lib/types'

const BASE = 'https://api.openweathermap.org'

interface OWMWeatherResponse {
  weather?: { id: number; description: string; icon: string }[]
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; humidity: number }
  wind?: { speed: number }
  clouds?: { all: number }
  dt: number
}

interface OWMAQIResponse {
  list?: { components: { pm2_5: number; pm10: number } }[]
}

interface OWMForecastItem {
  dt_txt: string
  main: { temp: number; temp_min: number; temp_max: number; feels_like: number; humidity: number }
  weather: { id: number; description: string; icon: string }[]
  wind: { speed: number }
}

interface OWMForecastResponse {
  list: OWMForecastItem[]
}

interface WeatherAPIResult {
  weather: {
    temp: number
    feelsLike: number
    tempMin: number
    tempMax: number
    description: string
    icon: string
    humidity: number
    windSpeed: number
    condition: WeatherCondition
  }
  uv: { index: number; level: UVLevel }
  aqi: { aqi: number; pm25: number; pm10: number; level: AQILevelCN }
}

/**
 * 服务端内存缓存 — 同坐标 15min TTL 内只请求一次上游 API。
 */
const cache = new Map<string, { data: WeatherAPIResult; ts: number }>()
const CACHE_TTL = 15 * 60 * 1000

// ── 天气 │ 条件映射 ──────────────────────────────────────────
function mapCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'thunderstorm'
  if (id >= 300 && id < 400) return 'drizzle'
  if (id >= 500 && id < 600) return 'rain'
  if (id >= 600 && id < 700) return 'snow'
  if (id >= 700 && id < 800) return 'mist'
  if (id === 800) return 'clear'
  return 'clouds'
}

// ── UV │ 太阳几何估算 ────────────────────────────────────────

/**
 * 基于云量、纬度、时间的 UV 指数估算。
 * 免费 API 的 /uvi 端点不开放，用此函数替代。
 * 
 * @param lat   纬度（度）
 * @param clouds 云覆盖率 0-100（来自 weather.clouds.all）
 * @param dt     Unix 时间戳（秒，来自 weather.dt）
 * @returns      估算 UV 指数（0-14+）
 */
function estimateUVI(lat: number, clouds: number, dt: number): number {
  const date = new Date(dt * 1000)
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 0)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)

  // 太阳赤纬（度）
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180)

  // 时角（度）— 相对太阳正午
  const hoursLocal = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getTimezoneOffset() / -60
  const hourAngle = (hoursLocal - 12) * 15

  // 太阳仰角（度）
  const latRad = (lat * Math.PI) / 180
  const decRad = (declination * Math.PI) / 180
  const haRad  = (hourAngle * Math.PI) / 180
  const sinElev = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElev))) * (180 / Math.PI)

  if (elevation < 0) return 0

  // 晴空 UV：12 × sin(θ)^1.3（海平面经验公式）
  const clearSkyUVI = 12 * Math.pow(Math.sin((elevation * Math.PI) / 180), 1.3)

  // 云衰减：每 10% 云量降低约 7.5% UV
  const cloudFactor = 1 - 0.75 * (clouds / 100)

  return Math.round(Math.max(0, clearSkyUVI * cloudFactor) * 10) / 10
}

function mapUVLevel(index: number): UVLevel {
  const clamped = Math.max(0, Math.min(index, 14))
  if (clamped <= 2) return 'low'
  if (clamped <= 5) return 'moderate'
  if (clamped <= 7) return 'high'
  if (clamped <= 10) return 'veryHigh'
  return 'extreme'
}

// ── AQI │ 中国标准 IAQI 计算 ─────────────────────────────────

/**
 * 污染物 IAQI 分指数线性内插。
 * 
 * 中国 HJ 633-2012 标准，24 小时均值断点。
 * breakpoints: [C_low, C_high] → [IAQI_low, IAQI_high]
 */
function calcIAQI(
  conc: number,
  bp: [number, number, number, number][]
): number {
  for (const [cLo, cHi, iLo, iHi] of bp) {
    if (conc >= cLo && conc <= cHi) {
      return Math.round(iLo + ((conc - cLo) / (cHi - cLo)) * (iHi - iLo))
    }
    if (conc < cLo) return iLo
  }
  return bp[bp.length - 1][3]
}

/** 由 IAQI 值映射到中文字面等级 */
function cnAqiLevel(cnAqi: number): AQILevelCN {
  if (cnAqi <= 50) return 'good'
  if (cnAqi <= 100) return 'moderate'
  if (cnAqi <= 150) return 'unhealthySensitive'
  if (cnAqi <= 200) return 'unhealthy'
  if (cnAqi <= 300) return 'veryUnhealthy'
  return 'hazardous'
}

// ── 主路由 ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY || '8f1f7a0e4cb149dadd61c36c20167eef'
  if (apiKey === 'your_key_here') {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 })
  }

  const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lon).toFixed(3)}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const headers = new Headers()
    headers.set('X-Cache', 'HIT')
    headers.set('Cache-Control', `public, max-age=${Math.floor(CACHE_TTL / 1000)}`)
    return NextResponse.json(cached.data, { headers })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const [weatherRes, aqiRes, forecastRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn&cnt=16`, { signal: controller.signal }),
    ])

    clearTimeout(timeout)

    if (!weatherRes.ok || !aqiRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: weather=${weatherRes.status} aqi=${aqiRes.status}` },
        { status: 502 }
      )
    }

    const [weatherJson, aqiJson, forecastJson] = await Promise.all([
      weatherRes.json() as Promise<OWMWeatherResponse>,
      aqiRes.json() as Promise<OWMAQIResponse>,
      forecastRes.ok ? forecastRes.json() as Promise<OWMForecastResponse> : Promise.resolve(null),
    ])

    // ── 天气 ──
    const weatherId: number = weatherJson.weather?.[0]?.id ?? 800

    // UV 指数基于太阳几何 + 云量估算（免费 API 不开放 /uvi 端点）
    const latNum = parseFloat(lat)
    const clouds: number = weatherJson.clouds?.all ?? 0
    const dt: number = weatherJson.dt ?? Math.floor(Date.now() / 1000)
    const uvIndex = estimateUVI(latNum, clouds, dt)

    // 今日真实高低温：从 3h forecast 中提取今天所有时段的 min/max
    let todayLo = Math.round(weatherJson.main.temp_min)
    let todayHi = Math.round(weatherJson.main.temp_max)
    let tomorrowWeather: WeatherData | undefined
    if (forecastJson?.list?.length) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const todayTemps = forecastJson.list
        .filter((item) => item.dt_txt.startsWith(todayStr))
        .flatMap((item) => [item.main.temp_min, item.main.temp_max])
      if (todayTemps.length > 0) {
        todayLo = Math.round(Math.min(...todayTemps))
        todayHi = Math.round(Math.max(...todayTemps))
      }

      // 明天预报：取明天所有时段
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().slice(0, 10)
      const tomorrowItems = forecastJson.list.filter((item) =>
        item.dt_txt.startsWith(tomorrowStr)
      )
      if (tomorrowItems.length > 0) {
        const midIdx = Math.floor(tomorrowItems.length / 2)
        const midItem = tomorrowItems[midIdx]
        const tomorrowTemps = tomorrowItems.flatMap((item) => [item.main.temp_min, item.main.temp_max])
        tomorrowWeather = {
          temp: Math.round(midItem.main.temp),
          feelsLike: Math.round(midItem.main.feels_like),
          tempMin: Math.round(Math.min(...tomorrowTemps)),
          tempMax: Math.round(Math.max(...tomorrowTemps)),
          description: midItem.weather[0].description,
          icon: midItem.weather[0].icon,
          humidity: midItem.main.humidity,
          windSpeed: Math.round(midItem.wind.speed),
          condition: mapCondition(midItem.weather[0].id)
        }
      }
    }

    // ── AQI 中国标准计算 ──
    const aqiData = aqiJson.list?.[0]
    const pm25: number = aqiData?.components?.pm2_5 ?? 0
    const pm10: number = aqiData?.components?.pm10 ?? 0

    // HJ 633-2012 24h 均值断点
    const PM25_BP: [number, number, number, number][] = [
      [0, 35, 0, 50],
      [35, 75, 50, 100],
      [75, 115, 100, 150],
      [115, 150, 150, 200],
      [150, 250, 200, 300],
      [250, 350, 300, 400],
      [350, 500, 400, 500],
    ]
    const PM10_BP: [number, number, number, number][] = [
      [0, 50, 0, 50],
      [50, 150, 50, 100],
      [150, 250, 100, 150],
      [250, 350, 150, 200],
      [350, 420, 200, 300],
      [420, 500, 300, 400],
      [500, 600, 400, 500],
    ]

    const iaqi25 = calcIAQI(pm25, PM25_BP)
    const iaqi10 = calcIAQI(pm10, PM10_BP)
    const cnAqi = Math.max(iaqi25, iaqi10)

    const result = {
      weather: {
        temp: Math.round(weatherJson.main.temp),
        feelsLike: Math.round(weatherJson.main.feels_like),
        tempMin: todayLo,
        tempMax: todayHi,
        description: weatherJson.weather?.[0]?.description ?? '',
        icon: weatherJson.weather?.[0]?.icon ?? '01d',
        humidity: weatherJson.main.humidity,
        windSpeed: Math.round(weatherJson.wind?.speed ?? 0),
        condition: mapCondition(weatherId),
      },
      uv: { index: uvIndex, level: mapUVLevel(uvIndex) },
      aqi: {
        aqi: cnAqi,
        pm25: Math.round(pm25),
        pm10: Math.round(pm10),
        level: cnAqiLevel(cnAqi),
      },
      tomorrow: tomorrowWeather,
    }

    cache.set(cacheKey, { data: result, ts: Date.now() })

    const headers = new Headers()
    headers.set('X-Cache', 'MISS')
    headers.set('Cache-Control', `public, max-age=${Math.floor(CACHE_TTL / 1000)}`)
    return NextResponse.json(result, { headers })
  } catch {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 502 })
  }
}
