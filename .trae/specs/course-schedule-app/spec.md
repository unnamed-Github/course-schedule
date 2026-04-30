# 课表管理应用 Spec

## Why
竹需要一个跨平台（电脑+手机）的个人课表管理工具，数据存储在云端实现多设备同步，代码托管在 GitHub 上便于版本管理和部署。

## What Changes
- 从零构建全栈课表管理 Web 应用
- 前端使用 Next.js 实现响应式周视图/日视图/课程视图
- 后端使用 Next.js API Routes + Supabase PostgreSQL 实现云端数据存储
- 实现作业追踪、课堂备忘、学期信息管理
- 实现数据导入导出（CSV/Excel）
- 实现人文关怀功能（问候语、周总结、心情分布）
- 温暖手帐风格 UI + 暗色模式
- 代码托管 GitHub，部署至 Vercel

## Impact
- Affected specs: 无（全新项目）
- Affected code: 整个项目从零搭建

---

## ADDED Requirements

### Requirement: 项目基础设施
系统 SHALL 基于 Next.js 14+ 构建，使用 TypeScript，代码托管在 GitHub，数据存储在 Supabase PostgreSQL 云端数据库。

#### Scenario: 项目初始化
- **WHEN** 开发者执行项目搭建
- **THEN** 创建 Next.js 项目，配置 TypeScript、Tailwind CSS、ESLint
- **AND** 初始化 Git 仓库并关联 GitHub 远程仓库
- **AND** 配置 Supabase 项目并获取数据库连接信息

---

### Requirement: 周视图
系统 SHALL 提供周视图课表展示，周一至周五，每天 08:00—22:30 的时间网格。

#### Scenario: 查看当前周课表
- **WHEN** 用户打开应用
- **THEN** 默认展示当前教学周的周视图课表
- **AND** 当前正在进行的课程高亮显示
- **AND** 单双周课程根据当前周次自动显示或隐藏

#### Scenario: 切换周次
- **WHEN** 用户点击"上一周"或"下一周"
- **THEN** 课表切换到对应周次
- **AND** 单双周课程按规则更新显示

---

### Requirement: 日视图
系统 SHALL 提供日视图，展示当天课程列表及关联的作业和备忘。

#### Scenario: 查看当天课程
- **WHEN** 用户切换到日视图
- **THEN** 按时间顺序展示当天所有课程
- **AND** 同时展示当天截止的作业和当天的课堂备忘

---

### Requirement: 课程视图
系统 SHALL 提供课程卡片视图，展示所有课程的统计信息。

#### Scenario: 查看课程统计
- **WHEN** 用户切换到课程视图
- **THEN** 以卡片形式展示所有课程
- **AND** 每张卡片显示课程名、已上课节数、剩余节数

---

### Requirement: 课程数据管理
系统 SHALL 支持 13 门预置课程，并允许用户编辑课程信息。

#### Scenario: 预置课程加载
- **WHEN** 应用首次初始化
- **THEN** 自动导入需求文档中定义的 13 门课程及完整信息（课程名、教师、教室、时间、单双周标记）

#### Scenario: 编辑课程信息
- **WHEN** 用户编辑某门课程
- **THEN** 可修改课程名、教师、教室、颜色标签、单双周标记
- **AND** 修改后云端同步

---

### Requirement: 作业追踪
系统 SHALL 提供作业管理功能，支持添加、查看、标记作业状态。

#### Scenario: 添加作业
- **WHEN** 用户为某门课程添加作业
- **THEN** 填写标题、描述、截止时间后保存
- **AND** 作业关联到对应课程

#### Scenario: 截止时间提醒
- **WHEN** 作业临近截止时间（24小时内）
- **THEN** 前端显示醒目提醒标记

#### Scenario: 标记完成
- **WHEN** 用户完成作业
- **THEN** 可将其标记为"已提交"状态

---

### Requirement: 课堂备忘
系统 SHALL 支持课堂随手记录，带心情 emoji，自动关联课程和时间。

#### Scenario: 添加备忘
- **WHEN** 用户在某课程下添加备忘
- **THEN** 记录内容、心情 emoji、自动关联当前课程
- **AND** 自动记录创建时间

---

### Requirement: 学期信息配置
系统 SHALL 内置 2026 春季学期信息，包含开学日期、教学周、考试周、节假日和调课安排。

#### Scenario: 学期信息展示
- **WHEN** 用户查看学期信息
- **THEN** 显示开学日期（2026-02-25）、教学周范围（1-15周）、考试周（16-17周）
- **AND** 节假日自动在课表中标注
- **AND** 调课补课日期自动反映在课表中（2月28日补周一课、5月9日上单周周二课）

---

### Requirement: 数据导入导出
系统 SHALL 支持 CSV/Excel 格式的课表导入导出。

#### Scenario: 导出课表
- **WHEN** 用户执行导出操作
- **THEN** 生成包含完整课程信息的 CSV 或 Excel 文件并下载

#### Scenario: 导入课表
- **WHEN** 用户上传 CSV 或 Excel 文件
- **THEN** 解析文件内容并覆盖或合并到当前课表
- **AND** 导入前预览确认

---

### Requirement: 跨平台与云端同步
系统 SHALL 支持 PC 和移动端访问，数据存储在 Supabase 云端数据库，确保多设备数据一致。

#### Scenario: 多设备访问
- **WHEN** 用户在 PC 上修改课程数据
- **THEN** 手机端打开同一应用即可看到更新后的数据
- **AND** 数据通过 Supabase 实时同步

#### Scenario: 响应式布局
- **WHEN** 用户在手机、平板或电脑上打开应用
- **THEN** 界面自适应设备屏幕尺寸
- **AND** 所有功能在移动端均可正常使用

---

### Requirement: 人文关怀
系统 SHALL 提供每日问候、每周总结和心情分布展示。

#### Scenario: 每日问候
- **WHEN** 用户打开应用
- **THEN** 显示与当天课程量相关的问候语（课多→鼓励，课少→轻松）

#### Scenario: 每周总结
- **WHEN** 每周结束时
- **THEN** 展示本周上课节数、完成作业数、备忘条数的总结

#### Scenario: 温柔话语
- **WHEN** 用户使用应用
- **THEN** 随机出现一句温柔鼓励的话语（低频，每天不超过一次）

#### Scenario: 心情分布
- **WHEN** 用户查看课程详情
- **THEN** 展示该课程历史备忘中的心情 emoji 分布

---

### Requirement: 视觉风格
系统 SHALL 采用温暖手帐风格，支持暗色模式，全设备响应式。

#### Scenario: 默认外观
- **WHEN** 应用加载
- **THEN** 展示温暖手帐风格界面，色调柔和、不刺眼
- **AND** 使用暖色调、圆角、柔和的阴影

#### Scenario: 暗色模式
- **WHEN** 用户切换暗色模式
- **THEN** 所有页面切换为暗色调配色

#### Scenario: 响应式布局
- **WHEN** 在不同屏幕尺寸下访问
- **THEN** 布局自适应：手机单栏、平板两栏、电脑宽屏
