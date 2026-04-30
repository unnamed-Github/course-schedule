"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getLocalSetting, setSettingBoth, syncSettingsFromDB } from "@/lib/user-settings"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = safeGet("theme") as Theme | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = stored ?? (prefersDark ? "dark" : "light")
    setTheme(initial)
    setMounted(true)
    syncSettingsFromDB().then(() => {
      const synced = safeGet("theme") as Theme | null
      if (synced && synced !== initial) setTheme(synced)
    })
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setSettingBoth("theme", theme)
  }, [theme, mounted])

  const toggle = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), [])

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
