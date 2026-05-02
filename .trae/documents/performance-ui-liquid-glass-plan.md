# 性能优化 · UI 升级 · iOS 26 Liquid Glass 全面改造计划

## 项目诊断总结

基于对 30+ 源文件的全面审查，结合已有的 `code-audit-optimization-plan.md` 和 `课表UI全面对标计划.md`，当前项目存在以下关键问题：

| 类别 | 待解决问题 | 严重度 |
|------|-----------|--------|
| 组件巨型化 | WeekView 663行、CoursesPage 544行 | 🔴 高 |
| 重复代码 | EMOJI_OPTIONS/DAY_LABELS 在 3+ 文件中定义 | 🔴 高 |
| 动画重叠 | PageTransition + MainView AnimatePresence 双重动画 | 🟡 中 |
| 数据加载 | loadOverrides 重复调用、空 catch 块吞错误 | 🟡 中 |
| 类型安全 | 多处 as any 断言 | 🟡 中 |
| UI 设计 | 卡片扁平化、缺乏层次感、视觉密度不均衡 | 🟡 中 |
| 配置缺失 | next.config.ts 无图片/缓存优化 | 🟡 中 |

---

## Phase 0：Demo 先行 — Liquid Glass 效果预览页

**目标**：在正式改造前，先创建一个独立的 demo 页面展示 iOS 26 Liquid Glass 效果，确认设计方向后再全面推进。

### 0.1 创建 Demo 路由
- **文件**：`src/app/glass-demo/page.tsx`（新建）
- **内容**：
  - 展示 6-8 种 Liquid Glass 变体卡片（不同透明度、不同色相、不同 blur 层级）
  - 展示 Liquid Glass 按钮、导航栏、模态框效果
  - 展示暗色/亮色模式下的 Glass 效果对比
  - 使用 CSS 自定义属性驱动的 Glass Token 系统
  - 每个效果卡片附带代码标注（使用的 CSS 变量）

### 0.2 Liquid Glass 核心 CSS 技术方案
iOS 26 Liquid Glass 的核心特征：
1. **多层 backdrop-filter**：`blur(40px)` + `saturate(1.8)` + `brightness(1.05)`
2. **半透明渐变背景**：`rgba(255,255,255,0.15)` 叠加微妙的线性渐变
3. **内发光边框**：使用 `box-shadow` inset + `border` 半透明白色
4. **柔和的外阴影**：多层 `box-shadow` 模拟环境光散射
5. **动态高光**：顶部微妙的高光条（`linear-gradient` 白色到透明）

```css
/* Liquid Glass Token 示例 */
--glass-bg: rgba(255, 255, 255, 0.12);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.4);
--glass-blur: saturate(1.8) blur(40px);
--glass-highlight: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%);
```

### 0.3 Demo 页面交互
- 提供 `backdrop-filter` 强度滑块（blur 10px → 60px）
- 提供透明度滑块（bg opacity 0.05 → 0.3）
- 提供明暗切换按钮
- 实时预览效果变化

---

## Phase 1：性能优化 — 加载速度与运行流畅度

### 1.1 Next.js 构建与运行时优化
- **文件**：`next.config.ts`
- **改动**：
  - 添加 `experimental.optimizePackageImports` 优化 lucide-react / framer-motion 导入
  - 添加 `images` 配置（如有图片使用场景）
  - 添加 `headers()` 配置静态资源强缓存（字体、图标等）
  - 开启 `productionBrowserSourceMaps: false`

### 1.2 消除重复的 loadOverrides 调用
- **文件**：`src/components/WeekView.tsx`
- **问题**：loadOverrides 在多个 effect 中调用，存在竞态和重复请求
- **修复**：合并为一个统一的数据加载流程，使用 AbortController 防竞态

### 1.3 修复动画重叠问题
- **文件**：`src/components/PageTransition.tsx`、`src/components/MainView.tsx`
- **问题**：PageTransition 做路由切换动画 + MainView 做视图切换动画，双层动画
- **修复**：
  - PageTransition 只保留路由级动画（`/` → `/settings` 等跨页面导航）
  - MainView 的 AnimatePresence 使用 `mode="sync"` 避免阻塞

### 1.4 useMemo / useCallback 性能优化
- **文件**：`WeekView.tsx`、`DayView.tsx`、`CoursesPage`
- **改动**：
  - 对课程过滤、分组计算添加 useMemo 包装
  - 对事件处理函数添加 useCallback 避免子组件重渲染
  - 对大型列表使用 React.memo 包装卡片组件

### 1.5 字体加载优化
- **文件**：`src/app/layout.tsx`
- **改动**：
  - 添加 `next/font` 的 `display: 'swap'` 和 `preload: true`
  - 如使用 Google Fonts，改用 next/font/google 本地化

---

## Phase 2：代码健康 — 结构优化与质量提升

