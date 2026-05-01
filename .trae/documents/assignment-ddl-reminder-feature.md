# 作业 DDL 管理与提醒功能实施计划

## 概述
为作业系统增加 DDL（截止时间）提醒功能：创建/编辑作业时可选多个提醒时间点（提前 30 分钟/1 小时/3 小时/1 天/3 天），到期时通过浏览器系统通知推送提醒。

## 实施步骤

### Step 1: 扩展类型定义
**文件**: `src/lib/types.ts`
- 在 `Assignment` 接口中新增字段：`reminders?: number[]`（分钟数组，如 `[60, 1440]` 表示截止前 1 小时和 1 天提醒）
- 定义常量 `DDL_REMINDER_OPTIONS`：5 个可选时间点
  ```
  { value: 30, label: '30 分钟前' }
  { value: 60, label: '1 小时前' }
  { value: 180, label: '3 小时前' }
  { value: 1440, label: '1 天前' }
  { value: 4320, label: '3 天前' }
  ```

### Step 2: 数据库 Schema 更新
**文件**: `supabase-schema.sql`
- 在 `assignments` 表中新增列：`reminders JSONB DEFAULT '[]'::jsonb`
- 在文件顶部添加 ALTER TABLE 迁移注释，方便手动执行

### Step 3: 扩展用户设置
**文件**: `src/lib/user-settings.ts`
- 在 `HEALTH_REMINDER_DEFAULTS` 新增：`ddl_reminder_enabled: 'true'`

### Step 4: ReminderProvider 增加 DDL 检查逻辑
**文件**: `src/components/ReminderProvider.tsx`
- 导入 `getAssignments` 从 `@/lib/data`
- 扩展 `checkReminders` 中的逻辑：获取所有 pending 作业，对每个作业检查其 `reminders[]` 数组，如果当前时间进入某个提醒窗口（`due_date - reminder_minutes <= now < due_date`），发送通知
- 通知标题格式：`⏰ 作业截止提醒`
- 通知内容格式：`「{作业标题}」将在 {相对时间} 后截止`
- Context 新增 `ddlEnabled` / `toggleDdl` 状态
- DDL 提醒同样受静默时段控制

### Step 5: 更新 AssignmentsView 添加表单
**文件**: `src/components/AssignmentsView.tsx`
- 新增状态：`newReminders: number[]`（多选数组）
- 在 "快速添加作业" Modal 中新增提醒时间多选区域（chip 按钮，点击切换选中）
- 在编辑表单中新增提醒时间多选
- 在作业展开详情中显示已设置的提醒（badge 标签）
- `handleAddAssignment` 传入 `reminders`
- `handleSaveEdit` 传入 `reminders`
- 新增编辑状态 `editReminders: number[]`

### Step 6: 更新 WeekView 快速添加
**文件**: `src/components/WeekView.tsx`
- 在快速添加作业的弹窗表单中新增提醒多选
- `handleQuickAddAssignment` 传入 `reminders`

### Step 7: 更新课程详情页
**文件**: `src/app/courses/[id]/page.tsx`
- 在作业添加表单中新增提醒多选
- 在作业编辑表单中新增提醒多选
- `handleAddAssignment` 和 `handleSaveEditAssignment` 传入 `reminders`

### Step 8: 设置页面增加 DDL 提醒开关
**文件**: `src/components/HealthReminderSettings.tsx`
- 新增 DDL 提醒开关行（使用 `ddlEnabled` / `toggleDdl`）

### Step 9: 验证
- TypeScript 编译无错误
- ESLint 零错误
- 新作业可配置提醒时间
- 提醒时间到后系统通知弹出
- 设置开关可禁用/启用
