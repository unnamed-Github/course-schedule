# 妙搭版课表UI重构计划

## 项目现状分析

已有功能：
- ✅ 周视图 (WeekView)
- ✅ 日视图 (DayView) 
- ✅ 课程管理页面
- ✅ 作业和备忘的数据模型
- ✅ 问候横幅 (WarmthBanner)
- ✅ 主题切换
- ✅ 底部导航栏

## 重构目标

按照"极扁平"设计理念，实现所有功能平铺展示，无二级页面。

## 实现步骤

### 1. 重构顶部导航栏
**文件：`src/components/TopBar.tsx`**
- 将底部导航的6个标签移到顶部
- 标签顺序：课表(入口)、周视图、日视图、课程、作业、备忘、🌙暗色切换
- 保持已有的周数和日期展示
- 使用Tab切换而非页面跳转（保持单页面体验）

### 2. 移除底部导航栏
**文件：**
- 修改 `src/app/layout.tsx`，移除 BottomNav 组件
- 调整 main 区域的 padding-bottom（移除底部导航的空间）

### 3. 创建主视图切换组件
**新建文件：`src/components/MainView.tsx`**
- 基于顶部Tab状态显示不同视图
- 视图类型：周视图、日视图、课程、作业、备忘
- 集成三层情境信息

### 4. 增强WarmthBanner（三层情境信息）
**文件：`src/components/WarmthBanner.tsx`**
- 第一层：问候横幅（已有）
- 第二层：当前课程实时条（新增）
  - 显示正在上的课程
  - 进度百分比
  - 实时刷新
- 整合为一个完整的情境信息区域

### 5. 优化周视图样式
**文件：`src/components/WeekView.tsx`**
- 课程格子改为纯色底（当前是半透明）
- 添加右下角作业数量角标
- 当前课程高亮光环效果
- 空档显示"无课程"文字
- 假期标记展示
- 移除侧边/底部展开面板，改为就地展开

### 6. 优化日视图样式
**文件：`src/components/DayView.tsx`**
- 当前课程添加进度条
- 点击课程就地展开详情（不弹窗/跳转）
- 优化卡片样式

### 7. 创建作业页面组件
**新建文件：`src/components/AssignmentsView.tsx`**
- 顶部四宫格统计：全部/待提交/已提交/已过期
- 筛选标签：全部/待提交/已提交/已过期
- 作业卡片列表：课程色圆点、课程名、DDL、提醒图标
- 就地展开编辑功能

### 8. 创建备忘页面组件
**新建文件：`src/components/MemosView.tsx`**
- 副标题："记录每堂课的心情与收获"
- 备忘卡片：左侧课程色竖线、课程名、emoji、内容
- 底部心情统计：按课程展示备忘数量

### 9. 更新全局样式和主题
**文件：`src/app/globals.css`**
- 主色调改为翡翠绿 `#059669`
- 确保圆角统一为 `rounded-2xl`
- 优化阴影效果
- 微调颜色变量

### 10. 更新主页面
**文件：`src/app/page.tsx`**
- 使用新的 MainView 组件
- 移除旧的单独组件引用

### 11. 保留课程页面（可选路由访问）
**文件：**
- 保留 `src/app/courses/` 相关页面作为后备路由
- 但主要通过顶部Tab访问

## 文件变更清单

### 修改文件：
- `src/components/TopBar.tsx` - 重构为顶部Tab导航
- `src/app/layout.tsx` - 移除BottomNav
- `src/components/WeekView.tsx` - 样式优化
- `src/components/DayView.tsx` - 样式优化
- `src/components/WarmthBanner.tsx` - 增强为三层情境信息
- `src/app/page.tsx` - 使用新主视图
- `src/app/globals.css` - 更新主题色

### 新建文件：
- `src/components/MainView.tsx` - 主视图切换组件
- `src/components/AssignmentsView.tsx` - 作业页面
- `src/components/MemosView.tsx` - 备忘页面

### 可能删除文件：
- `src/components/BottomNav.tsx`（可保留但不使用）

## 风险和注意事项

1. 保持数据层不变，只修改UI层
2. 确保所有现有功能正常工作
3. 保持响应式设计
4. 渐进式修改，先完成核心功能再优化细节
