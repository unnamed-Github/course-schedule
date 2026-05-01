# 备忘和作业关联到具体课时（CourseSchedule）计划

## 背景

当前 `memos` 和 `assignments` 只通过 `course_id` 关联到课程。但同一门课一周可能有多次排课（如线性代数周二1-2节、周四3-4节），用户无法区分备忘/作业是针对哪一次课。需要增加 `schedule_id` 可选字段，让备忘和作业也能关联到具体的 `CourseSchedule`（课时实例）。

---

## 改动范围概览

```
改动涉及 5 个层面：
  1. 数据模型（types.ts + supabase-schema.sql）
  2. CRUD 操作层（data.ts）
  3. 备忘视图组件（MemosView.tsx）
  4. 作业视图组件（AssignmentsView.tsx）
  5. 周视图/日视图集成（WeekView.tsx / DayView.tsx）
```

---

## Step 1: 数据模型扩展

### 1.1 类型定义 - [types.ts](file:///Users/jack/Documents/trae_projects/Timer/src/lib/types.ts)

```typescript
// Assignment 接口新增字段
export interface Assignment {
  // ...现有字段...
  schedule_id?: string  // 可选：关联到具体课时
}

// Memo 接口新增字段
export interface Memo {
  // ...现有字段...
  schedule_id?: string  // 可选：关联到具体课时
}
```

### 1.2 数据库 Schema - [supabase-schema.sql](file:///Users/jack/Documents/trae_projects/Timer/supabase-schema.sql)

```sql
-- assignments 表新增列
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS schedule_id TEXT REFERENCES course_schedules(id) ON DELETE SET NULL;

-- memos 表新增列
ALTER TABLE memos ADD COLUMN IF NOT EXISTS schedule_id TEXT REFERENCES course_schedules(id) ON DELETE SET NULL;
```

**注意**：`schedule_id` 为可选（NULL 允许），因为用户可能只想关联到课程层级而非具体课时。使用 `ON DELETE SET NULL` 而非 `CASCADE`，当课时被删除时，备忘/作业不丢失，只是变为只关联课程。

---

## Step 2: CRUD 操作层更新

### 2.1 - [data.ts](file:///Users/jack/Documents/trae_projects/Timer/src/lib/data.ts)

对以下函数进行扩展：

| 函数 | 改动 |
|------|------|
| `getAssignments(courseId?, scheduleId?)` | 新增 `scheduleId` 可选参数，支持按 `schedule_id` 过滤 |
| `createAssignment(input)` | `input` 类型增加 `schedule_id?: string`，创建时写入 |
| `updateAssignment(id, updates)` | `updates` 类型增加 `schedule_id?: string`，更新时写入 |
| `getMemos(courseId?, scheduleId?)` | 新增 `scheduleId` 可选参数 |
| `createMemo(input)` | `input` 类型增加 `schedule_id?: string` |
| `updateMemo(id, updates)` | `updates` 类型增加 `schedule_id?: string` |

---

## Step 3: 备忘视图 UI 改造

### 3.1 - [MemosView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/MemosView.tsx)

改动点：
1. **加载数据**：同时加载 `getSchedules()` 获取所有课时
2. **新建/编辑表单**：选择课程后，增加一个"关联课时"下拉选择器（可选），列示该课程的所有排课时间（如"周二 1-2节"、"周四 3-4节"），默认为"不关联具体课时"
3. **备忘列表展示**：如果关联了具体课时，在备忘卡片上显示课时时间信息（如"周二 1-2节"），颜色与课程一致
4. **课程统计区域**：不需要改动（仍按 course_id 聚合）

---

## Step 4: 作业视图 UI 改造

### 4.1 - [AssignmentsView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/AssignmentsView.tsx)

改动点：
1. **加载数据**：同时加载 `getSchedules()` 获取所有课时
2. **新建/编辑表单**：选择课程后，增加"关联课时"下拉（可选），过滤选项
3. **作业卡片展示**：如果有 `schedule_id`，显示课时时间信息

---

## Step 5: 周视图/日视图集成（可选增强）

### 5.1 - [WeekView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/WeekView.tsx) / [DayView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/DayView.tsx)

在课程卡片上显示关联的备忘和作业数量（小徽章）。例如：
- 点击课程单元格时，在展开区域显示该课时相关的备忘和作业
- 或者在课程卡片角落显示数字角标

---

## 实施顺序

1. 先改数据模型（types.ts + schema.sql）
2. 再改 CRUD 层（data.ts）
3. 改造 MemosView 组件
4. 改造 AssignmentsView 组件
5. 可选：WeekView/DayView 集成增强

---

## 向后兼容

- `schedule_id` 为可选字段，现有数据不受影响
- 所有现有功能（仅按 course_id 关联）继续正常工作
- 新建的备忘/作业可选择关联到具体课时
