import { NextRequest, NextResponse } from 'next/server'
import type { WeatherCondition, UVLevel, AQILevelCN } from '@/lib/types'

const BASE = 'https://api.openweathermap.org'

function mapCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return 'thunderstorm'
  if (id >= 300 && id < 400) return 'drizzle'
  if (id >= 500 && id < 600) return 'rain'
  if (id >= 600 && id < 700) return 'snow'
  if (id >= 700 && id < 800) return 'mist'
  if (id === 800) return 'clear'
  return 'clouds'
}

function mapUVLevel(index: number): UVLevel {
  if (index <= 2) return 'low'
  if (index <= 5) return 'moderate'
  if (index <= 7) return 'high'
  if (index <= 10) return 'veryHigh'
  return 'extreme'
}

function mapAQILevel(aqi: number): AQILevelCN {
  if (aqi <= 1) return 'good'
  if (aqi <= 2) return 'moderate'
  if (aqi <= 3) return 'unhealthySensitive'
  if (aqi <= 4) return 'unhealthy'
  return 'veryUnhealthy'
}

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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const [weatherRes, uvRes, aqiRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`, { signal: controller.signal }),
    ])
    clearTimeout(timeout)

    if (!weatherRes.ok || !uvRes.ok || !aqiRes.ok) {
      const statuses = [weatherRes.status, uvRes.status, aqiRes.status]
      return NextResponse.json({ error: `Upstream API error: ${statuses.join('/')}` }, { status: 502 })
    }

    const [weatherJson, uvJson, aqiJson] = await Promise.all([
      weatherRes.json(),
      uvRes.json(),
      aqiRes.json(),
    ])

    const weatherId = weatherJson.weather?.[0]?.id ?? 800
    const condition = mapCondition(weatherId)
    const uvIndex = uvJson.value ?? 0
    const aqiData = aqiJson.list?.[0]
    const aqiRaw = aqiData?.main?.aqi ?? 1
    const level = mapAQILevel(aqiRaw)

    const cnAqi = (() => {
      if (aqiRaw <= 1) return Math.round(aqiRaw * 50)
      if (aqiRaw <= 2) return Math.round(50 + (aqiRaw - 1) * 50)
      if (aqiRaw <= 3) return Math.round(100 + (aqiRaw - 2) * 50)
      if (aqiRaw <= 4) return Math.round(150 + (aqiRaw - 3) * 50)
      return Math.round(200 + (aqiRaw - 4) * 100)
    })()

    return NextResponse.json({
      weather: {
        temp: Math.round(weatherJson.main.temp),
        feelsLike: Math.round(weatherJson.main.feels_like),
        description: weatherJson.weather?.[0]?.description ?? '',
        icon: weatherJson.weather?.[0]?.icon ?? '01d',
        humidity: weatherJson.main.humidity,
        windSpeed: Math.round(weatherJson.wind?.speed ?? 0),
        condition,
      },
      uv: { index: uvIndex, level: mapUVLevel(uvIndex) },
      aqi: { aqi: cnAqi, pm25: Math.round(aqiData?.components?.pm2_5 ?? 0), pm10: Math.round(aqiData?.components?.pm10 ?? 0), level },
    })
  } catch {
    return NextResponse.json({ error: 'Weather fetch failed' }, { status: 502 })
  }
}
