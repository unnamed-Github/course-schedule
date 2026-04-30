# Tasks

- [ ] Task 1: 项目初始化与 GitHub 托管
  - [ ] 1.1 使用 `create-next-app` 创建 Next.js 14+ 项目，启用 TypeScript 和 Tailwind CSS
  - [ ] 1.2 初始化 Git 仓库，创建 GitHub 远程仓库并推送初始代码
  - [ ] 1.3 配置 `.gitignore`、`.env.example`、ESLint、Prettier
  - [ ] 1.4 在 Supabase 控制台创建项目，获取 API Key 和数据库连接串，写入 `.env.local`
  - [ ] 1.5 安装并配置 Supabase JS SDK (`@supabase/supabase-js`)

- [ ] Task 2: 数据库 Schema 设计与迁移
  - [ ] 2.1 设计 `courses` 表（id, name, teacher, classroom, color, week_type, created_at, updated_at）
  - [ ] 2.2 设计 `course_schedules` 表（id, course_id, day_of_week, start_period, end_period, location, start_week, end_week, week_type）
  - [ ] 2.3 设计 `assignments` 表（id, course_id, title, description, due_date, status, created_at, updated_at）
  - [ ] 2.4 设计 `memos` 表（id, course_id, content, mood_emoji, created_at）
  - [ ] 2.5 设计 `semester_config` 表（id, key, value）存储学期配置
  - [ ] 2.6 在 Supabase SQL Editor 中执行建表 SQL，启用 Row Level Security

- [ ] Task 3: 核心 API 层搭建
  - [ ] 3.1 创建 Supabase 客户端工具模块 (`lib/supabase.ts`)
  - [ ] 3.2 创建课程 CRUD API 路由 (`/api/courses/`)
  - [ ] 3.3 创建作业 CRUD API 路由 (`/api/assignments/`)
  - [ ] 3.4 创建备忘 CRUD API 路由 (`/api/memos/`)
  - [ ] 3.5 创建学期配置 API 路由 (`/api/semester/`)

- [ ] Task 4: 预置数据导入
  - [ ] 4.1 编写种子数据脚本，将 13 门课程及时间安排写入 `course_schedules`
  - [ ] 4.2 编写种子数据脚本，写入学期配置信息（开学日期、节假日、调课安排）
  - [ ] 4.3 在应用首次启动时自动检测并执行种子数据导入

- [ ] Task 5: 学期工具模块
  - [ ] 5.1 实现 `lib/semester.ts`：计算当前教学周、判断单双周、获取周日期范围
  - [ ] 5.2 实现节假日和调课日期的计算逻辑
  - [ ] 5.3 实现节次时间映射（第1节=08:00-08:50, 第2节=09:00-09:50, 第3节=10:20-11:10, 第4节=11:20-12:10, 第5节=14:00-14:50, 第6节=15:00-15:50, 第7节=16:20-17:10, 第8节=17:20-18:10, 第9节=19:00-19:50, 第10节=20:00-20:50, 第11节=21:00-22:30）

- [ ] Task 6: 周视图页面
  - [ ] 6.1 创建周视图主组件，渲染周一至周五 × 08:00-22:30 的时间网格
  - [ ] 6.2 从 API 获取课程数据并渲染到对应时间格
  - [ ] 6.3 实现"当前课程"高亮（根据当前时间判断）
  - [ ] 6.4 实现单双周课程自动过滤
  - [ ] 6.5 实现上一周/下一周切换控件
  - [ ] 6.6 移动端适配：横向滚动或列表式展示

- [ ] Task 7: 日视图页面
  - [ ] 7.1 创建日视图组件，按时间顺序展示当天课程列表
  - [ ] 7.2 集成当天截止的作业展示
  - [ ] 7.3 集成当天的课堂备忘展示

- [ ] Task 8: 课程视图页面
  - [ ] 8.1 创建课程卡片网格布局
  - [ ] 8.2 每张卡片展示课程名、颜色标签、上课进度（已上/剩余节数）
  - [ ] 8.3 点击卡片进入课程详情（编辑入口、作业列表、备忘列表、心情分布）
  - [ ] 8.4 课程编辑表单（修改名称、教师、教室、颜色、单双周标记）

- [ ] Task 9: 作业追踪功能
  - [ ] 9.1 作业列表组件（按课程筛选、按截止时间排序）
  - [ ] 9.2 添加作业表单（标题、描述、截止时间、关联课程）
  - [ ] 9.3 截止时间临近提醒（24小时内红色标记）
  - [ ] 9.4 标记已提交 / 取消已提交

- [ ] Task 10: 课堂备忘功能
  - [ ] 10.1 备忘列表组件（按课程筛选、按时间排序）
  - [ ] 10.2 添加备忘表单（内容、心情 emoji 选择器、自动关联课程）
  - [ ] 10.3 备忘卡片展示（emoji + 内容 + 时间戳）

- [ ] Task 11: 数据导入导出
  - [ ] 11.1 实现课表导出为 CSV 并触发浏览器下载
  - [ ] 11.2 实现课表导出为 Excel (.xlsx) 并触发浏览器下载
  - [ ] 11.3 实现 CSV/Excel 文件上传解析
  - [ ] 11.4 导入预览确认对话框（展示解析结果，确认后写入数据库）

- [ ] Task 12: 人文关怀功能
  - [ ] 12.1 每日问候语组件（根据当天课程数量匹配不同文案）
  - [ ] 12.2 每周总结组件（统计上课节数、完成作业数、备忘条数）
  - [ ] 12.3 温柔话语随机展示（低频控制，localStorage 记录当日已展示）
  - [ ] 12.4 课程心情分布图（统计该课程备忘中各 emoji 的出现频次）

- [ ] Task 13: UI 视觉风格与暗色模式
  - [ ] 13.1 定义温暖手帐风格设计 Token（暖色调色板、圆角、阴影、字体）
  - [ ] 13.2 配置 Tailwind 主题（扩展颜色、字体、圆角等）
  - [ ] 13.3 实现暗色模式切换（Tailwind dark mode + 主题持久化）
  - [ ] 13.4 全局布局组件（导航栏、底部 Tab 栏移动端、页面容器）
  - [ ] 13.5 响应式断点适配（手机 < 768px, 平板 768-1024px, 桌面 > 1024px）

- [ ] Task 14: 部署至 Vercel
  - [ ] 14.1 将 Supabase 环境变量配置到 Vercel 项目
  - [ ] 14.2 关联 GitHub 仓库，配置 Vercel 自动部署
  - [ ] 14.3 验证生产环境功能正常

# Task Dependencies
- Task 2 依赖 Task 1（需要 Supabase 项目创建完毕）
- Task 3 依赖 Task 2（需要数据库表就绪）
- Task 4 依赖 Task 2（需要数据库表就绪）
- Task 5 依赖 Task 1（独立工具模块，可与 Task 2-4 并行）
- Task 6, 7, 8 依赖 Task 3, 4, 5（需要 API 和种子数据就绪）
- Task 9, 10 依赖 Task 3, 4（需要 API 和课程数据就绪）
- Task 11 依赖 Task 3（需要 API 就绪）
- Task 12 依赖 Task 9, 10（需要作业和备忘数据）
- Task 13 可与 Task 6-12 并行
- Task 14 依赖所有功能任务完成
