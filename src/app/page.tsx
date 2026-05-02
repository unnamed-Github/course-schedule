import nextDynamic from "next/dynamic"
import { MainView } from "@/components/MainView"
import { CourseCompletionCelebration } from "@/components/CourseCompletionCelebration"
import { getCourses, getSchedules } from "@/lib/data"
import { Course, CourseSchedule } from "@/lib/types"

const WeeklySummary = nextDynamic(() => import("@/components/WeeklySummary").then(m => ({ default: m.WeeklySummary })))
const EasterEgg = nextDynamic(() => import("@/components/EasterEgg").then(m => ({ default: m.EasterEgg })))
const FestivalPoster = nextDynamic(() => import("@/components/FestivalPoster").then(m => ({ default: m.FestivalPoster })))

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let courses: Course[] = []
  let schedules: CourseSchedule[] = []
  try {
    ;[courses, schedules] = await Promise.all([getCourses(), getSchedules()])
  } catch (e) {
    console.error("HomePage data load failed:", e)
  }

  return (
    <>
      <MainView />
      <WeeklySummary />
      <EasterEgg />
      <FestivalPoster />
      <CourseCompletionCelebration courses={courses} schedules={schedules} />
    </>
  )
}
