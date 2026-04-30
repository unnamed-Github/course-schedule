# 修复计划：周六周日调休不显示的问题

## 问题分析

当前 `WeekView.tsx` 中 `showDays` 固定为 `[1, 2, 3, 4, 5]`（周一至周五），而 `DAYS` 数组也只有 5 个元素 `['一', '二', '三', '四', '五']`。当调休日（makeup day）落在周六或周日时，该列不会渲染，导致用户看不到调休安排。

例如默认配置：
- `2026-02-28`（周六）补周一，`2026-05-09`（周六）补周二 — 这些调休日都不会在周视图中显示。

## 修改方案

动态计算 `showDays`：如果当前周内有调休日落在周六（day=6）或周日（day=7），则将对应的周末日加入 `showDays`。同时：

1. 周末列渲染时，应显示其补的星期几的课程（而非周末自身的课程）
2. 周末列的标题需显示"周六(补周一)"之类的标签
3. 网格列数需要动态调整

## 具体步骤

### 步骤 1：扩展 DAYS 映射

将 `DAYS` 数组替换为一个 `Record<number, string>` 映射，覆盖 1-7：

```ts
const DAY_LABELS: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' }
```

### 步骤 2：动态计算 `showDays`

在已有的 `weekHolidays` useMemo 旁边新增一个 `useMemo`，计算当前周内哪些周末日需要显示（即该日有调休）：

- 遍历周一到周日（1-7）
- 对于周六（6）和周日（7），检查 `weekHolidays.makeups` 是否有值
- 如果有，将该日加入 `showDays`
- 确保周一至周五始终在 `showDays` 中

### 步骤 3：更新星期标题渲染

将标题渲染中的 `DAYS[day - 1]` 改为使用 `DAY_LABELS[day]`。

对于周末调休列，额外显示补课信息，如 `周六(补周一)`。

### 步骤 4：更新课程筛选逻辑（关键）

当前筛选逻辑为：
```ts
const daySchedules = schedules.filter((s) => s.day_of_week !== day ...)
```

对于周末调休列，应使用 `makeup.replacesDayOfWeek` 替代 `day` 进行筛选。具体修改：在渲染每个 cell 时，判断该 day 是否为周末且有 makeup，如果是，则筛选时 `targetDay = makeup.replacesDayOfWeek`，否则 `targetDay = day`。

### 步骤 5：更新网格列数

`gridTemplateColumns` 需要从 `100px repeat(5, 1fr)` 变为 `100px repeat(N, 1fr)`，其中 N = `showDays.length`。

### 步骤 6：验证

- 切换到第 1 周（含 2026-02-28 周六补周一），确认周六列出现并显示周一的课程
- 切换到第 11 周（含 2026-05-09 周六补周二），确认周六列出现并显示周二的课程
- 切换到没有周末调休的周，确认仅显示周一至周五 5 列
