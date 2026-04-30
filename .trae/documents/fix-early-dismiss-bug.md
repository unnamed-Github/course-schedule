# 修复计划：提前下课操作失败 + 按钮移至进度条区域

## Bug 分析

### "操作失败"原因

Supabase 默认对新表启用 RLS（Row Level Security），且无策略时所有写操作被拒绝。`schedule_overrides` 表刚创建，缺少 RLS 策略，导致 INSERT/UPDATE 被拒。

### 修复方案

在 Supabase SQL Editor 中执行：

```sql
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON schedule_overrides FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous insert" ON schedule_overrides FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON schedule_overrides FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete" ON schedule_overrides FOR DELETE TO anon USING (true);
```

> 项目使用 anon key 直连，无用户认证，因此策略直接放行 anon 角色。

## UI 修改：提前下课按钮移至进度条区域

### DayView.tsx

当前进度条区域（L217-224）：
```tsx
{isCurrent && (
  <div className="h-1 bg-gray-100 dark:bg-gray-800">
    <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: course.color }} />
  </div>
)}
```

改为：进度条区域变为一个可点击的条形按钮，包含进度条 + "提前下课"文字：

```tsx
{isCurrent && !isEndedEarly && (
  <div
    onClick={(e) => { e.stopPropagation(); handleOverrideAction(schedule.id, 'ended_early') }}
    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
    style={{ backgroundColor: course.color }}
  >
    <div className="flex-1 h-1 rounded-full bg-white/30">
      <div className="h-full rounded-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }} />
    </div>
    <span className="text-[10px] text-white font-medium whitespace-nowrap">提前下课</span>
  </div>
)}
{isCurrent && isEndedEarly && (
  <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: '#10B981' }}>
    <span className="text-[10px] text-white font-medium">已下课</span>
  </div>
)}
```

同时从标题区域的 badge 中移除"提前下课"文字，恢复为原来的"进行中 X%"：

```tsx
{isCurrent && !isEndedEarly && (
  <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: course.color }}>
    进行中 {Math.round(progress)}%
  </span>
)}
```

### WeekView.tsx

同样修改：WeekView 中没有进度条，但 active 状态的卡片有高亮边框。在卡片名称下方已有"提前下课"文字按钮，保持不变即可（WeekView 没有进度条区域）。

## 步骤

1. 提供 RLS 策略 SQL 给用户执行
2. DayView.tsx：进度条区域改为可点击的"提前下课"按钮
3. DayView.tsx：标题 badge 恢复为"进行中 X%"
4. 验证构建通过
