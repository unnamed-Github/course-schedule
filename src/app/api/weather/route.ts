import { NextRequest, NextResponse } from 'next/server'
import type { WeatherResponse, WeatherCondition, UVLevel, AQILevelCN } from '@/lib/types'

const API_KEY = process.env.OPENWEATHER_API_KEY
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

function mapAQI(aqi: number): { cnAqi: number; level: AQILevelCN } {
  if (aqi <= 1) return { cnAqi: Math.round(aqi * 50), level: 'good' }
  if (aqi <= 2) return { cnAqi: Math.round(50 + (aqi - 1) * 50), level: 'moderate' }
  if (aqi <= 3) return { cnAqi: Math.round(100 + (aqi - 2) * 50), level: 'unhealthySensitive' }
  if (aqi <= 4) return { cnAqi: Math.round(150 + (aqi - 3) * 50), level: 'unhealthy' }
  return { cnAqi: Math.round(200 + (aqi - 4) * 100), level: 'veryUnhealthy' }
}

function mockWeather(lat: number, lon: number): WeatherResponse {
  const seed = Math.round(lat * 100 + lon * 100)
  const conditions: WeatherCondition[] = ['clear', 'clouds', 'rain', 'drizzle', 'mist', 'snow', 'thunderstorm']
  const condition = conditions[seed % conditions.length]
  return {
    weather: {
      temp: 18 + (seed % 15),
      feelsLike: 16 + (seed % 14),
      description: { clear: '晴', clouds: '多云', rain: '雨', drizzle: '小雨', mist: '雾', snow: '雪', thunderstorm: '雷暴' }[condition]!,
      icon: { clear: '01d', clouds: '03d', rain: '10d', drizzle: '09d', mist: '50d', snow: '13d', thunderstorm: '11d' }[condition]!,
      humidity: 40 + (seed % 40),
      windSpeed: 1 + (seed % 8),
      condition,
    },
    uv: {
      index: seed % 12,
      level: mapUVLevel(seed % 12),
    },
    aqi: {
      aqi: 30 + (seed % 120),
      pm25: 15 + (seed % 50),
      pm10: 30 + (seed % 60),
      level: mapAQI(Math.ceil((30 + (seed % 120)) / 50)).level,
    },
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json(mockWeather(parseFloat(lat), parseFloat(lon)))
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const [weatherRes, uvRes, aqiRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_cn`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`, { signal: controller.signal }),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`, { signal: controller.signal }),
    ])

    clearTimeout(timeout)

    if (!weatherRes.ok || !uvRes.ok || !aqiRes.ok) {
      return NextResponse.json(mockWeather(parseFloat(lat), parseFloat(lon)))
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
    const { cnAqi, level } = mapAQI(aqiRaw)

    const result: WeatherResponse = {
      weather: {
        temp: Math.round(weatherJson.main.temp),
        feelsLike: Math.round(weatherJson.main.feels_like),
        description: weatherJson.weather?.[0]?.description ?? '',
        icon: weatherJson.weather?.[0]?.icon ?? '01d',
        humidity: weatherJson.main.humidity,
        windSpeed: Math.round(weatherJson.wind?.speed ?? 0),
        condition,
      },
      uv: {
        index: uvIndex,
        level: mapUVLevel(uvIndex),
      },
      aqi: {
        aqi: cnAqi,
        pm25: Math.round(aqiData?.components?.pm2_5 ?? 0),
        pm10: Math.round(aqiData?.components?.pm10 ?? 0),
        level,
      },
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(mockWeather(parseFloat(lat), parseFloat(lon)))
  }
}
