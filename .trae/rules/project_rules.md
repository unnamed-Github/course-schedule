# 课表 · 竹 — 项目交接文档

## 项目概述

南科大课表管理应用（course-schedule），支持周视图/日视图查看课程、作业追踪、课堂备忘、学期管理。Next.js 16 App Router 构建，Supabase + 本地双存储模式。

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 样式 | Tailwind CSS v4 |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| 数据库 | Supabase PostgreSQL + 本地内存回退 |
| 类型 | TypeScript |

## 架构原则

### 1. 视图路由：单页 SPA 模式

`MainView.tsx` 通过 `ViewContext` 管理 5 个视图（week / day / courses / assignments / memos），Tab 切换时 `<AnimatePresence key={view}>` 做淡入滑动过渡。

全局组件层级：`LateNightCare` → `WarmthBanner` → `BreakTip` → 当前视图

### 2. 数据层：三层存储

[src/lib/data.ts](file:///Users/jack/Documents/trae_projects/Timer/src/lib/data.ts)
```
内存缓存（5min TTL） → Supabase → localStorage 数组
```

- Supabase 可用时走远程，失败自动降级到本地内存数组
- 写操作双保险：Supabase 写入失败则写本地
- 种子数据：courses + schedules 有默认值，首次启动自动初始化

### 3. 数据模型关系

```
Course (课程)
 ├── 1:N → CourseSchedule (排课实例：周几 + 节次 + 单双周)
 ├── 1:N → Assignment (作业：关联到 schedule_id)
 └── 1:N → Memo (备忘：关联到 schedule_id)
```

- `ScheduleOverride`：单次排课覆盖（取消 / 提前下课）

## 组件文件组织

| 目录 | 用途 |
|------|------|
| `src/app/` | Next.js 页面路由，含 settings/courses/[id]/login 等独立页 |
| `src/components/` | 共享组件，以视图/功能命名 |
| `src/hooks/` | 自定义 Hook |
| `src/lib/` | 业务逻辑：data.ts(数据), types.ts(类型), semester.ts(学期), schedule.ts(排课), constants.ts(常量) |

## 关键约定

### 备忘与作业

- `schedule_id` 必填，关联到具体课时（`CourseSchedule`）
- 课时标签格式：`周三 5-6节（单周）`（非全周时带括号）
- **作业**：按 `course_id` 跨节显示（同课程所有课时都展示）
- **备忘**：按 `schedule_id` 精确匹配（只在关联课时展示）
- 新建时强制选课时（不含空选项），编辑时保留空选项兼容旧数据

### Provider 嵌套顺序

`Theme → Reminder → Toast → WarmthBanner → ViewProvider`

### 样式约定

- 使用 CSS 变量：`var(--bg-card)`、`var(--text-primary)`、`var(--border-light)` 等
- 颜色直接使用 `style={{ color: course.color }}` 形式
- 不支持 inline `@apply`，Tailwind v4 用 utility class

## Git 工作流

每次完成功能后执行：

1. `npx tsc --noEmit` 确认无编译错误
2. 检查 `package.json` 的 version 是否需要升（功能→minor，修复→patch）
3. `git add -A && git commit -m "feat: ..." && git push origin main`
4. 推送前确保 Working Tree Clean

## 版本管理

- 单一数据源：`package.json` 的 `version` 字段
- 发版命令：`npm version patch | minor | major`（自动更新 version + 打 tag）
- Settings 页自动读取，**禁止硬编码版本号**

## AI 会话规范

> 以下规则供所有 AI 会话共享，写入 `.trae/rules/project_rules.md` 后自动生效。

1. **先 build 后 push**：每次改动后必须编译通过才能推送
2. **不建无意义文件**：除非必要，不创建 .md / README 等文档文件
3. **不自动加注释**：不主动在代码中写注释，除非用户要求
4. **遵循现有模式**：新增组件/工具函数时参考已有代码的写法
5. **敏感信息检查**：绝不提交 .env、密钥、token 等
