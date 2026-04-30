# 修复计划：已下课与进度条联动

## 问题根因

上次修改让 `isCurrent` 排除了 `isEndedEarly`：

```ts
const isCurrent = !isCancelled && !isEndedEarly && highlightEnabled && isToday && ...
```

这导致提前下课后 `isCurrent` 变为 false，进度条区域完全消失。虽然 `isEndedEarly` 的绿色条会显示，但它没有包含进度条，视觉上与进度条完全脱节。

用户期望：点击"提前下课"后，进度条**冻结在当前位置**，旁边文字从"提前下课"变为"已下课"，形成自然过渡。

## 修改方案

### 核心思路：新增 `isOngoing` 变量

`isOngoing` = 课程正在其时间范围内（不考虑 ended_early），用于控制进度条区域的显示。

```ts
const isOngoing = !isCancelled && highlightEnabled && isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
const isCurrent = isOngoing && !isEndedEarly
```

- `isOngoing`：课程时间范围内（含已提前下课）→ 控制进度条区域
- `isCurrent`：课程正在进行中（不含已提前下课）→ 控制高亮边框、badge 等

### 进度条区域修改

```tsx
{isOngoing && !isEndedEarly && (
  // 可点击的进度条 + "提前下课"按钮（现有逻辑）
  <div onClick={...} style={{ backgroundColor: course.color }}>
    <进度条 />
    <span>提前下课</span>
  </div>
)}
{isOngoing && isEndedEarly && (
  // 冻结的进度条 + "已下课"标签
  <div style={{ backgroundColor: '#10B981' }}>
    <冻结进度条 />
    <span>已下课</span>
  </div>
)}
```

这样点击"提前下课"后，进度条从课程色变为绿色，文字从"提前下课"变为"已下课"，进度冻结，形成自然过渡。

### 其他区域保持不变

- 边框颜色：`isEndedEarly ? '#10B981' : isCurrent ? course.color : ...`
- Badge：已取消 / 已下课 / 进行中 三态互斥
- `isCurrent` 仍排除 `isEndedEarly`，所以提前下课后不再显示"进行中"badge

## 文件变更

仅 [DayView.tsx](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/components/DayView.tsx)
