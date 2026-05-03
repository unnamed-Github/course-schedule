"use client"

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeatherResponse, WeatherData, UVData, AQIData, WeatherCondition, UVLevel, AQILevelCN, WEATHER_CITIES } from '@/lib/types'
import { fetchWeatherData, getWeatherCity, getCachedCity, setCachedCity } from '@/lib/weather'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning,
  CloudFog, Droplets, Wind, ChevronDown,
} from 'lucide-react'

const WEATHER_ICONS: Record<WeatherCondition, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudDrizzle,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
  mist: CloudFog,
}

const WEATHER_COLORS: Record<WeatherCondition, { primary: string; glow: string; bg: string }> = {
  clear: { primary: '#F59E0B', glow: '#FBBF24', bg: '#FEF3C7' },
  clouds: { primary: '#94A3B8', glow: '#CBD5E1', bg: '#F1F5F9' },
  rain: { primary: '#3B82F6', glow: '#60A5FA', bg: '#DBEAFE' },
  drizzle: { primary: '#60A5FA', glow: '#93C5FD', bg: '#EFF6FF' },
  snow: { primary: '#BAE6FD', glow: '#E0F2FE', bg: '#F0F9FF' },
  thunderstorm: { primary: '#7C3AED', glow: '#8B5CF6', bg: '#EDE9FE' },
  mist: { primary: '#94A3B8', glow: '#CBD5E1', bg: '#F8FAFC' },
}

const UV_COLORS: Record<UVLevel, { color: string; glow: string; label: string }> = {
  low: { color: '#10B981', glow: '#34D399', label: '低' },
  moderate: { color: '#F59E0B', glow: '#FBBF24', label: '中等' },
  high: { color: '#F97316', glow: '#FB923C', label: '高' },
  veryHigh: { color: '#EF4444', glow: '#F87171', label: '很高' },
  extreme: { color: '#7C3AED', glow: '#8B5CF6', label: '极端' },
}

const AQI_COLORS: Record<AQILevelCN, { color: string; glow: string; label: string }> = {
  good: { color: '#10B981', glow: '#34D399', label: '优' },
  moderate: { color: '#84CC16', glow: '#A3E635', label: '良' },
  unhealthySensitive: { color: '#F97316', glow: '#FB923C', label: '轻度污染' },
  unhealthy: { color: '#EF4444', glow: '#F87171', label: '中度污染' },
  veryUnhealthy: { color: '#7C3AED', glow: '#8B5CF6', label: '重度污染' },
  hazardous: { color: '#991B1B', glow: '#DC2626', label: '严重污染' },
}

