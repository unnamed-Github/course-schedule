import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const hasKey = !!process.env.OPENWEATHER_API_KEY
  return NextResponse.json({
    hasKey,
    keyLength: process.env.OPENWEATHER_API_KEY?.length ?? 0,
    nodeEnv: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(k => k.includes('OPENWEATHER') || k.includes('VERCEL')),
  })
}
