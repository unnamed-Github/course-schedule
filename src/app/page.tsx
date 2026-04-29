import { WeekView } from '@/components/WeekView'
import { WarmthBanner } from '@/components/WarmthBanner'
import { WeeklySummary } from '@/components/WeeklySummary'
import { EasterEgg } from '@/components/EasterEgg'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <WarmthBanner />
      <WeekView />
      <WeeklySummary />
      <EasterEgg />
    </>
  )
}
