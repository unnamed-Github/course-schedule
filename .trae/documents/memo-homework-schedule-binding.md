# 备忘/作业 课时绑定逻辑修正计划

## 当前状态分析

### CourseSchedule 的本质

`CourseSchedule`（排课模板）包含 `day_of_week` + `week_type`（all/odd/even），代表**每周循环的模板**：

| week_type | 含义 | 适用周数 |
|-----------|------|---------|
| `all` | 每周都有 | 所有周 |
| `odd` | 仅单周 | 第1、3、5、7...周 |
| `even` | 仅双周 | 第2、4、6、8...周 |

`week_type` 本身就是区分"单双周"的关键，所以**不需要额外增加 week_number 字段**。

---

## 设计方案

### 核心逻辑

在 **WeekView** 中创建备忘/作业时，`schedule_id` 直接关联到 `CourseSchedule`（排课模板），显示时附加当前视图所在周的上下文：

```
「周三 5-6节（全周）」         ← 新建/编辑时看到
「第5周 · 周三 5-6节（全周）」 ← WeekView 中展开卡片时显示（带上当前周）
```

WeekView 展开卡片时，通过 `getWeekNumber(viewDate)` 判断当前是第几周，从而确定这个 `schedule` 在当前周是否有效（odd/even 过滤）。

---

## 改动内容

### 1. WeekView — 快速添加自动关联当前视图的课时

- `handleQuickAddMemo(handleQuickAddAssignment)` 的 `scheduleId` 保持不变（当前课时 `schedule.id`）
- 卡片内显示时，如果 `schedule.week_type` 是 `odd`/`even`，标签附加"单周/双周"

### 2. 课时选择器显示优化

- `getScheduleLabel()` 函数增加 `weekType` 显示

```typescript
const WEEK_TYPE_SHORT = { all: '', odd: '（单周）', even: '（双周）' }
function getScheduleLabel(s: CourseSchedule): string {
  return `${DAY_LABELS[s.day_of_week]} ${s.start_period}-${s.end_period}节${WEEK_TYPE_SHORT[s.week_type]}`
}
```

### 3. 作业跨节逻辑（确认正确，无需修改）

```typescript
// 作业跨节：course_id 相同即显示
const courseAssignments = assignments.filter(a => a.course_id === course.id)
```

### 4. 备忘不跨节逻辑（确认正确，无需修改）

```typescript
// 备忘不跨节：schedule_id 精确匹配
const courseMemos = memos.filter(m => m.schedule_id === schedule.id)
```

### 5. AssignmentsView / MemosView 表单优化

- 课时选择器增加 `week_type` 标签（单周/双周）
- 移除"不关联具体课时"选项（`schedule_id` 必填）
- 新建时默认选中当前周有效的课时（odd/even 过滤）

### 6. 数据库迁移（可选）

现有 `schedule_id` 为空的记录，给一个默认值（同课程第一条排课），并改为 NOT NULL。

---

## 结论

当前 WeekView 的 `handleQuickAddMemo/Assignment` **已经正确**传入了 `schedule.id`（当前课时），作业跨节和备忘不跨节的逻辑也**已经正确**。

唯一需要优化的是选择器显示加上 `week_type` 标签（单周/双周），让用户知道这个课时是单周还是双周。