### 2.1 提取共享常量与工具函数
- **新建**：`src/lib/constants.ts`（EMOJI_OPTIONS、DAY_LABELS、PERIOD_GROUP_DEFS 等）
- **新建**：`src/lib/utils.ts`（countdown、addDays、isSameDay、formatDate 等工具函数）
- **修改**：WeekView.tsx、DayView.tsx、MemosView.tsx、AssignmentsView.tsx 统一引用

### 2.2 消除 as any 类型断言
- **文件**：`SettingsModal.tsx`、`SettingsPage.tsx`
- **修复**：补全 `updateSemesterConfigToDB` 的类型签名，让 Partial 类型正确传递

### 2.3 完善错误处理
- **文件**：`src/lib/data.ts`、各视图组件
- **修复**：空 catch 块 → 至少 `console.error` + 用户友好的 toast 提示

### 2.4 Lazy Loading 非首屏组件
- **文件**：`src/app/page.tsx`
- **改动**：WeeklySummary、EasterEgg、FestivalPoster 使用 `next/dynamic` + `ssr: false` 懒加载

---

## Phase 3：UI 设计审美升级 — 更现代、更精致

### 3.1 全局设计 Token 升级
- **文件**：`src/app/globals.css`
- **改动**：
  - 增加更多语义化 CSS 变量：`--radius-sm/md/lg/xl`、`--spacing-unit`
  - 优化暗色模式色彩对比度（WCAG AA 标准）
  - 统一过渡动画时间变量：`--duration-fast: 150ms`、`--duration-normal: 250ms`、`--duration-slow: 400ms`
  - 优化 shadow 层级（增加更多中间层级）

### 3.2 卡片系统升级
- **文件**：`globals.css` → `.card` 类
- **改动**：
  - 增加 card 变体：`.card-elevated`（悬浮态）、`.card-interactive`（可点击）、`.card-glass`（Glass）
  - 优化 hover 过渡（从瞬时变成平滑）
  - 增加卡片内边距系统（sm/md/lg）

### 3.3 导航栏优化
- **文件**：`TopBar.tsx`
- **改动**：
  - Tab 切换动画从静态切换改为弹性 indicator 滑动
  - 滚动时 TopBar 阴影渐进增强（根据 scrollY）
  - 品牌标识区增加微妙的呼吸动画

### 3.4 色彩系统深化
- **改动**：
  - 从 6 个 accent 色扩展到支持色阶（50-900 生成）
  - 课程颜色从纯色改为梯度色（同色系浅→深）
  - 作业逾期/即将到期的状态色使用更柔和的暖色系

### 3.5 微交互增强
- **改动**：
  - 按钮点击增加 `scale(0.97)` 反馈（已有部分，补充剩余）
  - 卡片 hover 增加微上浮 `translateY(-2px)`
  - 列表项增加交错进入动画（staggerChildren）
  - 开关组件增加触觉般的弹性过渡

### 3.6 排版系统优化
- **改动**：
  - 统一字号阶梯：`xs(11px) → sm(13px) → base(15px) → lg(18px) → xl(22px) → 2xl(28px)`
  - 行高统一：tight(1.25) / normal(1.5) / relaxed(1.75)
  - 字重使用规范：regular(400) / medium(500) / semibold(600) / bold(700)

---

## Phase 4：iOS 26 Liquid Glass 全面应用

### 4.1 Glass Design Token 系统
- **文件**：`src/app/globals.css`（新增 :root 和 .dark 变量）
- **新增 Token**：
```css
--glass-bg: rgba(255, 255, 255, 0.12);
--glass-bg-strong: rgba(255, 255, 255, 0.18);
--glass-bg-subtle: rgba(255, 255, 255, 0.06);
--glass-border: rgba(255, 255, 255, 0.2);
--glass-border-strong: rgba(255, 255, 255, 0.3);
--glass-highlight: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.4);
--glass-blur: saturate(1.8) blur(40px);
--glass-blur-light: saturate(1.5) blur(20px);
--glass-blur-heavy: saturate(2) blur(60px);
```

### 4.2 Glass 组件类
- **文件**：`globals.css`
- **新增类**：
  - `.glass` — 基础 Glass 面板
  - `.glass-strong` — 高不透明度 Glass（用于悬停卡片）
  - `.glass-subtle` — 低不透明度 Glass（用于背景装饰）
  - `.glass-nav` — 导航栏专用 Glass
  - `.glass-modal` — 模态框专用 Glass
  - `.glass-btn` — Glass 按钮

### 4.3 逐组件应用 Liquid Glass

#### 4.3.1 TopBar → Glass Navigation Bar
- 使用 `.glass-nav` 类
- 增加顶部的 subtle 高光线
- 滚动时 blur 量和透明度动态变化

#### 4.3.2 BottomNav → Glass Bottom Bar
- 使用 `.glass-nav` 类
- 底部圆角过渡

