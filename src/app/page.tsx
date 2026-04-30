import { MainView } from "@/components/MainView"
import { WeeklySummary } from "@/components/WeeklySummary"
import { EasterEgg } from "@/components/EasterEgg"
import { CourseCompletionCelebration } from "@/components/CourseCompletionCelebration"
import { getCourses, getSchedules } from "@/lib/data"
import { Course, CourseSchedule } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let courses: Course[] = []
  let schedules: CourseSchedule[] = []
  try {
    ;[courses, schedules] = await Promise.all([getCourses(), getSchedules()])
  } catch {}

  return (
    <>
      <MainView />
      <WeeklySummary />
      <EasterEgg />
      <CourseCompletionCelebration courses={courses} schedules={schedules} />
    </>
  )
}
