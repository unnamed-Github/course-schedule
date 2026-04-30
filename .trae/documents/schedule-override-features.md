# 功能计划：删除单节课 + 本课提前下课

## 需求分析

### 功能 1：删除周视图/日视图里的单节课
- 指取消**特定日期**的这节课，不影响其他周的同一课程（非删除整个 recurring schedule）
- 例如：今天周三的"高等数学"取消，但下周周三的高等数学依然存在

### 功能 2：本课提前下课
- 标记当前正在进行的课为"已提前下课"
- 同样是**按日期生效**的一次性操作

### 核心设计：`schedule_overrides` 覆盖表

由于 `course_schedules` 是循环排课，不区分具体日期，因此需要新增一张覆盖表来记录**按日期的调度覆盖**。

```
schedule_overrides:
  id            UUID   主键
  schedule_id   UUID   关联 course_schedules.id
  date          DATE   覆盖生效的日期（如 2026-05-01）
  type          TEXT   覆盖类型: 'cancelled' | 'ended_early'
  created_at    TIMESTAMP
```

## 实施步骤

### 步骤 1：在 Supabase 中创建 `schedule_overrides` 表

在 Supabase Dashboard 的 SQL Editor 中执行：
```sql
CREATE TABLE IF NOT EXISTS schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES course_schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cancelled', 'ended_early')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, date)
);
```

由于用户使用的是 Supabase 客户端直连模式（无 API 中间层），无需新建 API route，直接在 client 端调用即可。

### 步骤 2：新增 TypeScript 类型

在 [types.ts](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/lib/types.ts) 中新增：

```ts
export interface ScheduleOverride {
  id: string
  schedule_id: string
  date: string           // 'YYYY-MM-DD'
  type: 'cancelled' | 'ended_early'
  created_at?: string
}
```

### 步骤 3：在 data.ts 中新增 CRUD 函数

在 [data.ts](file:///Users/jack/Documents/trae_projects/Timer/course-schedule/src/lib/data.ts) 中新增：

```ts
export async function getScheduleOverrides(date: string): Promise<ScheduleOverride[]> {
  const cacheKey = `overrides_${date}`
  const cached = getCached<ScheduleOverride[]>(cacheKey)
  if (cached) return cached
  const { data } = await supabase.from('schedule_overrides').select('*').eq('date', date)
  const result = data ?? []
  setCache(cacheKey, result)
  return result
}

export async function createScheduleOverride(input: { schedule_id: string; date: string; type: 'cancelled' | 'ended_early' }): Promise<ScheduleOverride | null> {
  const { data, error } = await supabase.from('schedule_overrides').upsert(
    { ...input, id: genId(), created_at: new Date().toISOString() },
    { onConflict: 'schedule_id,date' }
  ).select().single()
  if (error) { console.error('createScheduleOverride error:', error); return null }
  invalidateCache('overrides')
  return data
}

export async function deleteScheduleOverride(scheduleId: string, date: string): Promise<boolean> {
  const { error } = await supabase.from('schedule_overrides').delete().eq('schedule_id', scheduleId).eq('date', date)
  if (!error) invalidateCache('overrides')
  return !error
}
```

### 步骤 4：修改 DayView.tsx — 集成覆盖逻辑 + 操作按钮

#### 4a. 数据获取
- 在 `loadData` 中额外调用 `getScheduleOverrides(dateStr)`，存入 state
- 根据 overrides 过滤/标注 `sortedSchedules`

#### 4b. 过滤逻辑
- `cancelled` 类型的 schedule：不显示在课程列表中（或显示为灰色删除线卡片）
- `ended_early` 类型的 schedule：正常显示但附加"已下课"标记

#### 4c. UI 操作按钮（放在展开详情区域）
在展开的课程详情底部，增加两个操作按钮：
- 🗑️ **取消本课**：红色/警告色按钮，点击弹出确认对话框，确认后调用 `createScheduleOverride({ schedule_id, date, type: 'cancelled' })`
- ✅ **提前下课**：绿色按钮，点击后调用 `createScheduleOverride({ schedule_id, date, type: 'ended_early' })`

按钮仅在以下情况显示：
- 查看的日期 >= 今天（不能取消/操作过去的课）
- 该课还未被取消

撤销操作：
- 已取消的课：显示"恢复本课"按钮，调用 `deleteScheduleOverride` 
- 已提前下课的课：显示"撤销下课"按钮，调用 `deleteScheduleOverride`

#### 4d. 视觉状态
- **已取消**：卡片整体透明度降低、文字添加删除线、不显示进行中高亮
- **已提前下课**：卡片右上方显示绿色小徽章"已下课"
- **无覆盖**：正常显示

### 步骤 5：修改 WeekView.tsx — 集成覆盖逻辑 + 操作按钮

#### 5a. 数据获取
- 在 `loadData` 中额外获取当前周每一天的 `getScheduleOverrides`，存入 `weekOverrides` state
- 用 `useMemo` 构建 `Map<scheduleId, ScheduleOverride>` 方便查找

#### 5b. 过滤逻辑
- 与 DayView 相同：cancelled 的 schedule 不在 cell 中显示，ended_early 的显示徽章

#### 5c. UI 操作按钮
WeekView 的卡片较小，在展开详情（已有 AnimatePresence 展开区）中添加操作按钮，结构与 DayView 一致：
- 展开区域底部显示"取消本课"/"提前下课"按钮
- 需要知道当前查看周的每一天的日期 → weekHolidays 已有遍历，可以顺便构建 `dayDateMap: Map<dayOfWeek, Date>`

#### 5d. 视觉状态
- **已取消**：不渲染该 schedule 的卡片（或渲染为极简占位）
- **已提前下课**：卡片右上角小绿点/徽章

### 步骤 6：确认对话框组件

由于两个视图都需要删除确认，创建一个简单的内联确认状态或复用 toast。为简单起见，使用浏览器 `window.confirm()` 或创建一个轻量确认状态。

建议：直接在组件内用 state 管理 `confirmCancelId`，点击取消本课时弹出内联确认（使用已有的 UI 风格），而非 `window.confirm`。

### 步骤 7：验证

- 在 DayView 中选今天，展开一节课 → 点击"取消本课" → 确认 → 卡片消失，刷新后依然取消
- 在 DayView 中选今天，展开一节课 → 点击"提前下课" → 卡片显示"已下课"徽章
- 在 WeekView 中当前周，展开某天的一节课 → 执行相同操作
- 切换到其他日期/周 → 确认不影响其他日期
- 恢复操作：取消后可恢复，下课后可撤销

## 文件变更清单

| 文件 | 变更类型 |
|------|----------|
| `src/lib/types.ts` | 新增 `ScheduleOverride` 接口 |
| `src/lib/data.ts` | 新增 `getScheduleOverrides`、`createScheduleOverride`、`deleteScheduleOverride` |
| `src/components/DayView.tsx` | 集成 overrides + 操作按钮 + 视觉状态 |
| `src/components/WeekView.tsx` | 集成 overrides + 操作按钮 + 视觉状态 |
| Supabase `schedule_overrides` 表 | 新建表（需手动 SQL 或 seed） |
