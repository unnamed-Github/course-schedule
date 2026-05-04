"use client"

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, RotateCcw, Check } from 'lucide-react'

interface KegelGuideCardProps {
  open: boolean
  onClose: () => void
}

const EXERCISE_STEPS = [
  { emoji: '🧘', text: '找个舒服的姿势，坐着或躺着都行' },
  { emoji: '💪', text: '收紧盆底肌（像憋尿的感觉），保持 5 秒' },
  { emoji: '😌', text: '完全放松 5 秒，不要急' },
  { emoji: '🔄', text: '重复 10 次，每天做 3 组' },
]

function KegelTimer() {
  const [phase, setPhase] = useState<'idle' | 'contract' | 'relax'>('idle')
  const [seconds, setSeconds] = useState(5)
  const [count, setCount] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [done, setDone] = useState(false)

  const reset = useCallback(() => {
    setPhase('idle')
    setSeconds(5)
    setCount(0)
    setIsRunning(false)
    setDone(false)
  }, [])

  useEffect(() => {
    if (!isRunning || done) return

    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (phase === 'contract') {
            setPhase('relax')
            return 5
          }
          if (phase === 'relax') {
            setCount((c) => {
              const next = c + 1
              if (next >= 10) {
                setDone(true)
                setIsRunning(false)
                setPhase('idle')
                return 10
              }
              setPhase('contract')
              return next
            })
            return 5
          }
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, phase, done])

  const start = () => {
    if (done) reset()
    setPhase('contract')
    setSeconds(5)
    setIsRunning(true)
  }

  const togglePause = () => {
    setIsRunning((v) => !v)
  }

  return (
    <div className="text-center">
      {done ? (
        <div className="space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}
          >
            <Check size={32} strokeWidth={3} style={{ color: '#10B981' }} />
          </motion.div>
          <p className="text-sm font-semibold" style={{ color: '#10B981' }}>完成！10 次一组 🎉</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>每天记得做 3 组哦</p>
          <button
            onClick={reset}
            className="flex items-center gap-1 mx-auto px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
          >
            <RotateCcw size={12} />
            再来一组
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border-light)" strokeWidth="6" />
              <motion.circle
                cx="48" cy="48" r="40" fill="none"
                stroke={phase === 'contract' ? '#8B5CF6' : '#10B981'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${((5 - seconds) / 5) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{
                color: phase === 'contract' ? '#8B5CF6' : phase === 'relax' ? '#10B981' : 'var(--text-primary)',
              }}>
                {seconds}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {phase === 'contract' ? '收紧' : phase === 'relax' ? '放松' : '准备'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {isRunning ? (
              <button
                onClick={togglePause}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
                style={{ backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
              >
                <Pause size={14} />
                暂停
              </button>
            ) : (
              <button
                onClick={phase === 'idle' ? start : togglePause}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer transition-colors"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                <Play size={14} />
                {phase === 'idle' ? '开始' : '继续'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>
              进度：{count} / 10 次
            </span>
            {count > 0 && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>|</span>
                <span style={{ color: phase === 'contract' ? '#8B5CF6' : '#10B981' }}>
                  {phase === 'contract' ? '收紧中…' : phase === 'relax' ? '放松中…' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function KegelGuideCard({ open, onClose }: KegelGuideCardProps) {
  const [showTimer, setShowTimer] = useState(false)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalRoot(document.body)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!portalRoot) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 100%)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💪</span>
                  <h3 className="text-lg font-bold" style={{ color: '#5B21B6' }}>
                    {showTimer ? '跟着节奏做' : '提肛运动指引'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/50 transition-colors"
                  style={{ color: '#9333EA' }}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {showTimer ? (
                <KegelTimer />
              ) : (
                <>
                  <div className="space-y-3 mb-5">
                    {EXERCISE_STEPS.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
                          {step.emoji}
                        </span>
                        <span className="text-sm pt-1" style={{ color: '#4C1D95' }}>{step.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#6D28D9' }}>
                      💡 <strong>小提示：</strong>坚持提肛有助于预防痔疮、改善盆腔血液循环，久坐必做！
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTimer(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                  >
                    跟着做一组（2 分钟）
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}
