# Liquid Glass 设置页 + Demo 控制台错误修复计划

## 问题分析

`glass-demo/page.tsx` 中 `glassStyle` 使用拆分的 `borderWidth`/`borderStyle`/`borderColor`（非缩略属性），但多处使用 `...glassStyle` 后又用 `border: 1px solid ...`（缩略属性）或 `borderBottom` 覆盖，导致 React 渲染时缩略/非缩略属性冲突。

**冲突位置**：
- L205-216：Gly Glass Nav — `...glassStyle` + `borderBottom`
- L248-255：强调按钮 — `...glassStyle` + `border: 1px solid ...`
- L159-167：强 Glass 卡片 — `...glassStyle` + `border: 1px solid ...`
- L283-297：Glass Modal — `...glassStyle` + `border: 1px solid ...`

**根因**：`glassStyle` 不应该承载 border，因为不同组件需要不同的 border 样式。

---

## 执行计划

### 1. 修复 glass-demo 的 border 冲突（5 分钟）

**文件**：`src/app/glass-demo/page.tsx`

**改动**：
1. 从 `glassStyle` 中移除 `borderWidth`/`borderStyle`/`borderColor` 三行
2. 每个使用 `...glassStyle` 的元素显式声明自己的 border（已大部分做了，只需移除冲突源）
3. 对需要默认 border 的元素（如基础 Glass 卡片、Glass 按钮），在各自 style 中补上 border

**具体改法**：
```
glassStyle 中删除:
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: dark ? ... : ...,

基础 Glass 卡片 (L143-145): 补上 border（使用 glassStyle 原来的默认值）
Glass 按钮 (L240-243): 补上 border
微妙 Glass (L181-188): 补上默认 border
圆按钮 (L261-266, L271-276): 补上默认 border
CSS Code Block (L317-320): 补上默认 border
```

### 2. 在 SettingsModal 新建 "Glass" Tab（15 分钟）

**文件**：`src/components/SettingsModal.tsx`

**改动**：
1. `SettingsTab` 类型从 `'display' | 'data'` 扩展为 `'display' | 'data' | 'glass'`
2. 在 Tab 按钮区新增 "玻璃" 按钮
3. 新增 `activeTab === 'glass'` 的内容区，包含：

#### Glass 设置项

| 控件 | 设置项 key | 默认值 | 范围 |
|------|-----------|--------|------|
| 开启玻璃效果 (Toggle) | `glass_enabled` | `true` | on/off |
| 模糊强度 (Range) | `glass_blur` | `40` | 10-80 px |
| 背景透明度 (Range) | `glass_opacity` | `15` | 3-40 % |
| 色彩饱和度 (Range) | `glass_saturation` | `1.8` | 1.0-3.0 |

4. 所有设置通过 `getLocalSetting` / `setSettingBoth` 持久化到 localStorage
5. 设置变更通过 `window.dispatchEvent(new Event('storage'))` 通知其他组件实时生效

### 3. 创建 useGlassSettings Hook（10 分钟）

**新建**：`src/hooks/useGlassSettings.ts`

```ts
export function useGlassSettings() {
  // 读取 glass_enabled, glass_blur, glass_opacity, glass_saturation
  // 返回 { enabled, blur, opacity, saturation }
  // 监听 storage 事件
}
```

### 4. 全局应用 Glass 设置（15 分钟）

**文件**：`src/app/globals.css`

将硬编码的 Glass Token 改为可通过 CSS 变量动态控制。关键：CSS 变量本身不能做 `saturate()` → `blur(PX)` 这种复杂组合，需要通过 `style` 属性注入。

**实现方案**：通过 React Context 提供 Glass 参数，在 `TopBar`、`BottomNav`、`Modal` 等组件中读取 `useGlassSettings()` 动态生成 inline style。

**但更优雅的方案**：覆盖 `:root` 的 CSS 变量值。`saturate()` 和 `blur()` 不能通过 var() 传递，因此：

采用 **CSS 自定义属性 + style 注入** 方案：
1. `globals.css` 中保留 `.glass` 等类的完整声明（始终存在，作为 fallback）
2. 在 `layout.tsx` 的 `<body>` 或 ThemeProvider 中动态注入 `<style>` 标签，用 JS 生成：
   ```css
   :root { --glass-blur-dynamic: blur(40px); --glass-saturate-dynamic: 1.8; ... }
   ```
3. 在 `.glass` 等类中使用 `var(--glass-blur-dynamic, blur(40px))`

这需要 Refactor globals.css 中 Glass 类的写法和新增 GlassSettingsProvider。

**简化方案**：暂时只在 SettingsModal 中做设置 UI，不影响已有组件。等设置 UI 做好后再逐步接入各组件 — 优先保障 Demo 页 bug 修复。

---

## 执行顺序

| 步骤 | 内容 | 文件 |
|------|------|------|
| 1 | 修复 glass-demo border 冲突 | `glass-demo/page.tsx` |
| 2 | 创建 `useGlassSettings` hook | `src/hooks/useGlassSettings.ts` (新建) |
| 3 | SettingsModal 新增 "玻璃" Tab | `src/components/SettingsModal.tsx` |
| 4 | globals.css 适配动态 Glass Token | `src/app/globals.css` |
| 5 | 全局接入（TopBar/BottomNav/Modal 等读取设置） | 各组件 |
| 6 | `tsc --noEmit` + `npm run build` 验证 | - |

---

## 影响范围

| 文件 | 操作 |
|------|------|
| `src/app/glass-demo/page.tsx` | 修改（移除 glassStyle 中的 border 冲突） |
| `src/hooks/useGlassSettings.ts` | 新建 |
| `src/components/SettingsModal.tsx` | 修改（新增 tab + 设置区） |
| `src/app/globals.css` | 修改（Glass Token 动态化） |
| `src/app/layout.tsx` | 可能修改（加 GlassSettingsProvider） |

---

## 风险控制
- Step 1 纯修复，零风险
- Step 2-3 新增 UI，不影响现有功能
- Step 4-5 需验证构建，如有问题可回退
