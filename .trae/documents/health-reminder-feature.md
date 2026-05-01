# 健康提醒功能实施计划

## 概述
为 Timer（课表·竹）应用增加三项健康提醒功能：喝水提醒、提肛提醒、熬夜提醒，使用浏览器 Web Notification API 实现系统级通知。

## 实施步骤

### Step 1: 扩展用户设置存储
**文件**: `src/lib/user-settings.ts`
- 新增设置 key 常量（water_reminder_enabled, water_interval, kegel_reminder_enabled, kegel_times, night_reminder_enabled, night_start, silent_start, silent_end）
- 新增默认值导出

### Step 2: 创建通知工具模块
**文件**: `src/lib/notification-utils.ts`（新建）
- `requestNotificationPermission()` — 请求系统通知权限
- `sendNotification(title, body)` — 发送系统通知
- `isNotificationSupported()` — 检测浏览器支持

### Step 3: 创建文案配置
**文件**: `src/lib/reminder-messages.ts`（新建）
- 喝水提醒文案池（随机轮换，8+ 条）
- 提肛提醒文案（含动作引导）
- 熬夜提醒文案池

### Step 4: 创建 ReminderProvider
**文件**: `src/components/ReminderProvider.tsx`（新建）
- 管理三个提醒的定时逻辑
- 静默时段检测
- 喝水：setInterval（默认 40 分钟）
- 提肛：计算每日时间点（默认 10:00, 15:00, 20:00）
- 熬夜：23:30-00:30 周期性提醒（每 15 分钟）
- 读取用户设置，支持运行时开关

### Step 5: 集成到应用布局
**文件**: `src/app/layout.tsx`
- 将 ReminderProvider 包裹进 Provider 层
- 首次加载时请求通知权限

### Step 6: 创建设置 UI 组件
**文件**: `src/components/HealthReminderSettings.tsx`（新建）
- 喝水提醒：开关 + 间隔选择（30/40/50/60 分钟）
- 提肛提醒：开关 + 时间点编辑
- 熬夜提醒：开关
- 静默时段：开始/结束时间选择
- 通知权限状态 + 请求按钮

### Step 7: 集成到 Settings 页面
**文件**: `src/app/settings/page.tsx`
- 在现有设置区域中新增"健康提醒"板块
- 引入 HealthReminderSettings 组件

### Step 8: 验证
- TypeScript 编译无错误
- 通知权限请求正常
- 三个提醒按预期触发
- 静默时段正确阻止提醒
- 设置开关实时生效
