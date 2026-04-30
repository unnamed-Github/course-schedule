# 实施计划：节日海报弹窗 + 周视图快捷添加 + 设置溢出修复

## 概述

三个独立的功能改进，涉及 3-4 个文件的修改和 1 个新文件的创建。

---

## 任务一：关键节日弹出海报界面

### 目标
在用户进入应用时，如果当天是关键节日（如元旦、国庆、劳动节等），自动弹出一个精美的节日海报弹窗。

### 现状分析
- `src/lib/festivals.ts` 已定义 `FESTIVALS` 数组（12 个节日），包含 `emoji`、`greeting`、`subGreeting`
- `src/components/FestivalEasterEgg.tsx` 目前只在 TopBar 旁边显示一个小型的行内问候文本
- `src/app/page.tsx` 中使用了 `EasterEgg`（随机温柔话语），但没有节日弹窗
- 项目已有通用 `Modal` 组件，支持 `AnimatePresence` 动画

### 实现方案

#### 文件：新建 `src/components/FestivalPoster.tsx`
- 使用 `getTodayFestival()` 检测今天是否有节日
- 如果有节日，在页面加载后自动弹出 Modal
- 海报内容设计：
  - 大号 emoji
  - 节日问候语（`greeting`）
  - 副标题（`subGreeting`）
  - 温馨的背景装饰（CSS 渐变或点状装饰）
  - "知道了" 关闭按钮
- 使用 `localStorage` 记录当天是否已展示过（key: `festival_poster_shown_YYYY-MM-DD`），同一天不重复弹出
- 使用 framer-motion 的 spring 动画做入场效果

#### 文件：修改 `src/app/page.tsx`
- 引入 `<FestivalPoster />` 组件，放在 `</MainView>` 之后

### 关键设计细节
- z-index 设为 80（高于 SettingsModal 的 70）
- 海报宽度 `max-w-sm`，居中显示
- 使用 `var(--accent-warm)` 和节日氛围色
- 淡入 + 弹性缩放入场动画
- 今天日期存入 localStorage，避免同一天反复弹出

---

## 任务二：周视图课程展开时添加快捷添加作业和心情备忘的界面

### 目标
在周视图中点击课程方格展开详情后，除了展示已有作业和备忘外，增加**直接添加作业**和**心情备忘**的内联快捷表单。

### 现状分析
- `src/components/WeekView.tsx` 在课程展开区域（L362-L471）展示：
  - 教师、教室/时间信息
  - 已有的作业列表（标题 + 截止倒计时）
  - 已有的备忘列表（emoji + 内容）
  - 操作按钮（取消本课 / 提前下课 / 恢复）
- `src/lib/data.ts` 中的 `createAssignment()` 和 `createMemo()` API 已可用
- `AssignmentsView` 和 `MemosView` 各自有添加弹窗（使用 Modal 组件），但那是全页面级别的

### 实现方案

#### 文件：修改 `src/components/WeekView.tsx`

##### 2a. 新增状态变量
在 `WeekView` 组件中新增：
```typescript
// 快捷添加作业状态
const [showQuickAssign, setShowQuickAssign] = useState(false)
const [quickAssignTitle, setQuickAssignTitle] = useState('')
const [quickAssignDueDate, setQuickAssignDueDate] = useState('')
// 快捷添加备忘状态
const [showQuickMemo, setShowQuickMemo] = useState(false)
const [quickMemoContent, setQuickMemoContent] = useState('')
const [quickMemoEmoji, setQuickMemoEmoji] = useState('📝')
```

##### 2b. 新增添加入口按钮
在展开详情的操作按钮区域（L429-471 附近），在"取消本课"按钮上方或旁边新增两个按钮：
- 「+ 作业」按钮（带 ClipboardList 图标）
- 「+ 备忘」按钮（带 StickyNote 图标）
点击后分别展开对应的快捷表单

