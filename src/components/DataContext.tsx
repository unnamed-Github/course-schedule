'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Course, CourseSchedule, Assignment, Memo } from '@/lib/types'
import { getCourses, getSchedules, getAssignments, getMemos } from '@/lib/data'

interface DataContextType {
  courses: Course[]
  schedules: CourseSchedule[]
  assignments: Assignment[]
  memos: Memo[]
  loaded: boolean
  loadError: boolean
  reload: () => void
  reloadCourses: () => void
  reloadSchedules: () => void
  reloadAssignments: () => void
  reloadMemos: () => void
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  setSchedules: React.Dispatch<React.SetStateAction<CourseSchedule[]>>
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [schedules, setSchedules] = useState<CourseSchedule[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const mountedRef = useRef(false)

  const reload = useCallback(() => {
    setLoadError(false)
    Promise.all([getCourses(), getSchedules(), getAssignments(), getMemos()])
      .then(([c, sc, a, m]) => {
        setCourses(c)
        setSchedules(sc)
        setAssignments(a)
        setMemos(m)
        setLoaded(true)
      })
      .catch(() => {
        setLoadError(true)
        setLoaded(true)
      })
  }, [])

  const reloadCourses = useCallback(() => {
    getCourses().then(setCourses).catch(() => {})
  }, [])

  const reloadSchedules = useCallback(() => {
    getSchedules().then(setSchedules).catch(() => {})
  }, [])

  const reloadAssignments = useCallback(() => {
    getAssignments().then(setAssignments).catch(() => {})
  }, [])

  const reloadMemos = useCallback(() => {
    getMemos().then(setMemos).catch(() => {})
  }, [])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      reload()
    }
  }, [reload])

  useEffect(() => {
    const onDataChanged = () => reload()
    window.addEventListener('data-changed', onDataChanged)
    return () => window.removeEventListener('data-changed', onDataChanged)
  }, [reload])

  return (
    <DataContext.Provider value={{
      courses, schedules, assignments, memos,
      loaded, loadError,
      reload, reloadCourses, reloadSchedules, reloadAssignments, reloadMemos,
      setCourses, setSchedules, setAssignments, setMemos,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
