import { NextRequest, NextResponse } from 'next/server'
import type { WeatherCondition, UVLevel, AQILevelCN } from '@/lib/types'

const BASE = 'https://api.openweathermap.org'

/**
 * 服务端内存缓存 — 同坐标 15min TTL 内只请求一次上游 API。
 */
const cache = new Map<string, { data: unknown; ts: number }>()
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

// ── UV │ 合理区间校验 ────────────────────────────────────────
function mapUVLevel(index: number): UVLevel {
  // 免费 API 的 uvi 端点可能返回不可靠数据（如夜间 >10）
  // 实际臭氧层下 UV 指数极少超过 12（珠峰顶 ~16）
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
    // 免费 API 的 /uvi 端点不稳定，单独 try/catch
    let uvIndex = 0
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: controller.signal }),
    ])

    // UV 端点可能 404/401（免费 key 不开放），失败不阻塞
    try {
      const uvRes = await fetch(`${BASE}/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: controller.signal })
      if (uvRes.ok) {
        const uvJson = await uvRes.json()
        uvIndex = uvJson.value ?? 0
      }
    } catch {
      // UV 降级：用天气 ID 粗略估算
    }

    clearTimeout(timeout)

    if (!weatherRes.ok || !aqiRes.ok) {
      return NextResponse.json(
        { error: `Upstream error: weather=${weatherRes.status} aqi=${aqiRes.status}` },
        { status: 502 }
      )
    }

    const [weatherJson, aqiJson] = await Promise.all([
      weatherRes.json() as any,
      aqiRes.json() as any,
    ])

    // ── 天气 ──
    const weatherId: number = weatherJson.weather?.[0]?.id ?? 800

    // UV 降级：API 失败时根据天气 ID 估算
    // 800=晴→高, 801-804=多云→中, 5xx=雨→低, 其他→中
    if (uvIndex === 0) {
      if (weatherId === 800) uvIndex = 7
      else if (weatherId >= 801 && weatherId <= 804) uvIndex = 4
      else if (weatherId >= 500 && weatherId < 600) uvIndex = 1
      else uvIndex = 3
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
        tempMin: Math.round(weatherJson.main.temp_min),
        tempMax: Math.round(weatherJson.main.temp_max),
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
