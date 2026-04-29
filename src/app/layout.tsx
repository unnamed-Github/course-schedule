import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavBar } from "@/components/NavBar"
import { MobileTabs } from "@/components/MobileTabs"
import { DayPhaseTint } from "@/components/DayPhaseTint"
import { PageTransition } from "@/components/PageTransition"

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
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <DayPhaseTint />
          <NavBar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-28 md:pb-10">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <MobileTabs />
        </ThemeProvider>
      </body>
    </html>
  )
}
