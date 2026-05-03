# 日视图首屏升级 — 当日简报 + 栏目归位

## 目标

1. **周/日视图交换位置**：默认打开日视图，Tab 顺序改为"日→周→课程→作业→备忘"
2. **日视图改造为"当日简报"**：将所有顶部栏目移入日视图，变成一站式当日总览
3. **其他视图精简**：周视图/课程/作业/备忘只显示各自的核心内容，不再挂载 5 个 banner

---

## 当前架构一览

```
MainView
├── LateNightCare        ← 全局栏 1
├── WarmthBanner         ← 全局栏 2
├── WeatherBanner        ← 全局栏 3
├── HealthChecklist      ← 全局栏 4
├── BreakTip             ← 全局栏 5
└── AnimatePresence (视图区)
    ├── WeekView
    ├── DayView
    ├── CoursesPage
    ├── AssignmentsView
    └── MemosView
```

所有 5 个 banner 是全局可见的，与视图切换无关。

---

## 目标架构

```
MainView
└── AnimatePresence (视图区)
    ├── DayView（首屏）          ← 包含全部 5 个 banner + 新增简报
    ├── WeekView（纯课表网格）    ← 仅周切换 + 课表网格
    ├── CoursesPage              ← 无变化
    ├── AssignmentsView          ← 无变化
    └── MemosView                ← 无变化
```

---

## 详细改动计划

### 变更 1：默认视图 + Tab 顺序交换

**文件**：`src/components/ViewContext.tsx`
- 默认值 `'week'` → `'day'`

**文件**：`src/components/TopBar.tsx`
- TABS 数组第 0/1 项交换：
  ```
  旧: [{ id: 'week', label: '周视图' }, { id: 'day', label: '日视图' }, ...]
  新: [{ id: 'day', label: '日视图' }, { id: 'week', label: '周视图' }, ...]
  ```

### 变更 2：从 MainView 移除所有 5 个 banner

**文件**：`src/components/MainView.tsx`
- 删除 WarmthBanner / WeatherBanner / HealthChecklist / LateNightCare / BreakTip 的 import 和渲染
- MainView 精简为仅 `<AnimatePresence>` + 视图切换

### 变更 3：DayView 改造为"今日简报"

**文件**：`src/components/DayView.tsx` — 大规模改造

#### 3a. 导入新增组件
- 添加 WarmthBanner、WeatherBanner、HealthChecklist、BreakTip、LateNightCare 的 import

#### 3b. DayView 新布局结构

```tsx
<div className="max-w-3xl mx-auto space-y-3">
  {/* ─── 今日简报头部 ─── */}
  <div>日期导航 (已有)</div>

  {/* ─── 横幅区（从 MainView 迁移）─── */}
  <LateNightCare />     {/* 仅深夜显示 */}
  <WarmthBanner />      {/* 问候语 + 当前课程进度 */}
  <WeatherBanner />     {/* 天气/UV/AQI */}
  <BreakTip />          {/* 课间休息提醒 */}

  {/* ─── 一日纵览卡片（新增）─── */}
  <DailyStats />        {/* 今日统计：X 节课 / X 项作业截至 / X 条备忘 */}

  {/* ─── 健康打卡（迁移）─── */}
  <HealthChecklist />

  {/* ─── 今日课程列表（已有，调整样式）─── */}
  {sortedSchedules.length === 0 ? (
    <空状态 />
  ) : (
    <课程卡片列表 />
  )}

  {/* ─── 今日作业速览（新增）─── */}
  <TodayAssignments />  {/* 仅列出今天截止的作业 */}

  {/* ─── 今日备忘速览（新增）─── */}
  <TodayMemos />        {/* 仅列出今天的备忘 */}
</div>
```

#### 3c. DailyStats 卡片设计（DayView 内的局部组件）

一个 3 列统计卡片，每列一个数字 + 标签：

```
┌────────────────────────────────────────┐
│  📚 3 节课  │  📋 2 项作业  │  📝 1 条备忘 │
└────────────────────────────────────────┘
```

纯展示，从已有数据计算（和 DayView 共享同一个 courses/schedules/assignments/memos state）。

#### 3d. TodayAssignments 卡片

- 新增独立 `useEffect` 加载今日作业（如果 DayView 已经加载 assignments，直接过滤）
- 显示截止时间最近的 3 条待提交作业
- 如果无作业截止今天，显示"今天无作业截止 🎉"

#### 3e. TodayMemos 卡片

- 从 memos state 过滤属于今天课程 schedule 的备忘
- 显示前 3 条
- 如果无备忘，显示"今天还没有备忘"

#### 3f. 日期导航保留
- 保留现有 `< > 日期 周X` 导航
- 添加 `isToday` 判断，"回到今天"按钮保留

---

### 变更 4：WeekView 视图中加入独立的周切换

DayView 里的 WarmthBanner 中的周切换功能需要保留在 WeekView 自身已有一份，无需额外处理。

---

### 变更 5：全局精简

**无其他文件改动**：WarmthBannerContext 和 HealthChecklist 的 ReminderProvider 仍在 layout.tsx 中提供，无需移除。

---

## 执行顺序

| 步骤 | 内容 | 文件 |
|------|------|------|
| 1 | ViewContext 默认值改为 'day' | `ViewContext.tsx` |
| 2 | TopBar Tab 顺序交换 | `TopBar.tsx` |
| 3 | MainView 移除 5 个 banner | `MainView.tsx` |
| 4 | DayView 接入 5 个 banner + 新增 DailyStats / TodayAssignments / TodayMemos | `DayView.tsx` |
| 5 | `tsc --noEmit` + `npm run build` 验证 | - |
| 6 | 升版本 + commit + push | - |

---

## 影响范围

| 文件 | 操作 | 风险 |
|------|------|------|
| `src/components/ViewContext.tsx` | 改一行默认值 | 🟢 低 |
| `src/components/TopBar.tsx` | 交换 2 项 TABS | 🟢 低 |
| `src/components/MainView.tsx` | 删除 10 行 import + 5 行渲染 | 🟢 低 |
| `src/components/DayView.tsx` | +约 80 行（banner 引入 + 3 个简报卡片） | 🟡 中 |
| 其他文件 | **不涉及** | - |

---

## 不涉及

- WarnthBannerContext / ReminderProvider / HealthReminderSettings 等 Provider 不动 — 都挂在 layout.tsx
- WeekView / CoursesPage / AssignmentsView / MemosView 的渲染内容不限
- BottomNav / FloatingSettingsButton / SettingsModal 不变
- Glass 效果完全不受影响
