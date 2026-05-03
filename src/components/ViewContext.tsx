'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type ViewType = 'week' | 'day' | 'courses' | 'assignments' | 'memos'

interface ViewContextType {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

const ViewContext = createContext<ViewContextType | undefined>(undefined)

export function ViewProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('day')

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView() {
  const context = useContext(ViewContext)
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }
  return context
}
