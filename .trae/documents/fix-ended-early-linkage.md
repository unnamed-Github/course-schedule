# 修复计划：已下课与"进行中"联动

## 问题

当前 `isCurrent` 的计算排除了 `isCancelled` 但没有排除 `isEndedEarly`：

```ts
const isCurrent = !isCancelled && highlightEnabled && isToday && ...
```

导致提前下课后，`isCurrent` 仍为 true，卡片仍然显示：
- 课程色高亮边框
- 时间文字用课程色
- "进行中 X%" badge（虽然被 `!isEndedEarly` 条件隐藏了，但边框和颜色仍显示）

## 修改方案

### 步骤 1：修改 `isCurrent` 计算，排除 `isEndedEarly`

```ts
const isCurrent = !isCancelled && !isEndedEarly && highlightEnabled && isToday && ...
```

这样提前下课后，`isCurrent` 变为 false，卡片自动失去"进行中"的视觉状态（高亮边框、课程色时间文字等）。

### 步骤 2：简化标题 badge 区域

因为 `isCurrent && isEndedEarly` 不可能同时为 true（步骤1已排除），可以删除重复的 badge：

- `isCancelled` → 显示"已取消"badge
- `isEndedEarly` → 显示"已下课"badge
- `isCurrent`（隐含 !isEndedEarly）→ 显示"进行中 X%"badge

三个条件互斥，不再需要 `isCurrent && isEndedEarly` 分支。

### 步骤 3：进度条区域保持不变

进度条区域已有正确的 `isCurrent && !isEndedEarly` 和 `isCurrent && isEndedEarly` 条件。但步骤1修改后，`isCurrent && isEndedEarly` 永远为 false，所以需要单独处理：

提前下课后不再显示进度条，改为显示绿色的"已下课"条。条件改为 `isEndedEarly`（不再依赖 isCurrent）。

### 步骤 4：边框颜色联动

提前下课后边框应变为绿色（而非课程色高亮），表示已下课状态：

```ts
border: `2px solid ${isEndedEarly ? '#10B981' : isCurrent ? course.color : 'var(--border-light)'}`
```

## 文件变更

仅 [DayView.tsx](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/components/DayView.tsx)
