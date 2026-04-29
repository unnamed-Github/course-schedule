import { DayView } from '@/components/DayView'
import { EasterEgg } from '@/components/EasterEgg'

export const dynamic = 'force-dynamic'

export default function DayPage() {
  return (
    <>
      <DayView />
      <EasterEgg />
    </>
  )
}
