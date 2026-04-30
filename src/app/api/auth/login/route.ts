import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    if (!password || typeof password !== 'string' || password.length < 1) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 })
    }

    const inputHash = await hashPassword(password)

    if (!SERVICE_KEY) {
      const envPass = process.env.SITE_PASSWORD
      if (!envPass) return NextResponse.json({ error: '服务未配置' }, { status: 500 })
      if (password !== envPass) return NextResponse.json({ error: '密码错误' }, { status: 401 })
    } else {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
      const { data, error } = await supabase.from('site_config').select('value').eq('key', 'password_hash').single()
      if (error || !data || inputHash !== data.value) {
        return NextResponse.json({ error: '密码错误' }, { status: 401 })
      }
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('auth_token', inputHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