function WeatherParticles({ condition, color }: { condition: WeatherCondition; color: string }) {
  const count = condition === 'clear' ? 6 : condition === 'rain' || condition === 'drizzle' ? 8 : condition === 'snow' ? 10 : 0
  if (count === 0) return null

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      size: 2 + Math.random() * 4,
      duration: 2 + Math.random() * 3,
    })),
    [count]
  )

  if (condition === 'rain' || condition === 'drizzle') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full animate-rain-drop"
            style={{
              left: `${p.left}%`,
              top: '-4px',
              width: '2px',
              height: `${p.size + 6}px`,
              backgroundColor: color,
              opacity: 0.3,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (condition === 'snow') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full animate-snow-fall"
            style={{
              left: `${p.left}%`,
              top: '-4px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: '#E0F2FE',
              opacity: 0.6,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration + 2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${p.left}%`,
            top: `${20 + Math.random() * 60}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            opacity: 0.25,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration + 1}s`,
          }}
        />
      ))}
    </div>
  )
}

function UVProgressBar({ uv }: { uv: UVData }) {
  const colors = UV_COLORS[uv.level]
  const percent = Math.min(100, (uv.index / 11) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>紫外 UV</span>
        <motion.span
          className="text-sm font-bold"
          style={{ color: colors.color }}
          animate={{ textShadow: [`0 0 4px ${colors.glow}00`, `0 0 8px ${colors.glow}88`, `0 0 4px ${colors.glow}00`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {uv.index} <span className="text-[10px] font-medium">{colors.label}</span>
        </motion.span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-light)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: colors.color }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function AQIProgressBar({ aqi }: { aqi: AQIData }) {
  const colors = AQI_COLORS[aqi.level]
  const percent = Math.min(100, (aqi.aqi / 300) * 100)

  const aqiSegments = [
    { range: '0-50', color: AQI_COLORS.good.color },
    { range: '51-100', color: AQI_COLORS.moderate.color },
    { range: '101-150', color: AQI_COLORS.unhealthySensitive.color },
    { range: '151-200', color: AQI_COLORS.unhealthy.color },
    { range: '201-300', color: AQI_COLORS.veryUnhealthy.color },
    { range: '300+', color: AQI_COLORS.hazardous.color },
  ]

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>空气 AQI</span>
        <motion.span
          className="text-sm font-bold"
          style={{ color: colors.color }}
          animate={{ textShadow: aqi.level === 'good' ? 'none' : [`0 0 4px ${colors.glow}00`, `0 0 8px ${colors.glow}88`, `0 0 4px ${colors.glow}00`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {aqi.aqi} <span className="text-[10px] font-medium">{colors.label}</span>
        </motion.span>
      </div>
      <div className="h-2 rounded-full flex overflow-hidden" style={{ gap: '1px', backgroundColor: 'var(--border-light)' }}>
        {aqiSegments.map((seg) => (
          <div
            key={seg.range}
            className="flex-1 first:rounded-l-full last:rounded-r-full transition-opacity duration-500"
            style={{
              backgroundColor: seg.color,
              opacity: seg.color === colors.color ? 1 : 0.2,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
        <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300</span>
      </div>
    </div>
  )
}

export function WeatherBanner() {
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [cityName, setCityName] = useState(getCachedCity())

  const city = useMemo(() => getWeatherCity(), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchWeatherData(city.lat, city.lon)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    const interval = setInterval(() => {
      fetchWeatherData(city.lat, city.lon)
        .then((d) => { if (!cancelled) setData(d) })
        .catch(() => {})
    }, 30 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [city.lat, city.lon])

  const handleCityChange = (name: string) => {
    const found = WEATHER_CITIES.find((c) => c.name === name)
    if (!found) return
    setCityName(name)
    setCachedCity(name)
    setSettingBoth('weather_city', name)
    setLoading(true)
    setShowCityPicker(false)
    fetchWeatherData(found.lat, found.lon)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const displayCity = WEATHER_CITIES.find((c) => c.name === cityName)?.name ?? WEATHER_CITIES[0].name

  if (loading && !data) return null

  const w = data?.weather
  const uv = data?.uv
  const aqi = data?.aqi
  if (!w || !uv || !aqi) return null

  const weatherColors = WEATHER_COLORS[w.condition]
  const WeatherIcon = WEATHER_ICONS[w.condition]

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="rounded-2xl glass-strong overflow-hidden relative"
        style={{
          borderLeft: `3px solid ${weatherColors.primary}`,
        }}
      >
        <WeatherParticles condition={w.condition} color={weatherColors.primary} />

        <div className="px-4 py-3 relative z-10">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: weatherColors.primary }}>
              <WeatherIcon size={22} strokeWidth={1.8} />
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-lg font-bold">{w.temp}°</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {w.description} · 体感 {w.feelsLike}°
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Droplets size={10} strokeWidth={1.5} />{w.humidity}%
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Wind size={10} strokeWidth={1.5} />{w.windSpeed} m/s
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCityPicker(!showCityPicker)}
                className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 hover:bg-[var(--border-light)] transition-colors cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                {displayCity}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showCityPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 rounded-xl glass-strong p-1 min-w-[100px] z-20 shadow-lg"
                  >
                    {WEATHER_CITIES.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleCityChange(c.name)}
                        className="block w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--border-light)] transition-colors cursor-pointer"
                        style={{
                          color: c.name === cityName ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: c.name === cityName ? 600 : 400,
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <UVProgressBar uv={uv} />
            <AQIProgressBar aqi={aqi} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
