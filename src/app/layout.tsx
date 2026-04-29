import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { TopBar } from "@/components/TopBar"
import { BottomNav } from "@/components/BottomNav"
import { PageTransition } from "@/components/PageTransition"
import { ToastProvider } from "@/components/ToastProvider"

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
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ToastProvider>
            <TopBar />
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-24">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <BottomNav />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