#### 4.3.3 课程卡片 → Glass Card
- 课程颜色色相融入 Glass 背景（使用 CSS `color-mix` 或背景色叠加）
- 卡片边框使用半透明
- 悬停时 increase blur + 轻微上浮

#### 4.3.4 选项卡 / 筛选标签 → Glass Pills
- 选中态：半透明填充 + 无边框
- 未选中态：仅文字 + subtle hover

#### 4.3.5 Modal / 弹窗 → Glass Modal
- 背景使用 `.glass-modal`
- 遮罩层增加微妙 blur

#### 4.3.6 快捷操作面板 → Glass Panel
- 快速添加作业/备忘的浮动面板使用 Glass

#### 4.3.7 统计卡片 → Glass Stat Cards
- 四宫格统计卡片使用 `.glass-strong`

#### 4.3.8 Toast 通知 → Glass Toast
- 通知使用 Glass 背景 + 色相提示条

#### 4.3.9 设置面板 → Glass Settings
- SettingsModal 整体使用 Glass 风格

#### 4.3.10 浮动按钮 → Glass FAB
- FloatingSettingsButton 使用圆形 Glass 按钮

### 4.4 暗色模式 Liquid Glass 适配
- **关键差异**：
  - 亮色模式：白色基底 + 冷色调（#FFFFFF → #F0F4FF）
  - 暗色模式：深蓝基底 + 暖色调（#0B1120 → #1A1A2E）
  - 暗色模式下透明度更高（0.08-0.2 → 让更多背景色透出）
  - 暗色模式边框更亮（0.15-0.3 → 提供可见的边距感）

### 4.5 性能保护
- Glass 效果使用 `transform: translateZ(0)` 开启 GPU 加速
- 对不需要实时 blur 的元素使用 `will-change: transform`
- 对低频动画的 Glass 元素不设置 `will-change`
- 移动端根据 `prefers-reduced-motion` 降低 blur 强度

---

## 执行顺序（严格按序）

| 阶段 | 内容 | 依赖 | 预估影响面 |
|------|------|------|-----------|
| **Phase 0** | Liquid Glass Demo 页面 | 无 | 仅新增 1 文件 |
| **Phase 1** | 性能优化 | Phase 0 确认方向 | 3-5 文件 |
| **Phase 2** | 代码健康 | 无（可并行） | 5-8 文件 |
| **Phase 3** | UI 审美升级 | Phase 1+2 | 8-12 文件 |
| **Phase 4** | Liquid Glass 全面应用 | Phase 0+3 | 12-18 文件 |

### 每阶段完成后的验证
1. `npx tsc --noEmit` — 类型检查
2. `npm run build` — 构建验证
3. 浏览器 DevTools Lighthouse 评分对比

---

## 涉及文件总清单

| 文件 | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|---------|
| `src/app/glass-demo/page.tsx` | ✅ 新建 | - | - | - | - |
| `next.config.ts` | - | ✅ | - | - | - |
| `src/app/layout.tsx` | - | ✅ | - | - | ✅ |
| `src/app/page.tsx` | - | ✅ | - | - | - |
| `src/app/globals.css` | ✅ | - | - | ✅ | ✅ |
| `src/lib/constants.ts` | - | - | ✅ 新建 | - | - |
| `src/lib/utils.ts` | - | - | ✅ 新建 | - | - |
| `src/components/WeekView.tsx` | - | ✅ | ✅ | ✅ | ✅ |
| `src/components/DayView.tsx` | - | ✅ | ✅ | ✅ | ✅ |
| `src/components/TopBar.tsx` | - | - | - | ✅ | ✅ |
| `src/components/BottomNav.tsx` | - | - | - | - | ✅ |
| `src/components/MainView.tsx` | - | ✅ | - | - | - |
| `src/components/PageTransition.tsx` | - | ✅ | - | - | - |
| `src/components/Modal.tsx` | - | - | - | ✅ | ✅ |
| `src/app/courses/page.tsx` | - | - | ✅ | ✅ | ✅ |
| `src/components/AssignmentsView.tsx` | - | - | ✅ | ✅ | ✅ |
| `src/components/MemosView.tsx` | - | - | ✅ | ✅ | ✅ |
| `src/components/WarmthBanner.tsx` | - | - | - | ✅ | ✅ |
| `src/components/SettingsModal.tsx` | - | - | ✅ | ✅ | ✅ |
| `src/components/FloatingSettingsButton.tsx` | - | - | - | - | ✅ |
| `src/components/ToastProvider.tsx` | - | - | - | - | ✅ |
| `src/components/Skeleton.tsx` | - | - | - | ✅ | ✅ |

---

## 风险控制

1. **所有改动通过 git 管理**，每个 Phase 完成后 commit
2. **CSS 变量变更向后兼容**，旧变量名保留为 alias
3. **组件拆分保持对外 API 100% 兼容**
4. **Glass 效果通过 CSS 渐进增强**，不支持 backdrop-filter 的浏览器降级为普通半透明背景
