# 修改计划：取消本课每节课可用 + 提前下课移至"进行中"标签

## 需求

1. **取消本课**：每节课都可以操作（去掉"仅今天/未来可操作"的限制）
2. **提前下课**：从展开详情区移到"进行中"标签旁边，变成可点击的按钮

## 具体步骤

### 步骤 1：DayView.tsx — 移除 canOperate 对取消本课的限制

- 删除 `isViewingTodayOrFuture` 和 `canOperate` 变量
- "取消本课"按钮条件：`!isCancelled`（只要没被取消就可以操作）
- "提前下课"按钮从展开详情区移除

### 步骤 2：DayView.tsx — 提前下课移至"进行中"标签

当前代码（L259-261）：
```tsx
{isCurrent && (
  <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: course.color }}>进行中 {Math.round(progress)}%</span>
)}
```

改为：当课程正在进行且未提前下课时，显示"进行中 X% · 提前下课"可点击标签；已提前下课时显示"已下课"标签（替代原来的"进行中"）。

```tsx
{isCurrent && !isEndedEarly && (
  <span
    onClick={(e) => { e.stopPropagation(); handleOverrideAction(schedule.id, 'ended_early') }}
    className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium cursor-pointer hover:opacity-80"
    style={{ backgroundColor: course.color }}
  >
    进行中 {Math.round(progress)}% · 提前下课
  </span>
)}
{isCurrent && isEndedEarly && (
  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#10B981', color: 'white' }}>已下课</span>
)}
```

### 步骤 3：DayView.tsx — 展开详情区操作按钮简化

展开详情区只保留：
- 已有 override → 显示"恢复本课"/"撤销下课"
- 无 override → 只显示"取消本课"（提前下课已移走）

### 步骤 4：WeekView.tsx — 同样修改

与 DayView 对称：
- 移除 `isViewingTodayOrFuture` 和 `canOperate`
- "取消本课"条件改为 `!isCancelled`
- "提前下课"从展开详情区移至课程卡片的"已下课"标签位置（WeekView 没有"进行中"标签，但 active 状态时有高亮边框，在卡片名称下方显示可点击的"提前下课"小按钮）
- 展开详情区只保留"取消本课"和恢复按钮

WeekView 中"提前下课"的展示方式：当课程处于 active（当前正在上）且未提前下课时，在课程名下方显示可点击的"提前下课"文字按钮；已提前下课时显示"已下课"。

### 步骤 5：验证构建通过
