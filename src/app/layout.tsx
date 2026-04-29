import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import { NavBar } from "@/components/NavBar"
import { MobileTabs } from "@/components/MobileTabs"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

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
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-cream dark:bg-[#1E1B18] text-ink dark:text-sand">
        <ThemeProvider>
          <NavBar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-20 md:pb-6 pt-4">
            {children}
          </main>
          <MobileTabs />
        </ThemeProvider>
      </body>
    </html>
  )
}
