'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Course, CourseSchedule } from '@/lib/types'
import { getWeekNumber, getSemesterConfig, isHoliday, getMakeupInfo } from '@/lib/semester'
import { Trophy } from 'lucide-react'

const CONFETTI_COLORS = ['#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#F97316']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  life: number
}

function getCourseCompletedWeeks(course: Course, schedules: CourseSchedule[]): number {
  const config = getSemesterConfig()
  const currentWeek = getWeekNumber()
  let totalSessions = 0
  let completedSessions = 0

  for (const s of schedules) {
    if (s.course_id !== course.id) continue
    for (let w = 1; w <= config.teachingWeeks; w++) {
      if (s.week_type === 'odd' && w % 2 === 0) continue
      if (s.week_type === 'even' && w % 2 !== 0) continue
      const { start } = (() => {
        const base = new Date(config.semesterStart)
        const dayOfWeek = base.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const weekStart = new Date(base)
        weekStart.setDate(base.getDate() - daysToMonday + (w - 1) * 7)
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + s.day_of_week - 1)
        return { start: date }
      })()
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      const isHol = config.holidays.some(h => dateStr >= h.start && dateStr <= h.end)
      if (isHol) continue
      totalSessions++
      if (w < currentWeek) completedSessions++
    }
  }

  return totalSessions > 0 && completedSessions >= totalSessions ? totalSessions : 0
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  const spawnParticles = useCallback(() => {
    const particles: Particle[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 14 - 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1,
      })
    }
    particlesRef.current = particles
  }, [])

  useEffect(() => {
    if (!active) return
    spawnParticles()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue
        alive = true
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3
        p.rotation += p.rotationSpeed
        p.life -= 0.012
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (alive) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [active, spawnParticles])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

export function CourseCompletionCelebration({ courses, schedules }: { courses: Course[]; schedules: CourseSchedule[] }) {
  const [celebrating, setCelebrating] = useState(false)
  const [courseName, setCourseName] = useState('')
  const checkedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem('celebrated_courses')
      if (stored) {
        const arr: string[] = JSON.parse(stored)
        arr.forEach(id => checkedRef.current.add(id))
      }
    } catch {}
  }, [])

  useEffect(() => {
    for (const course of courses) {
      if (checkedRef.current.has(course.id)) continue
      const completed = getCourseCompletedWeeks(course, schedules)
      if (completed > 0) {
        checkedRef.current.add(course.id)
        try {
          const arr = Array.from(checkedRef.current)
          localStorage.setItem('celebrated_courses', JSON.stringify(arr))
        } catch {}
        setCourseName(course.name)
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 3500)
        break
      }
    }
  }, [courses, schedules])

  return (
    <>
      <ConfettiCanvas active={celebrating} />
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none"
          >
            <div
              className="px-8 py-6 rounded-3xl text-center"
              style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)' }}
            >
              <p className="text-3xl mb-2" style={{ color: '#F59E0B' }}>
                <Trophy size={36} strokeWidth={1.5} className="inline" />
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                恭喜完成 {courseName}！
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                你做到了，真棒！
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
