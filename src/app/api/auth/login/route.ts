import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const DEFAULT_PASSWORD = 'zhubamboo'

function simpleHash(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

async function sha256(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 })
    }

    if (password === DEFAULT_PASSWORD) {
      const response = NextResponse.json({ ok: true })
      response.cookies.set('auth_token', simpleHash(password), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })
      return response
    }

    const inputHash = await sha256(password)

    if (SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
      const { data, error } = await supabase.from('site_config').select('value').eq('key', 'password_hash').single()
      if (!error && data && inputHash === data.value) {
        const response = NextResponse.json({ ok: true })
        response.cookies.set('auth_token', inputHash, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        })
        return response
      }
    }

    const envPass = process.env.SITE_PASSWORD
    if (envPass && password === envPass) {
      const response = NextResponse.json({ ok: true })
      response.cookies.set('auth_token', simpleHash(password), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
