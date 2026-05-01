# WeekView 备忘/作业 跨节显示逻辑修复计划

## 问题

当前 WeekView 展开课时卡片时，备忘和作业的过滤逻辑一致——都不跨节。但用户希望：
- **作业**：跨节显示（同一门课的所有作业都展示，不论是否关联到具体课时）
- **备忘**：不跨节（只在该课时卡片中展示）

## 改动

### [WeekView.tsx](file:///Users/jack/Documents/trae_projects/Timer/src/components/WeekView.tsx) 第 437-440 行

**当前：**
```typescript
const courseAssignments = assignments.filter(a =>
  a.course_id === course.id && (a.schedule_id === schedule.id || !a.schedule_id)
)
const courseMemos = memos.filter(m =>
  m.course_id === course.id && (m.schedule_id === schedule.id || !m.schedule_id)
).slice(0, 3)
```

**修改为：**
```typescript
// 作业跨节：同一门课的所有作业都展示（不论是否关联到具体课时）
const courseAssignments = assignments.filter(a => a.course_id === course.id)

// 备忘不跨节：只展示关联到当前课时的，兜底展示仅关联课程的
const courseMemos = memos.filter(m =>
  m.course_id === course.id && (m.schedule_id === schedule.id || !m.schedule_id)
).slice(0, 3)
```

---

## 版本管理跨聊天存储方案

### 问题
用户问：每次 git push 是否需要手动写版本号？答案是**不需要**。

### 当前实现（已正确）
`SettingsModal.tsx` 使用 `process.env.npm_package_version`（即 `package.json` 的 `version` 字段），**唯一数据源，不重复存储**。

### 版本管理规范

在 `.trae/rules/project_rules.md` 中写入以下内容，供所有 AI session 共享：

```
## 版本管理
- 单一数据源：package.json 的 version 字段
- Settings 页面版本自动读取该字段，无需手动同步
- 发版流程：npm version patch（补丁） / minor（小版本） / major（大版本）
  - 此命令会自动更新 package.json 的 version 并创建 git tag
- 示例：npm version minor → package.json version 更新，git tag v0.2.0 自动创建
- 不需要也不应该在代码中硬编码版本号
```

### 创建文件
`.trae/rules/project_rules.md`（新建此文件）
