"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getLocalSetting, setSettingBoth } from '@/lib/user-settings'

interface WarmthBannerContextType {
  isEnabled: boolean
  isHiddenToday: boolean
  toggleEnabled: () => void
  hideToday: () => void
}

const WarmthBannerContext = createContext<WarmthBannerContextType | undefined>(undefined)

export function WarmthBannerProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isHiddenToday, setIsHiddenToday] = useState(false)

  const localDate = () => {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }

  useEffect(() => {
    try {
      const savedEnabled = getLocalSetting('warmthBannerEnabled', 'true')
      if (savedEnabled === 'false') {
        setIsEnabled(false)
      }

      const today = localDate()
      const hiddenDate = getLocalSetting('warmthBannerHidden', '')
      if (hiddenDate === today) {
        setIsHiddenToday(true)
      }
    } catch (e) {
      console.error('Failed to load warmth banner settings:', e)
    }
  }, [])

  const toggleEnabled = () => {
    const newValue = !isEnabled
    setIsEnabled(newValue)
    setSettingBoth('warmthBannerEnabled', newValue.toString())
  }

  const hideToday = () => {
    setIsHiddenToday(true)
    setSettingBoth('warmthBannerHidden', localDate())
  }

  return (
    <WarmthBannerContext.Provider value={{ isEnabled, isHiddenToday, toggleEnabled, hideToday }}>
      {children}
    </WarmthBannerContext.Provider>
  )
}

export function useWarmthBanner() {
  const context = useContext(WarmthBannerContext)
  if (!context) {
    throw new Error('useWarmthBanner must be used within a WarmthBannerProvider')
  }
  return context
}
