import { WeekView } from '@/components/WeekView'
import { Greeting } from '@/components/Greeting'
import { WeeklySummary } from '@/components/WeeklySummary'

export default function HomePage() {
  return (
    <>
      <Greeting />
      <WeekView />
      <WeeklySummary />
    </>
  )
}
