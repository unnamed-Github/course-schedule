import { MainView } from "@/components/MainView"
import { WeeklySummary } from "@/components/WeeklySummary"
import { EasterEgg } from "@/components/EasterEgg"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <>
      <MainView />
      <WeeklySummary />
      <EasterEgg />
    </>
  )
}
