# 备忘跨节显示问题修复计划

## 问题描述

当前 WeekView 在展开某个课时卡片时，显示该课程的**全部**作业和备忘，而不是只显示关联到**该课时**的内容：

```typescript
// 第 437-438 行 - 现有代码
const courseAssignments = assignments.filter(a => a.course_id === course.id)
const courseMemos = memos.filter(m => m.course_id === course.id).slice(0, 3)
```

例如：线性代数有周二和周四两次课，用户在展开"周二 1-2节"卡片时会同时看到所有课程的备忘，不管是否关联到周二这节课。

## 修复方案

将过滤条件改为优先按 `schedule_id` 匹配，同时也保留关联到课程的（`schedule_id` 为空的）备忘/作业作为兜底。

### 改动文件

**[WeekView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/WeekView.tsx)**

**第 437-438 行**，修改过滤逻辑：

```typescript
// 修复前
const courseAssignments = assignments.filter(a => a.course_id === course.id)
const courseMemos = memos.filter(m => m.course_id === course.id).slice(0, 3)

// 修复后
// 优先显示关联到当前课时的，兜底显示关联到课程但未关联具体课时的
const courseAssignments = assignments.filter(a =>
  a.course_id === course.id && (a.schedule_id === schedule.id || !a.schedule_id)
)
const courseMemos = memos.filter(m =>
  m.course_id === course.id && (m.schedule_id === schedule.id || !m.schedule_id)
).slice(0, 3)
```

**效果：**
- 关联到**该具体课时**的备忘/作业 → 仅在该课时卡片中显示 ✅
- 仅关联**课程本身**（`schedule_id` 为空）的备忘/作业 → 在所有该课程的课时卡片中均显示 ✅
- 关联到**其他课时**的备忘/作业 → 不会出现在当前卡片中 ✅