##### 2c. 快捷添加作业表单
点击"+ 作业"后，在操作按钮区域下方展开：
```
┌─────────────────────────────┐
│ 作业标题: [____________]    │
│ 截止日期: [📅 选择日期]    │
│ [确认添加]  [取消]         │
└─────────────────────────────┘
```
- 使用 `createAssignment()` 创建，默认 `course_id` 为当前课程 ID
- 添加成功后刷新 assignments 列表，收起表单

##### 2d. 快捷添加备忘表单
点击"+ 备忘"后，在操作按钮区域下方展开：
```
┌─────────────────────────────┐
│ 心情: [📝💡🤔😊😤💪🎉📖✨]  │
│ 内容: [____________]        │
│ [确认添加]  [取消]         │
└─────────────────────────────┘
```
- Emoji 选择器（复用 MemosView 中的 EMOJI_OPTIONS）
- 使用 `createMemo()` 创建，默认 `course_id` 为当前课程 ID
- 添加成功后刷新 memos 列表，收起表单

##### 2e. 数据刷新
添加 `loadAssignments` 和 `loadMemos` 独立刷新函数，避免每次都要 reload 整个 WeekView：
```typescript
const refreshAssignments = () => getAssignments().then(setAssignments)
const refreshMemos = () => getMemos().then(setMemos)
```

##### 2f. 展开状态互斥
当快捷作业表单展开时，快捷备忘表单自动收起（反之亦然），避免两个表单同时展开导致内容过长。

---

## 任务三：设置打开后超出显示范围修复

### 目标
修复 SettingsModal 内容过多导致超出屏幕可视范围，无法滚动查看完整内容的问题。

### 现状分析
- `src/components/Modal.tsx`：弹窗容器固定 `max-w-md rounded-2xl p-6`，没有设置 `max-height` 或 `overflow-y`
- `src/components/SettingsModal.tsx`：
  - 「显示」Tab 内容极为丰富：亮暗模式、高亮开关、问候横幅开关、学期信息（开学日期/周数）、节假日管理（列表+编辑表单）、调休日管理（列表+编辑表单）、版本信息
  - 「数据」Tab 内容较少，但拖拽区域 + 导出按钮也有一定高度
- 在手机屏幕或小视窗下，弹窗内容会超出屏幕底部，用户无法滚动到底部看到完整内容

### 实现方案

#### 文件：修改 `src/components/Modal.tsx`
在弹窗内容区（`motion.div`）添加 `max-height` 和 `overflow-y: auto`：
```tsx
className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
```
- `max-h-[85vh]` 确保弹窗高度不超过视口的 85%，上下保留边距
- `overflow-y-auto` 使内容超过时可滚�动
- 配合现有的 `items-center` flex 布局，弹窗会在视口内垂直居中

#### 文件：修改 `src/components/SettingsModal.tsx`（可选优化）
- 「显示」Tab 内的节假日/调休日列表区域已有 `max-h-40 overflow-y-auto`，无需额外修改
- 整体弹窗滚动由 Modal 组件的 `max-h-[85vh] overflow-y-auto` 处理

---

## 实施步骤

### 步骤 1：修复设置溢出问题
- 修改 `src/components/Modal.tsx`：在弹窗 div 上添加 `max-h-[85vh] overflow-y-auto`

### 步骤 2：创建节日海报组件
- 新建 `src/components/FestivalPoster.tsx`
- 实现节日检测 + 弹出逻辑 + localStorage 防重复 + 精美 UI

### 步骤 3：集成节日海报到首页
- 修改 `src/app/page.tsx`：引入 `<FestivalPoster />`

### 步骤 4：实现周视图快捷添加功能
- 修改 `src/components/WeekView.tsx`：
  - 新增快捷添加状态变量
  - 新增 `refreshAssignments` / `refreshMemos` 独立刷新函数
  - 在展开详情区域新增"+ 作业""+ 备忘"按钮
  - 实现快捷添加作业表单（内联）
  - 实现快捷添加备忘表单（内联，含 emoji 选择）

### 步骤 5：验证
- 运行 `npm run dev` 启动开发服务器
- 验证设置弹窗可滚动
- 验证节日海报正常弹出（可临时修改系统日期测试）
- 验证周视图课程展开后快捷添加功能正常
