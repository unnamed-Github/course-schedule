"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { setSettingBoth, syncSettingsFromDB } from "@/lib/user-settings"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)
  const userToggledRef = useRef(false)

  useEffect(() => {
    const stored = safeGet("theme") as Theme | null
    const initial = stored ?? getSystemTheme()
    setTheme(initial)
    userToggledRef.current = !!stored
    setMounted(true)
    syncSettingsFromDB().then(() => {
      const synced = safeGet("theme") as Theme | null
      if (synced && synced !== initial) {
        setTheme(synced)
        userToggledRef.current = true
      }
    })
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (!userToggledRef.current) {
        setTheme(mediaQuery.matches ? "dark" : "light")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    if (userToggledRef.current) {
      setSettingBoth("theme", theme)
    }
  }, [theme, mounted])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light"
      userToggledRef.current = true
      setSettingBoth("theme", next)
      return next
    })
  }, [])

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
