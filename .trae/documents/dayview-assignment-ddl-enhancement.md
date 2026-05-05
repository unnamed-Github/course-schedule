# 日视图作业截止栏目增强 + DDL 提醒自定义

## 需求拆解

### 需求 1：日视图统计卡片增加「DDL 提醒量」
- 当前：一日纵览统计卡片只显示「作业截止」数量
- 目标：增加一个「DDL 提醒」统计卡片，显示当日有提醒即将触发的作业数量

### 需求 2：今日截止作业全部列出，不省略
- 当前：`todayAssignments.slice(0, 3)` 只显示前 3 项，超过显示"还有 N 项…"
- 目标：去掉 `slice(0, 3)` 限制，全部列出

### 需求 3：修复逾期判断 Bug
- 当前 Bug：日视图中所有今日截止的 pending 作业都标为"逾期"（红色 `--accent-danger`），但查看明天的作业时也显示"逾期"
- 根因：[DayView.tsx:380](file:///Users/jack/Documents/trae_projects/Timer/src/components/DayView.tsx#L380) 硬编码显示"逾期"文字，没有根据实际时间判断
- 修复：根据当前时间与 `due_date` 的比较，区分三种状态：
  - **已逾期**：当前时间 > due_date（红色 `--accent-danger`）
  - **即将截止**：当前时间 < due_date 且差值 < 24h（暖色 `--accent-warm`）
  - **待提交**：距离截止 > 24h（普通色）

### 需求 4：DDL 提醒设置支持自定义添加和修改时间
- 当前：DDL 提醒只能从 5 个固定选项（30分钟/1小时/3小时/1天/3天）中选择
- 目标：在现有 chip 多选基础上，增加自定义时间输入功能，用户可以：
  - 添加自定义提前提醒时间（输入分钟数或选择小时/天）
  - 修改/删除已选的自定义提醒时间

---

## 实施步骤

### 步骤 1：修复日视图逾期判断 Bug + 全部列出作业

**文件**: [DayView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/DayView.tsx)

1. 在 `todayAssignments` 列表渲染中，去掉 `slice(0, 3)` 限制，改为 `.map()` 全部渲染
2. 去掉"还有 N 项…"的省略提示
3. 为每个作业计算真实状态：
   ```typescript
   const now = Date.now()
   const dueMs = new Date(a.due_date).getTime()
   const isOverdue = dueMs < now && a.status === 'pending'
   const isNear = !isOverdue && dueMs - now < 86400000 && a.status === 'pending'
   ```
4. 根据状态显示不同标签：
   - 逾期 → 红色 `--accent-danger` 显示"逾期"
   - 即将截止 → 暖色 `--accent-warm` 显示倒计时（如"3小时后"）
   - 待提交 → 普通色显示截止时间
5. 显示每项作业的具体截止时间（如"14:00"）

### 步骤 2：日视图统计卡片增加「DDL 提醒」项

**文件**: [DayView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/DayView.tsx)

1. 将统计卡片从 3 列改为 4 列（`grid-cols-4`）
2. 新增 DDL 提醒量计算逻辑：
   - 筛选当日有 `reminders` 且 `status === 'pending'` 的作业
   - 对每个作业的每个 reminder，计算触发时间 `due_date - reminder * 60000`
   - 如果触发时间的日期等于当前查看日期，计入提醒量
3. 新增统计卡片，图标用 `Bell`（lucide-react），颜色用 `--accent-info`

### 步骤 3：DDL 提醒选项支持自定义时间

**文件**: [types.ts](file:///Users/jack/Documents/trae_projects/Timer/src/lib/types.ts)

1. `DDL_REMINDER_OPTIONS` 保持不变（作为预设选项）
2. 新增辅助函数 `formatReminderLabel(minutes: number): string`，用于将自定义分钟数转为可读标签

**文件**: [AssignmentsView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/AssignmentsView.tsx)

1. 在 DDL 提醒 chip 选择区域后，增加「+ 自定义」按钮
2. 点击后弹出输入框，支持输入分钟数（或提供小时/天的快捷换算）
3. 自定义时间添加后，以 chip 形式显示在选项列表中，带删除按钮
4. 预设选项和自定义选项统一用 `reminders: number[]` 存储
5. 在作业详情展示区，自定义提醒也以 badge 显示，标签用 `formatReminderLabel` 生成

**文件**: [WeekView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/WeekView.tsx)

1. 同步修改快速添加弹窗中的 DDL 提醒选择器，增加自定义时间功能

**文件**: [courses/[id]/page.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/app/courses/[id]/page.tsx)

1. 同步修改课程详情页的作业添加/编辑表单中的 DDL 提醒选择器

### 步骤 4：DDL 提醒设置页面增强

**文件**: [HealthReminderSettings.tsx](file:////Users/jack/Documents/trae_projects/Timer/src/components/HealthReminderSettings.tsx)

1. 在 DDL 提醒开关下方，增加默认提醒时间配置区域（当开关开启时显示）
2. 显示预设选项 + 已添加的自定义选项，每个选项可删除
3. 增加「+ 添加提醒时间」按钮，支持输入自定义分钟数
4. 默认提醒时间存储到 `user_settings`（key: `ddl_reminder_defaults`，value: JSON 数组）
5. 创建新作业时，自动应用默认提醒时间

**文件**: [user-settings.ts](file:///Users/jack/Documents/trae_projects/Timer/src/lib/user-settings.ts)

1. 在 `HEALTH_REMINDER_DEFAULTS` 中增加 `ddl_reminder_defaults` 默认值

**文件**: [ReminderProvider.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/ReminderProvider.tsx)

1. 在 `ReminderContextType` 中增加 `ddlReminderDefaults` 和 `setDdlReminderDefaults` 方法
2. 从 `user_settings` 读取默认提醒时间配置

### 步骤 5：验证

1. `npx tsc --noEmit` 编译检查
2. 手动验证：
   - 日视图查看今天，作业正确区分逾期/即将截止/待提交
   - 日视图查看明天，作业不显示"逾期"
   - 所有今日截止作业全部列出
   - DDL 提醒统计卡片正确显示
   - 自定义提醒时间可以添加、删除
   - 设置页可以配置默认提醒时间

---

## 涉及文件清单

| 文件 | 修改类型 |
|------|----------|
| `src/components/DayView.tsx` | 修改：逾期判断修复 + 全部列出 + DDL提醒统计 |
| `src/lib/types.ts` | 修改：增加 `formatReminderLabel` 辅助函数 |
| `src/components/AssignmentsView.tsx` | 修改：DDL 提醒选择器增加自定义时间 |
| `src/components/WeekView.tsx` | 修改：快速添加弹窗 DDL 提醒增加自定义时间 |
| `src/app/courses/[id]/page.tsx` | 修改：课程详情页 DDL 提醒增加自定义时间 |
| `src/components/HealthReminderSettings.tsx` | 修改：DDL 设置增加默认提醒时间配置 |
| `src/lib/user-settings.ts` | 修改：增加 `ddl_reminder_defaults` 默认值 |
| `src/components/ReminderProvider.tsx` | 修改：增加默认提醒时间的 Context 方法 |
