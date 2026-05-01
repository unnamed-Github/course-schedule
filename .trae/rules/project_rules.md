# 项目规范

## 版本管理

- 单一数据源：`package.json` 的 `version` 字段
- Settings 页面版本自动读取该字段，无需手动同步
- 发版流程：`npm version patch`（补丁）/ `minor`（小版本）/ `major`（大版本）
  - 此命令会自动更新 `package.json` 的 `version` 并创建 git tag
- 示例：`npm version minor` → `package.json` version 更新，git tag `v0.2.0` 自动创建
- **不需要也不应该在代码中硬编码版本号**

## Git 推送规范

每次完成功能或修复后：

1. **运行 `npm run build`**（或 `npx tsc --noEmit`）确认无编译/类型错误
2. **检查 `package.json` 的 `version` 是否需要更新**（功能增加 → minor，bug 修复 → patch，大改 → major）
   - 如果需要更新，执行 `npm version patch` / `minor` / `major`，此命令会自动更新 version 并打 tag
3. **提交 + 推送**：`git add -A && git commit -m "..." && git push origin main`
4. 每次推送前确认 Working Tree Clean（无未提交改动）

## 备忘与作业绑定规则

- `schedule_id` 关联到 `CourseSchedule`（排课模板），代表"具体某次课时"
- `week_type` = `all`（全周）/ `odd`（单周）/ `even`（双周）
- 课时选择器标签格式：`周三 5-6节（单周）`
- 作业：按 `course_id` 跨节显示（在同课程所有课时卡片中展示）
- 备忘：按 `schedule_id` 精确匹配（仅在关联课时卡片中展示）
