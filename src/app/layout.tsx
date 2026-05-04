import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { WarmthBannerProvider } from "@/components/WarmthBannerContext"
import { ReminderProvider } from "@/components/ReminderProvider"
import { TopBar } from "@/components/TopBar"
import { PageTransition } from "@/components/PageTransition"
import { ToastProvider } from "@/components/ToastProvider"
import { ViewProvider } from "@/components/ViewContext"
import { DataProvider } from "@/components/DataContext"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { FloatingSettingsButton } from "@/components/FloatingSettingsButton"
import { GlassStyleInjector } from "@/components/GlassStyleInjector"

export const metadata: Metadata = {
  title: "课表 · 竹",
  description: "竹的个人课表管理工具",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-primary)] to-[var(--glass-bg-strong)] overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[var(--accent-info)] focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          跳转到主要内容
        </a>
        <ThemeProvider>
          <GlassStyleInjector />
          <ReminderProvider>
          <ToastProvider>
            <WarmthBannerProvider>
              <ViewProvider>
              <DataProvider>
                <TopBar />
                <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8">
                  <ErrorBoundary>
                  <PageTransition>
                    {children}
                  </PageTransition>
                  </ErrorBoundary>
                </main>
                <FloatingSettingsButton />
              </DataProvider>
            </ViewProvider>
            </WarmthBannerProvider>
          </ToastProvider>
          </ReminderProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
