'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useView } from './ViewContext'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import CoursesPage from '@/app/courses/page'
import { AssignmentsView } from './AssignmentsView'
import { MemosView } from './MemosView'
import { WarmthBanner } from './WarmthBanner'
import { HealthChecklist } from './HealthChecklist'
import { LateNightCare } from './LateNightCare'
import { BreakTip } from './BreakTip'

export function MainView() {
  const { currentView } = useView()

  return (
    <div className="space-y-4">
      <LateNightCare />
      <WarmthBanner />
      <HealthChecklist />
      <BreakTip />

      <AnimatePresence mode="sync">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {currentView === 'week' && <WeekView />}
          {currentView === 'day' && <DayView />}
          {currentView === 'courses' && <CoursesPage />}
          {currentView === 'assignments' && <AssignmentsView />}
          {currentView === 'memos' && <MemosView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
