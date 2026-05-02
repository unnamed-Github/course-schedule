# 喝水/提肛倒计时打卡功能实施计划

## 概述
在主界面新增可视化倒计时打卡组件，展示距下次喝水/提肛还有多久，用户完成后可手动打勾重置计时器。

## 实施步骤

### Step 1: 扩展 ReminderProvider 暴露打卡状态
**文件**: `src/components/ReminderProvider.tsx`
- 新增 ref：`lastWaterCheckRef`（用户最近一次打卡时间戳）、`lastKegelCheckRef`
- 新增函数 `checkWater()`：记录当前时间为最近喝水时间，重置 lastWaterRef
- 新增函数 `checkKegel()`：记录当前时间为最近提肛时间，刷新 lastKegelDayRef
- 新增计算值 `nextKegelTime`：基于 kegelTimes 计算下一个未过的时间点（如当前 11:00，时间点为 10:00/15:00/20:00，则下一个是 15:00）
- 新增计算值 `waterProgress`：距上次喝水间隔 / 目标间隔（0~1 进度）
- Context 类型扩展：`checkWater`、`checkKegel`、`lastWaterCheck`、`lastKegelCheck`、`nextKegelMinutes`

### Step 2: 创建 HealthChecklist 组件
**文件**: `src/components/HealthChecklist.tsx`（新建）
- 接收 `useReminder()` 的状态
- 两行卡片布局：
  - 💧 喝水：圆形进度环 + "距下次提醒 X 分钟" + ✅ 打卡按钮
    - 若已打卡（距上次 < 间隔），打勾按钮变绿色实心，提示"已打卡 ✅"
  - 💪 提肛：显示下一个提醒时间 + ✅ 打卡按钮
    - 若当天所有时间点未过，显示"下一个提醒 15:00"
    - 若当天已全部完成，显示"今天已完成 ✅"
- 使用 `useRef` + `setInterval` 每秒更新倒计时
- 样式与 WarmthBanner 风格保持一致（卡片 + border）

### Step 3: 集成到 MainView
**文件**: `src/components/MainView.tsx`
- 导入 `HealthChecklist`
- 在 `WarmthBanner` 下方插入 `<HealthChecklist />`

### Step 4: 打卡时同步重置提醒计时器
- 打卡不仅标记 UI 完成，同时重置 `lastWaterRef` / `lastKegelDayRef`，确保系统通知也按新的周期重新计时

### Step 5: 验证
- TypeScript 编译无错误
- ESLint 零错误
- 倒计时每秒更新
- 打卡按钮正确切换状态
- 提肛下一个时间点计算正确（跨天场景）
