"use client"

import { useEffect, useState } from "react"
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

export function useGlassSettings() {
  const [settings, setSettings] = useState<GlassSettings>(() => ({
    enabled: getLocalSetting("glass_enabled", GLASS_DEFAULTS.glass_enabled) !== "false",
    blur: Number(getLocalSetting("glass_blur", GLASS_DEFAULTS.glass_blur)),
    opacity: Number(getLocalSetting("glass_opacity", GLASS_DEFAULTS.glass_opacity)),
    saturation: Number(getLocalSetting("glass_saturation", GLASS_DEFAULTS.glass_saturation)),
  }))

  useEffect(() => {
    const onStorage = () => {
      setSettings({
        enabled: getLocalSetting("glass_enabled", GLASS_DEFAULTS.glass_enabled) !== "false",
        blur: Number(getLocalSetting("glass_blur", GLASS_DEFAULTS.glass_blur)),
        opacity: Number(getLocalSetting("glass_opacity", GLASS_DEFAULTS.glass_opacity)),
        saturation: Number(getLocalSetting("glass_saturation", GLASS_DEFAULTS.glass_saturation)),
      })
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const updateSetting = (key: string, value: string) => {
    setSettingBoth(key, value)
    window.dispatchEvent(new Event("storage"))
  }

  return { settings, updateSetting }
}
