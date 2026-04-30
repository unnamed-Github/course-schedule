'use client'

import { useEffect, useState } from 'react'
import { getSemesterConfig, setSemesterCache, clearSemesterCache } from '@/lib/semester'
import { getSemesterConfigFromDB, updateSemesterConfigToDB } from '@/lib/semester-db'
import type { Holiday, MakeupDay, SemesterConfig } from '@/lib/semester'
import { useToast } from '@/components/ToastProvider'

export function useSemesterConfig() {
  const { showToast } = useToast()
  const [teachingWeeks, setTeachingWeeks] = useState(15)
  const [examWeeks, setExamWeeks] = useState(2)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [makeupDays, setMakeupDays] = useState<MakeupDay[]>([])
  const [editingHolidayIdx, setEditingHolidayIdx] = useState<number | null>(null)
  const [holidayForm, setHolidayForm] = useState<Holiday>({ name: '', start: '', end: '' })
  const [editingMakeupIdx, setEditingMakeupIdx] = useState<number | null>(null)
  const [makeupForm, setMakeupForm] = useState<MakeupDay>({ date: '', replacesDayOfWeek: 1, weekType: 'all' })

  const totalWeeks = teachingWeeks + examWeeks

  const loadConfig = () => {
    getSemesterConfigFromDB().then((config) => {
      setSemesterCache(config)
      setTeachingWeeks(config.teachingWeeks)
      setExamWeeks(config.examWeeks)
      setHolidays([...config.holidays])
      setMakeupDays([...config.makeupDays])
    })
  }

  const saveConfig = async (updates: Partial<SemesterConfig>) => {
    const config = getSemesterConfig()
    const newConfig = { ...config, ...updates }
    setSemesterCache(newConfig)
    const ok = await updateSemesterConfigToDB(newConfig)
    if (ok) {
      showToast('学期信息已保存', 'success')
    } else {
      showToast('保存失败，请检查网络', 'error')
    }
  }

  const saveHolidays = (newHolidays: Holiday[]) => {
    setHolidays(newHolidays)
    setEditingHolidayIdx(null)
    saveConfig({ holidays: newHolidays })
  }

  const saveMakeups = (newMakeups: MakeupDay[]) => {
    setMakeupDays(newMakeups)
    setEditingMakeupIdx(null)
    saveConfig({ makeupDays: newMakeups })
  }

  return {
    teachingWeeks, setTeachingWeeks,
    examWeeks, setExamWeeks,
    totalWeeks,
    holidays, setHolidays,
    makeupDays, setMakeupDays,
    editingHolidayIdx, setEditingHolidayIdx,
    holidayForm, setHolidayForm,
    editingMakeupIdx, setEditingMakeupIdx,
    makeupForm, setMakeupForm,
    loadConfig,
    saveConfig,
    saveHolidays,
    saveMakeups,
  }
}
