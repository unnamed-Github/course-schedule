# 课程高亮开关无效 Bug 修复计划

## Bug 描述

设置页面的"当前课程高亮"开关关闭后，周视图和日视图仍然高亮当前课程。

## 根因分析

两个组件都正确读取了 `highlightEnabled` 状态并监听了 `storage` 事件，但在判断是否高亮时**从未使用**该变量：

### WeekView（第 188、200 行）
```js
const active = isCurrentCourse(schedule)  // 没有检查 highlightEnabled
// active 用于 boxShadow 高亮
```

### DayView（第 133 行）
```js
const isCurrent = isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
// 没有检查 highlightEnabled
// isCurrent 用于边框颜色、阴影、进度条、时间颜色、"进行中"标签
```

## 修复方案

### 修改文件

1. `course-schedule/src/components/WeekView.tsx`
2. `course-schedule/src/components/DayView.tsx`

### 步骤 1：修复 WeekView

将第 188 行：
```js
const active = isCurrentCourse(schedule)
```
改为：
```js
const active = highlightEnabled && isCurrentCourse(schedule)
```

### 步骤 2：修复 DayView

将第 133 行：
```js
const isCurrent = isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
```
改为：
```js
const isCurrent = highlightEnabled && isToday && currentPeriod !== null && currentPeriod >= schedule.start_period && currentPeriod <= schedule.end_period
```

### 步骤 3：测试验证

- 启动开发服务器
- 在设置中关闭"当前课程高亮"
- 切换到周视图，确认当前课程不再高亮（无橙色边框）
- 切换到日视图，确认当前课程不再高亮（无彩色边框、无进度条、无"进行中"标签）
- 在设置中重新打开高亮，确认恢复正常
- 运行 `npm run build` 确保无类型错误

### 步骤 4：推送到 GitHub

提交并推送修复。
