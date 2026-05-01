# 项目规范

## 版本管理

- 单一数据源：`package.json` 的 `version` 字段
- Settings 页面版本自动读取该字段，无需手动同步
- 发版流程：`npm version patch`（补丁）/ `minor`（小版本）/ `major`（大版本）
  - 此命令会自动更新 `package.json` 的 `version` 并创建 git tag
- 示例：`npm version minor` → `package.json` version 更新，git tag `v0.2.0` 自动创建
- **不需要也不应该在代码中硬编码版本号**
