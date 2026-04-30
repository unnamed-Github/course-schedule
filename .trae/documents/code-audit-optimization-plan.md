# 代码严格审查与多 Agent 并行优化计划

## 项目概述
- **项目名**: course-schedule（课表·竹）
- **技术栈**: Next.js 16.2.4 + React 19.2.4 + TypeScript 5 + Tailwind CSS 4 + Supabase
- **结构**: App Router 模式，约 40+ 源文件

---

## 审查发现的关键问题概览

| 类别 | 问题数 | 严重度 |
|------|--------|--------|
| 重复代码 | 5+ 处 | 🔴 高 |
| 类型安全 | 6+ 处 | 🔴 高 |
| 安全漏洞 | 3 处 | 🔴 高 |
| 性能问题 | 4 处 | 🟡 中 |
| 代码架构 | 3 处 | 🟡 中 |
| 代码质量 | 8+ 处 | 🟡 中 |

---

## A 组：安全与数据层优化

### A1. 消除硬编码密钥和密码
- **文件**: `src/lib/data.ts` L63、`src/app/api/auth/login/route.ts` L7
- **问题**: 
  - 密码哈希 `f0e4c2f76c58916ec...` 硬编码在代码中
  - 默认密码 `zhubamboo` 硬编码
- **修复**: 将所有密钥移至环境变量，代码中不保留任何默认值

### A2. 收紧 Supabase RLS 策略
- **文件**: `supabase-schema.sql` L80-L86
- **问题**: 所有表使用 `USING (true) WITH CHECK (true)` 完全开放
- **修复**: 添加 JWT 验证，限制 anon key 权限

### A3. 消除重复的默认配置定义
- **文件**: `data.ts`、`semester.ts`、`semester-db.ts`
- **问题**: `DEFAULT_HOLIDAYS`、`DEFAULT_MAKEUP_DAYS`、`DEFAULT_SEMESTER` 在 3 个文件中各定义一遍
- **修复**: 统一收敛到 `semester.ts` 作为唯一数据源，其他文件从中引用

### A4. 完善错误处理
- **文件**: `data.ts`、多个组件文件
- **问题**: 大量 `catch {}` 空捕获块，`catch(() => {})` 吞掉所有错误
- **修复**: 
  - 添加结构化错误日志
  - 在 data.ts 中引入统一错误处理包装器
  - 给用户可见的降级提示

---

## B 组：代码架构与拆分

### B1. 消除 SettingsPage / SettingsModal 重复
- **文件**: `SettingsModal.tsx` (322行)、`SettingsPage.tsx` (289行)
- **问题**: 两份代码几乎完全相同（学期配置、导入导出、节假日编辑）
- **修复**: 
  - 提取共用逻辑：`useSemesterConfig` hook
  - 提取 `ImportExportPanel`、`SemesterInfoPanel`、`HolidayEditor`、`MakeupDayEditor` 四个子组件
  - SettingsPage 和 SettingsModal 仅做布局差异

### B2. 拆分巨型 WeekView 组件 (663行)
- **文件**: `WeekView.tsx`
- **问题**: 
  - 包含数据加载、课程网格渲染、详情展开、快捷添加、覆盖操作等多个职责
  - `loadOverrides` 逻辑重复定义两次
- **修复**: 拆分为：
  - `useWeekViewData` - 数据加载 hook
  - `ScheduleGrid` - 课表网格组件
  - `ScheduleCard` - 单个课程卡片（含展开详情）
  - `QuickAddForms` - 快捷添加作业/备忘表单
  - `WeekNavigator` - 周切换控件

### B3. 拆分巨型 CoursesPage 组件 (544行)
- **文件**: `app/courses/page.tsx`
- **问题**: 单文件包含课程列表、CRUD、导入导出、进度条、作业展示
- **修复**: 拆分为：
  - `CourseCard` - 课程卡片（含进度点阵、标签、进度条）
  - `CourseEditModal` - 编辑弹窗
  - `CourseAddModal` - 添加弹窗
  - `ImportPreviewDialog` - 导入预览

### B4. 提取共享常量与工具函数
- **文件**: 多个组件
- **问题**: 
  - `EMOJI_OPTIONS` 在 3 个文件中各定义一遍
  - `DAY_MAP` / `DAY_LABELS` 在 4 个文件中各定义一遍
  - `countdown` 函数在 2 个文件中各定义一遍
- **修复**: 统一放到 `src/lib/constants.ts` 和 `src/lib/utils.ts`

---

## C 组：类型安全与代码质量

### C1. 消除 `as any` 类型断言
- **文件**: `SettingsModal.tsx` L88、L148、`SettingsPage.tsx` L81、L148
- **问题**: `saveSemesterConfig(updates as any)` 和 `saveSemesterConfig({ semesterStart: e.target.value } as any)` 绕过类型检查
- **修复**: 补全 `updateSemesterConfigToDB` 的类型签名，让 `Partial` 类型正确传递

