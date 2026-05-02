'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GOLD_COLORS = ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520', '#F5DEB3', '#E8B923']

interface GoldParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  life: number
  shape: 'rect' | 'circle'
}

function GoldConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<GoldParticle[]>([])
  const animRef = useRef<number>(0)

  const spawnParticles = useCallback(() => {
    const particles: GoldParticle[] = []
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10 - 3,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        size: Math.random() * 7 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        life: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
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
        p.vy += 0.25
        p.vx *= 0.99
        p.rotation += p.rotationSpeed
        p.life -= 0.015
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
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

export function useClassFinish(
  currentCourseInfo: { course: { name: string }; schedule: { id: string }; progress: number } | null
) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false)
  const [courseName, setCourseName] = useState('')
  const prevProgressRef = useRef<number>(0)
  const celebratedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem('class_finished_celebrated')
      if (stored) {
        const arr: string[] = JSON.parse(stored)
        arr.forEach(id => celebratedRef.current.add(id))
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!currentCourseInfo) {
      prevProgressRef.current = 0
      return
    }

    const { progress, schedule, course } = currentCourseInfo
    const today = new Date()
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const celebKey = `${dateKey}_${schedule.id}`

    if (
      prevProgressRef.current > 0 &&
      prevProgressRef.current < 100 &&
      progress >= 100 &&
      !celebratedRef.current.has(celebKey)
    ) {
      celebratedRef.current.add(celebKey)
      try {
        const arr = Array.from(celebratedRef.current)
        localStorage.setItem('class_finished_celebrated', JSON.stringify(arr))
      } catch {}
      setCourseName(course.name)
      setShouldCelebrate(true)
      setTimeout(() => setShouldCelebrate(false), 2500)
    }

    prevProgressRef.current = progress
  }, [currentCourseInfo])

  return { shouldCelebrate, courseName }
}

export function ClassFinishCelebration({ shouldCelebrate, courseName }: { shouldCelebrate: boolean; courseName: string }) {
  return (
    <>
      <GoldConfettiCanvas active={shouldCelebrate} />
      <AnimatePresence>
        {shouldCelebrate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[99] pointer-events-none"
          >
            <div
              className="px-6 py-3 rounded-2xl text-center whitespace-nowrap glass-modal"
            style={{
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
              }}
            >
              <p className="text-sm font-semibold dark:text-yellow-300" style={{ color: '#B8860B' }}>
                ✨ {courseName} 下课啦！
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
