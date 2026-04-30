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

  useEffect(() => {
    try {
      const savedEnabled = getLocalSetting('warmthBannerEnabled', 'true')
      if (savedEnabled === 'false') {
        setIsEnabled(false)
      }

      const today = new Date().toISOString().slice(0, 10)
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
    const today = new Date().toISOString().slice(0, 10)
    setSettingBoth('warmthBannerHidden', today)
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
