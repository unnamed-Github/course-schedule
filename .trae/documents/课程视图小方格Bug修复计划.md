# 课程视图小方格 Bug 修复计划

## Bug 描述

在课程视图（`/courses` 页面）的课程卡片中，每个课程有一排小方格（进度点），代表每次上课：

1. **Tooltip 时间重复**：一周有两次课时，鼠标悬停到同一周的两个小方格，弹出的上课时间一样（只显示周次和日期，没有区分具体是哪节课）
2. **下次课高亮错误**：当前周的"下次课"高亮同时高亮了两个方格，而不是只高亮下一个即将到来的课

## 根因分析

相关代码位于 [courses/page.tsx](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/app/courses/page.tsx) 第 250-276 行。

### Bug 1：Tooltip 时间重复

```js
const weekForDot = Math.floor(i / perWeek) + 1
const label = range ? `第${weekForDot}周 · ${date}` : `第${weekForDot}周`
```

当前 tooltip 只包含周次和日期范围，没有包含具体的上课时间（星期几、第几节、具体钟点）。同一周的两个小方格 `weekForDot` 相同，所以 tooltip 完全一样。

### Bug 2：高亮两个方格

```js
const isCurrent = i >= completedClasses && i < completedClasses + perWeek
```

`isCurrent` 对当前周的所有小方格都返回 `true`，没有区分哪个是"下一次"课。

## 修复方案

### 修改文件

- [courses/page.tsx](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/app/courses/page.tsx)

### 步骤 1：获取当前星期和节次信息

在组件中添加当前星期几（`currentDayOfWeek`）和当前节次（`currentPeriod`）的状态，用于判断"下次课"是哪一节。

```js
const [currentDayOfWeek, setCurrentDayOfWeek] = useState(0)
const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)

useEffect(() => {
  const now = new Date()
  const dow = now.getDay()
  setCurrentDayOfWeek(dow === 0 ? 7 : dow)
  setCurrentPeriod(getCurrentPeriod(now))
  const timer = setInterval(() => {
    const n = new Date()
    const d = n.getDay()
    setCurrentDayOfWeek(d === 0 ? 7 : d)
    setCurrentPeriod(getCurrentPeriod(n))
  }, 60000)
  return () => clearInterval(timer)
}, [])
```

需要从 `@/lib/semester` 导入 `getCurrentPeriod`。

### 步骤 2：为每个课程构建排序后的课表列表

在课程卡片的渲染中，获取当前课程在本周活跃的课表，按 `day_of_week` 和 `start_period` 排序：

```js
const courseSchedules = schedules
  .filter((s) => s.course_id === course.id)
  .filter((s) => {
    if (s.week_type === 'all') return true
    if (s.week_type === 'odd' && currentWeekOdd) return true
    if (s.week_type === 'even' && !currentWeekOdd) return true
    return false
  })
  .sort((a, b) => a.day_of_week - b.day_of_week || a.start_period - b.start_period)
```

### 步骤 3：修复 Tooltip — 显示具体上课时间

对于每个小方格，根据 `i % perWeek` 确定对应的课表项，在 tooltip 中加入星期、节次和钟点时间：

```js
const scheduleIndex = i % perWeek
const dotSchedule = courseSchedules[scheduleIndex]
const dayLabel = DAY_MAP[dotSchedule?.day_of_week] ?? ''
const periodLabel = dotSchedule ? `${dotSchedule.start_period}-${dotSchedule.end_period}节` : ''
const timeLabel = dotSchedule
  ? `${PERIOD_TIMES[dotSchedule.start_period].start}-${PERIOD_TIMES[dotSchedule.end_period].end}`
  : ''
const scheduleInfo = dotSchedule ? `${dayLabel} ${periodLabel} ${timeLabel}` : ''
const label = range
  ? `第${weekForDot}周 · ${range.start.getMonth() + 1}月${range.start.getDate()}日\n${scheduleInfo}`
  : `第${weekForDot}周\n${scheduleInfo}`
```

需要从 `@/lib/semester` 导入 `PERIOD_TIMES`。

### 步骤 4：修复高亮逻辑 — 只高亮下一次课

计算当前周中下一个即将到来的课的索引：

```js
let nextScheduleIndex = -1
if (weekNum > 0 && currentDayOfWeek > 0) {
  for (let si = 0; si < courseSchedules.length; si++) {
    const s = courseSchedules[si]
    if (s.day_of_week > currentDayOfWeek) {
      nextScheduleIndex = si
      break
    }
    if (s.day_of_week === currentDayOfWeek) {
      if (currentPeriod === null || currentPeriod <= s.end_period) {
        nextScheduleIndex = si
        break
      }
    }
  }
}

const nextDotIndex = nextScheduleIndex >= 0 ? completedClasses + nextScheduleIndex : -1
```

然后将 `isCurrent` 的判断从：

```js
const isCurrent = i >= completedClasses && i < completedClasses + perWeek
```

改为：

```js
const isCurrent = i === nextDotIndex
```

### 步骤 5：验证

- 运行 `npm run build` 确保无类型错误
- 手动测试：查看一周两次课的课程卡片，确认两个小方格的 tooltip 显示不同的上课时间，且只有下一次课被高亮
