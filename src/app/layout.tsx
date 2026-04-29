import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { TopBar } from "@/components/TopBar"
import { BottomNav } from "@/components/BottomNav"
import { PageTransition } from "@/components/PageTransition"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="zh-CN" className={`h-full antialiased ${inter.className}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TopBar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-24">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
