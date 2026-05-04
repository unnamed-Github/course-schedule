'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useView } from './ViewContext'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import CoursesPage from '@/app/courses/page'
import { AssignmentsView } from './AssignmentsView'
import { MemosView } from './MemosView'

export function MainView() {
  const { currentView } = useView()

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 0.61, 0.36, 1],
          }}
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
