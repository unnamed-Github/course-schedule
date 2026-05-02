"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        setError(data.error || '登录失败')
      }
    } catch {
      setError('网络错误')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="rounded-2xl p-8 w-full max-w-sm text-center glass-strong">
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>课表 · 竹</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>输入密码以继续</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            autoFocus
            className="w-full rounded-xl px-4 py-3 text-sm text-center"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
          />
          {error && (
            <p className="text-xs" style={{ color: 'var(--accent-danger)' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? '验证中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}
