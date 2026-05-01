# 课表 · 竹 — 项目规则

## 技术栈

Next.js 16.2.4 + React 19.2.4 + Tailwind CSS v4 + Framer Motion 12.38.0 + Supabase + TypeScript 5

## 核心依赖

- next 16.2.4、react 19.2.4、framer-motion 12.38.0、lucide-react 1.14.0
- @supabase/supabase-js 2.105.1、xlsx 0.18.5、tailwindcss 4

## 禁止使用

- Pages Router API（必须用 App Router）
- React 18 以下旧版 API
- Tailwind `@apply` 指令
- Next.js 16 已废弃 API

## 架构

- MainView 管理 5 视图（week/day/courses/assignments/memos）
- 数据层：内存缓存 → Supabase → localStorage
- Course 1:N CourseSchedule/Assignment/Memo

## Git 流程

1. `npx tsc --noEmit` 检查编译
2. `npm version` 升版本（功能 minor，修复 patch）
3. `git add -A && git commit && git push`

## AI 规范

1. 先 build 后 push
2. 不建无意义文件
3. 不主动加注释
4. 遵循现有模式
5. 不提交敏感信息

## 改进建议

- 先看 .trae/documents/ 下的历史计划文档
- 修复 bug 时先搜相关 spec 和 task
- 完成复杂任务后，把经验写进 .trae/documents/
