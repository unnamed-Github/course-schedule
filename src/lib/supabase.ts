import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * 懒加载的 Supabase 客户端。
 *
 * 模块导入时不会初始化真正的客户端实例——避免在缺少环境变量
 * (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) 时
 * 导致整个应用崩溃。首次访问任意属性时才会创建客户端。
 *
 * 环境变量缺失时使用占位符 URL 创建客户端。
 * supabase-availability.ts 会在运行时检测连接状态，各数据层调用者
 * (data.ts / user-settings.ts / semester-db.ts) 通过 checkSupabaseAvailability()
 * 决定使用远程同步还是本地存储降级。
 *
 * 实现方式：
 * - 模块顶层只声明变量，不做任何可能导致副作用的初始化
 * - 通过 Proxy 将所有属性访问委托到按需创建的客户端实例
 * - 方法调用时 bind(this) 确保解构使用 (const { from } = supabase) 不会丢失上下文
 */
let _client: SupabaseClient | undefined

function ensureClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window === 'undefined') {
      console.warn(
        '⚠  Supabase 未配置 (缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)\n' +
        '   数据同步功能已禁用，应用将以本地模式运行。'
      )
    }
    _client = createClient('https://offline.local', 'offline-key')
  } else {
    _client = createClient(url, key)
  }

  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = ensureClient()
    const value = Reflect.get(client, prop, client)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
