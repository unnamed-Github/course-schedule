"use client"

import { useCallback, useEffect, useState } from "react"
import { getLocalSetting, setSettingBoth } from "@/lib/user-settings"

export interface GlassSettings {
  enabled: boolean
  blur: number
  opacity: number
  saturation: number
}

export const GLASS_DEFAULTS = {
  glass_enabled: "true",
  glass_blur: "40",
  glass_opacity: "15",
  glass_saturation: "1.8",
}

/**
 * SSR 安全默认值 —— 硬编码常量，SSR 和客户端首帧完全相同。
 * 用户的真实偏好值在 useEffect 挂载后从 localStorage 读取并覆盖。
 */
const SSR_DEFAULTS: GlassSettings = {
  enabled: true,
  blur: 40,
  opacity: 15,
  saturation: 1.8,
}

function readSettings(): GlassSettings {
  return {
    enabled: getLocalSetting("glass_enabled", GLASS_DEFAULTS.glass_enabled) !== "false",
    blur: Number(getLocalSetting("glass_blur", GLASS_DEFAULTS.glass_blur)),
    opacity: Number(getLocalSetting("glass_opacity", GLASS_DEFAULTS.glass_opacity)),
    saturation: Number(getLocalSetting("glass_saturation", GLASS_DEFAULTS.glass_saturation)),
  }
}

export function useGlassSettings() {
  const [settings, setSettings] = useState<GlassSettings>(SSR_DEFAULTS)

  useEffect(() => {
    setSettings(readSettings())

    const onStorage = () => {
      setSettings(readSettings())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const updateSetting = useCallback((key: string, value: string) => {
    setSettingBoth(key, value)
    window.dispatchEvent(new Event("storage"))
  }, [])

  return { settings, updateSetting }
}