### C2. 替换不可靠的 `crypto.randomUUID()`
- **文件**: `data.ts` L48
- **问题**: `crypto.randomUUID()` 在部分环境不可用
- **修复**: 使用 `nanoid` 或自定义 UUID 生成器，或在 Supabase 可用时使用 `gen_random_uuid()`

### C3. 添加 React Error Boundary
- **文件**: 新增
- **问题**: 当前无任何错误边界，组件崩溃会导致整个页面白屏
- **修复**: 在 layout 中添加 `ErrorBoundary`，各视图模块添加局部边界

### C4. 修复未使用的变量和导入
- **文件**: `DayView.tsx`、`WarmthBanner.tsx`
- **问题**: 
  - `DayView.tsx` 中 `nowMinutes` state 声明但未使用
  - `WarmthBanner.tsx` 中有未使用的 `getCurrentCourseProgress` 函数
  - `CourseDetailPage.tsx` 中 `Check` 图标导入但可能重复

---

## D 组：性能与 React 19 现代化

### D1. 使用 React 19 `use()` hook 优化数据获取
- **文件**: `app/page.tsx`、`app/day/page.tsx`
- **问题**: 使用了 async Server Component + try/catch 但数据也可通过 `use()` 在 Client Component 中获取
- **修复**: 评估是否可以将数据预加载用 `use()` 替代 `useEffect + useState`

### D2. 优化重复的 loadOverrides 调用
- **文件**: `WeekView.tsx` L64-88、L114-126
- **问题**: `loadOverrides` 在 `useEffect` 依赖 `weekRange` 时重复调用，且逻辑与声明在 `loadData` 时执行重复
- **修复**: 合并两个 useEffect，统一数据加载流程

### D3. 消除动画重叠
- **文件**: `layout.tsx` 的 `PageTransition` + `MainView.tsx` 的 `AnimatePresence`
- **问题**: layout 中有路由级页面过渡动画，MainView 中又有视图切换动画，可能导致双重动画
- **修复**: 评估层级，确保二者不冲突；可使用 `mode="wait"` 或 `layout` 动画

### D4. 图片与静态资源优化
- **文件**: `next.config.ts`
- **问题**: 配置文件为空，未启用图片优化、压缩等 Next.js 内置优化
- **修复**: 配置 `images`、`compress`、`poweredByHeader: false` 等

---

## E 组：测试与 CI/CD

### E1. 添加 TypeScript 严格检查脚本
- **问题**: `tsconfig.json` 中 `strict: true` 但无专门检查脚本
- **修复**: 在 `package.json` 中补充 `"typecheck": "tsc --noEmit"` 脚本

### E2. 修复 ESLint 配置兼容性
- **文件**: `eslint.config.mjs`
- **问题**: 缺少 `eslint-disable` 对 React 19 hooks 规则的适配
- **修复**: 确保 ESLint 与 React 19 兼容

---

## 执行策略：多 Agent 并行

### 第一阶段（并行执行）
| Agent | 任务 | 文件范围 |
|-------|------|----------|
| Agent-A | A1+A2+A3（安全修复 + 配置统一） | `data.ts`, `semester.ts`, `semester-db.ts`, `login/route.ts`, `supabase-schema.sql` |
| Agent-B | A4+B4（错误处理 + 常量提取） | `data.ts`, 新建 `constants.ts`, `utils.ts` |
| Agent-C | C1+C2+C3（类型安全 + Error Boundary） | `SettingsModal.tsx`, `SettingsPage.tsx`, `data.ts`, layout 相关 |

### 第二阶段（并行执行）
| Agent | 任务 | 文件范围 |
|-------|------|----------|
| Agent-D | B1（消除 SettingsPage/Modal 重复） | `SettingsModal.tsx`, `SettingsPage.tsx` |
| Agent-E | B2（拆分 WeekView） | `WeekView.tsx` |
| Agent-F | B3+B4（拆分 CoursesPage + 常量应用） | `app/courses/page.tsx`, 各组件 |

### 第三阶段（并行执行）
| Agent | 任务 | 文件范围 |
|-------|------|----------|
| Agent-G | D1+D2+D3（React 19 优化 + 性能） | `page.tsx`, `WeekView.tsx`, `MainView.tsx`, `layout.tsx` |
| Agent-H | D4+E1+E2（配置优化 + 脚本） | `next.config.ts`, `package.json`, `eslint.config.mjs` |

### 第四阶段（验证）
- 运行 `npm run typecheck`
- 运行 `npm run lint`
- 运行 `npm run build` 确保构建通过

---

## 影响范围评估

| 变更类型 | 文件数 | 风险 |
|----------|--------|------|
| 纯新增文件（常量/工具/hooks） | 5-8 | 🟢 低 |
| 重构已有组件（拆分） | 4-6 | 🟡 中 |
| 修改数据层逻辑 | 3-4 | 🟡 中 |
| 安全配置变更 | 2-3 | 🔴 需要验证 |
| 配置/脚本变更 | 3 | 🟢 低 |

---

## 回滚策略
- 所有变更通过 git 管理，每个阶段提交前预留 checkpoint
- 安全变更先验证本地构建，再部署
- 拆分组件保持对外 API 完全兼容
