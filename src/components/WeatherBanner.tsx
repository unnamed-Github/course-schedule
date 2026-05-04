"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WeatherResponse, WeatherData, UVData, AQIData, WeatherCondition, UVLevel, AQILevelCN, WEATHER_CITIES } from '@/lib/types'
import { fetchWeatherData, getWeatherCity, getCachedCity, setCachedCity, getWeatherCache, setWeatherCache, requestGeoPosition, getUseGeo, setUseGeo } from '@/lib/weather'
import { setSettingBoth } from '@/lib/user-settings'
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, CloudLightning,
  CloudFog, Droplets, Wind, ChevronDown, AlertCircle, Key, RefreshCw, MapPin,
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

  const particles = useMemo(() => {
    if (count === 0) return []
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      size: 2 + Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }))
  }, [count])

  if (count === 0) return null

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
  const aqiSegments = [
    { color: AQI_COLORS.good.color },
    { color: AQI_COLORS.moderate.color },
    { color: AQI_COLORS.unhealthySensitive.color },
    { color: AQI_COLORS.unhealthy.color },
    { color: AQI_COLORS.veryUnhealthy.color },
    { color: AQI_COLORS.hazardous.color },
  ]

  const shouldPulse = aqi.level !== 'good'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>空气 AQI</span>
        <motion.span
          className="text-sm font-bold"
          style={{ color: colors.color }}
          animate={shouldPulse ? { textShadow: [`0 0 4px ${colors.glow}00`, `0 0 8px ${colors.glow}88`, `0 0 4px ${colors.glow}00`] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {aqi.aqi} <span className="text-[10px] font-medium">{colors.label}</span>
        </motion.span>
      </div>
      <div className="h-2 rounded-full flex overflow-hidden" style={{ gap: '1px', backgroundColor: 'var(--border-light)' }}>
        {aqiSegments.map((seg, i) => (
          <div
            key={i}
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

function WeatherContent({ data }: { data: WeatherResponse }) {
  const w = data.weather
  const uv = data.uv
  const aqi = data.aqi
  const tomorrow = data.tomorrow
  const weatherColors = WEATHER_COLORS[w.condition]
  const WeatherIcon = WEATHER_ICONS[w.condition]
  const range = w.tempMax - w.tempMin

  const now = new Date()
  const isAfter9pm = now.getHours() >= 21
  const tomorrowWeatherColors = tomorrow ? WEATHER_COLORS[tomorrow.condition] : null
  const TomorrowIcon = tomorrow ? WEATHER_ICONS[tomorrow.condition] : null

  const comfortAdvice = (() => {
    const hi = w.tempMax
    const lo = w.tempMin
    const h = w.humidity
    const uvHigh = uv.index >= 6
    const parts: string[] = []

    // 防晒帽
    if (uvHigh) {
      parts.push('🧢 紫外线强，戴帽子防晒')
    } else if (hi >= 28 && w.condition === 'clear') {
      parts.push('🧢 大晴天，戴个帽子舒服些')
    } else if (uv.index >= 3) {
      parts.push('建议戴帽子防晒')
    }

    // 皮肤衣（早晚凉需要）
    if (lo <= 10) {
      parts.push('🧥 早晚冷，带件薄外套（皮肤衣不够）')
    } else if (lo <= 14) {
      parts.push('🧥 早晚凉，带件皮肤衣')
    } else if (range >= 10 && lo <= 18) {
      parts.push('早晚有温差，备件皮肤衣')
    }

    // 闷热/雨天提示
    if (h >= 70 && hi >= 28) {
      parts.push('💦 闷热潮湿，穿速干 T 恤')
    }
    if (w.condition === 'rain' || w.condition === 'drizzle') {
      parts.push('☔ 记得带伞')
    } else if (w.condition === 'thunderstorm') {
      parts.push('⚡ 雷暴天气，减少外出')
    } else if (uv.index >= 6 && (w.condition === 'clear' || w.condition === 'clouds')) {
      parts.push('☀️ 紫外线强，建议带伞遮阳')
    }

    // 极热
    if (hi >= 35) {
      parts.push('🥵 酷热，多喝水，尽量减少暴晒')
    }

    if (parts.length === 0) {
      parts.push('短袖就行，舒舒服服')
    }

    return parts
  })()

  return (
    <div className="rounded-2xl glass-strong overflow-hidden relative"
      style={{ borderLeft: `3px solid ${weatherColors.primary}` }}
    >
      <WeatherParticles condition={w.condition} color={weatherColors.primary} />

      <div className="px-4 py-3 relative z-10">
        {/* 第一行：天气图标 + 今日温度区间 + 描述 */}
        <div className="flex items-center gap-3">
          <span style={{ color: weatherColors.primary }}>
            <WeatherIcon size={26} strokeWidth={1.5} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-medium" style={{ color: 'var(--accent-info)' }}>最低</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{w.tempMin}°</span>
              </div>
              <span className="text-lg" style={{ color: 'var(--border-strong)' }}>/</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-medium" style={{ color: 'var(--accent-warm)' }}>最高</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{w.tempMax}°</span>
              </div>
              <span className="text-sm font-medium px-2 py-0.5 rounded" style={{
                backgroundColor: weatherColors.glow + '20',
                color: weatherColors.primary,
              }}>
                {w.description}
              </span>
            </div>
          </div>
        </div>

        {/* 第二行：体感 / 湿度 / 风力 */}
        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <span style={{ color: 'var(--text-tertiary)' }}>体感</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{w.feelsLike}°</span>
          </span>
          <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>|</span>
          <span className="flex items-center gap-1">
            <Droplets size={12} strokeWidth={1.5} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{w.humidity}%</span>
          </span>
          <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>|</span>
          <span className="flex items-center gap-1">
            <Wind size={12} strokeWidth={1.5} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{w.windSpeed} m/s</span>
          </span>
          {range >= 10 && (
            <>
              <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>|</span>
              <span className="flex items-center gap-1" style={{ color: 'var(--accent-warm)' }}>
                <span>↕</span>温差{range}°
              </span>
            </>
          )}
        </div>

        {/* 第三行：穿啥建议 */}
         <div className="mt-2 text-xs leading-relaxed space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
           {comfortAdvice.map((tip, i) => (
             <div key={i}>{tip}</div>
           ))}
         </div>

        {/* 第四行：UV + AQI 双栏 */}
        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <UVProgressBar uv={uv} />
          <AQIProgressBar aqi={aqi} />
        </div>

        {/* 第五行：明天预报（仅晚上9点后显示）*/}
        {isAfter9pm && tomorrow && TomorrowIcon && tomorrowWeatherColors && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                  backgroundColor: 'var(--border-light)',
                  color: 'var(--text-secondary)',
                }}>
                  明天
                </span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: tomorrowWeatherColors.primary }}>
                <TomorrowIcon size={18} strokeWidth={1.5} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--accent-info)' }}>最低</span>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tomorrow.tempMin}°</span>
              </div>
              <span style={{ color: 'var(--border-strong)' }}>/</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--accent-warm)' }}>最高</span>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tomorrow.tempMax}°</span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded ml-2" style={{
                backgroundColor: tomorrowWeatherColors.glow + '20',
                color: tomorrowWeatherColors.primary,
              }}>
                {tomorrow.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NoAPIKeyBanner() {
  return (
    <div className="rounded-2xl glass-strong p-4 flex items-start gap-3"
      style={{ borderLeft: '3px solid var(--accent-warm)' }}
    >
      <Key size={18} strokeWidth={1.8} style={{ color: 'var(--accent-warm)', flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>需要配置天气 API Key</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          前往 <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted" style={{ color: 'var(--accent-primary)' }}>openweathermap.org</a> 注册免费账号获取 API Key，然后添加到 <code className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--border-light)' }}>.env.local</code>：
        </p>
        <code className="block mt-2 text-[10px] p-2 rounded-lg font-mono break-all" style={{ backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
          OPENWEATHER_API_KEY=your_key_here
        </code>
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl glass-strong p-4 flex items-center gap-3"
      style={{ borderLeft: '3px solid var(--accent-danger)' }}
    >
      <AlertCircle size={18} strokeWidth={1.8} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>天气数据获取失败</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer text-white hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        <RefreshCw size={12} />
        重试
      </button>
    </div>
  )
}

export function WeatherBanner() {
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noApiKey, setNoApiKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLon, setGeoLon] = useState<number | null>(null)
  const [useGeo, setUseGeoState] = useState(getUseGeo())
  const [cityName, setCityName] = useState(() => {
    if (getUseGeo()) return '__geo__'
    return getCachedCity()
  })

  const geoRef = useRef({ lat: 0, lon: 0, settled: false })

  const city = useMemo(() => getWeatherCity(), [])

  const loadData = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    setNoApiKey(false)

    try {
      const cached = getWeatherCache()
      if (cached) setData(cached)

      const d = await fetchWeatherData(lat, lon)
      setData(d)
      setWeatherCache(d)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.includes('503') || msg.includes('not configured')) {
        setNoApiKey(true)
        setData(null)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (useGeo) {
        const pos = await requestGeoPosition()
        if (cancelled) return
        if (pos) {
          if (geoRef.current.settled &&
              geoRef.current.lat === pos.lat &&
              geoRef.current.lon === pos.lon) {
            return
          }
          geoRef.current = { lat: pos.lat, lon: pos.lon, settled: true }
          setGeoLat(pos.lat)
          setGeoLon(pos.lon)
          loadData(pos.lat, pos.lon)
          return
        }
      }
      if (!cancelled && !useGeo) {
        loadData(city.lat, city.lon)
      }
    }

    init()

    const interval = setInterval(() => {
      if (useGeo && geoRef.current.settled) {
        loadData(geoRef.current.lat, geoRef.current.lon)
      } else if (!useGeo) {
        loadData(city.lat, city.lon)
      }
    }, 60 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [useGeo, city.lat, city.lon, loadData])

  const handleGeoRequest = async () => {
    const pos = await requestGeoPosition()
    if (pos) {
      setUseGeo(true)
      setUseGeoState(true)
      setGeoLat(pos.lat)
      setGeoLon(pos.lon)
      setCityName('__geo__')
      setShowCityPicker(false)
      loadData(pos.lat, pos.lon)
    }
  }

  const handleCityChange = (name: string) => {
    const found = WEATHER_CITIES.find((c) => c.name === name)
    if (!found) return
    setUseGeo(false)
    setUseGeoState(false)
    setGeoLat(null)
    setGeoLon(null)
    setCityName(name)
    setCachedCity(name)
    setSettingBoth('weather_city', name)
    setShowCityPicker(false)
    loadData(found.lat, found.lon)
  }

  const displayLabel = useGeo ? '当前位置' : (WEATHER_CITIES.find((c) => c.name === cityName)?.name ?? WEATHER_CITIES[0].name)

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="relative">
        {loading && !data && !noApiKey && !error && (
          <div className="rounded-2xl glass-strong p-4">
            <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--border-light)' }} />
          </div>
        )}

        {noApiKey && <NoAPIKeyBanner />}
        {error && !noApiKey && <ErrorBanner message={error} onRetry={() => {
          if (useGeo && geoLat !== null && geoLon !== null) loadData(geoLat, geoLon)
          else loadData(city.lat, city.lon)
        }} />}
        {data && !noApiKey && !error && <WeatherContent data={data} />}

        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 cursor-pointer transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {useGeo && <MapPin size={10} />}
            {displayLabel}
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showCityPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 rounded-xl glass-strong p-1 min-w-[120px] shadow-lg"
              >
                <button
                  onClick={handleGeoRequest}
                  className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--border-light)] transition-colors cursor-pointer"
                  style={{
                    color: useGeo ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: useGeo ? 600 : 400,
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <MapPin size={10} />
                  使用当前位置
                </button>
                {WEATHER_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleCityChange(c.name)}
                    className="block w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--border-light)] transition-colors cursor-pointer"
                    style={{
                      color: !useGeo && c.name === cityName ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: !useGeo && c.name === cityName ? 600 : 400,
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
    </motion.div>
  )
}
