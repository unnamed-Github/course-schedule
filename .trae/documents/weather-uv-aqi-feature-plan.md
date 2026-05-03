# 天气 · 紫外强度 · AQI 预报 + 颜色动效 功能计划

## 概述

在 TopBar 下方（WarmthBanner 上方）新增 WeatherBanner 组件，展示实时天气、紫外强度和 AQI 数据，并根据数据动态生成漂亮的颜色动效（渐变背景、脉冲光晕、条件粒子效果）。

## 技术选型

### 天气 API：OpenWeatherMap（免费方案）

| 端点 | 用途 | 免费额度 |
|------|------|----------|
| `data/2.5/weather` | 当前天气（温度、天气图标、描述） | 60次/分钟 |
| `data/2.5/uvi` | 紫外指数（UV Index） | 60次/分钟 |
| `data/2.5/air_pollution` | 空气污染（AQI、PM2.5、PM10 等） | 60次/分钟 |

### 数据缓存策略

- 每 30 分钟刷新一次（天气变化不频繁）
- 使用内存缓存 + localStorage 双重缓存
- API 路由做服务端代理，隐藏 API Key

### 位置获取

- 默认城市：北京（可配置）
- 支持用户在设置中选择城市（通过城市名 + 经纬度查询）

---

## 实施步骤

### 1. 环境变量与类型定义

**新增/修改文件：**

- `src/lib/types.ts` — 新增 WeatherData、UVData、AQIData 类型
- `.env.local.example` — 新增 `NEXT_PUBLIC_OPENWEATHER_API_KEY` 说明

**类型：**
```ts
interface WeatherData {
  temp: number           // 温度 °C
  feelsLike: number      // 体感温度
  description: string    // 天气描述（晴、多云…）
  icon: string           // 天气图标代码
  humidity: number       // 湿度 %
  windSpeed: number      // 风速 m/s
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'drizzle' | 'thunderstorm' | 'mist'
}

interface UVData {
  index: number          // 0-11+
  level: 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme'
  color: string          // 对应颜色
}

interface AQIData {
  aqi: number            // 1-5 (OpenWeatherMap scale) 映射到中国 AQI
  pm25: number
  pm10: number
  level: 'good' | 'moderate' | 'unhealthySensitive' | 'unhealthy' | 'veryUnhealthy' | 'hazardous'
  color: string
}
```

### 2. API 路由

**新增文件：**

- `src/app/api/weather/route.ts` — 天气 API 代理路由

**逻辑：**
- 接收 `lat`、`lon` 查询参数
- 并行请求 3 个 OpenWeatherMap 端点
- 统一返回 `{ weather, uv, aqi }` JSON
- 错误处理 + 超时 10s
- 若 API Key 未配置则返回模拟数据

### 3. 数据获取工具库

**新增文件：**

- `src/lib/weather.ts` — 天气数据获取与缓存

**函数：**
- `fetchWeatherData(lat, lon)` — 调用内部 API 路由
- `getWeatherCache()` / `setWeatherCache(data)` — localStorage 缓存（有效期 30 分钟）
- `getDefaultCity()` — 获取默认城市（北京 39.9, 116.4）
- `getWeatherCondition(iconCode)` — 根据 OpenWeatherMap icon 代码映射条件类型

### 4. WeatherBanner 组件

**新增文件：**

- `src/components/WeatherBanner.tsx`

**UI 布局（单行横向卡片）：**

```
┌─────────────────────────────────────────────────────────┐
│ ☀️ 晴  26°C  体感 28°　│　☀ 紫外 中等 4　│　😷 AQI 良 78　│
│ 　　湿度 45% 微风 2m/s　│　━━━━━━━━━━━　　 │　━━━━━━━━━━━━　 │
└─────────────────────────────────────────────────────────┘
```

三段式布局，每段都有独立的颜色动效。

### 5. 颜色动效系统

#### 5.1 天气主题色映射

| 天气条件 | 主色 | 动效 |
|----------|------|------|
| 晴 (clear) | 暖金 `#F59E0B` → `#FBBF24` | 金色光晕脉动、太阳光线粒子 |
| 多云 (clouds) | 柔灰 `#94A3B8` → `#CBD5E1` | 缓慢渐变漂移 |
| 雨 (rain/drizzle) | 蓝 `#3B82F6` → `#60A5FA` | 下落水滴粒子、波纹扩散 |
| 雪 (snow) | 冰蓝 `#E0F2FE` → `#BAE6FD` | 飘雪粒子、微闪 |
| 雷暴 (thunderstorm) | 深紫 `#7C3AED` → `#8B5CF6` | 闪电闪烁效果 |
| 雾/霾 (mist) | 乳白 `#F1F5F9` → `#E2E8F0` | 雾气弥漫渐变动效 |

#### 5.2 UV 紫外强度颜色系统

| 等级 | 范围 | 颜色 | 动效 |
|------|------|------|------|
| 低 | 0-2 | 绿 `#10B981` | 静态柔光 |
| 中等 | 3-5 | 黄 `#F59E0B` | 缓慢呼吸脉动 |
| 高 | 6-7 | 橙 `#F97316` | 快速呼吸脉动 + 光晕扩散 |
| 很高 | 8-10 | 红 `#EF4444` | 急促闪烁 warning |
| 极端 | 11+ | 紫 `#7C3AED` | 紫光闪电脉冲 |

#### 5.3 AQI 空气质量颜色系统

| 等级 | 范围 | 颜色 | 动效 |
|------|------|------|------|
| 优 | 0-50 | 绿 `#10B981` | 静态 |
| 良 | 51-100 | 黄绿 `#84CC16` | 微呼吸 |
| 轻度 | 101-150 | 橙 `#F97316` | 呼吸脉动 |
| 中度 | 151-200 | 红 `#EF4444` | 快速脉动 + warning |
| 重度 | 201-300 | 紫 `#7C3AED` | 急促脉冲 |
| 严重 | 300+ | 深红 `#991B1B` | 剧烈脉冲 + 警示 |

#### 5.4 动效实现方式

使用 Framer Motion + CSS keyframes：

- **渐变呼吸**：`motion.div` 的 `animate` 控制 `background` 渐变在色阶间循环
- **光晕脉冲**：`box-shadow` 从 0 到 20px 扩散再收回
- **粒子效果**：CSS `@keyframes` + 多个 `span` 随机分布在卡片内，不同天气触发不同粒子
- **进度条光柱**：UV 和 AQI 使用带渐变的进度条，不同颜色段平滑过渡
- **Glass 融合**：所有卡片使用 `.glass-strong` 类，数据颜色通过 `borderLeft` 色条 + 背景渐变微调体现

### 6. 集成到 MainView

**修改文件：**
- `src/components/MainView.tsx` — 在 WarmthBanner 与 HealthChecklist 之间插入 `<WeatherBanner />`

### 7. 天气设置入口（可选增强）

**修改文件：**
- `src/app/settings/page.tsx` — 添加城市选择
- `src/lib/user-settings.ts` — 新增 `weather_city` 配置项

**城市预设：**
北京、上海、广州、深圳、杭州、成都、武汉、南京、西安、重庆

---

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | `src/lib/weather.ts` | 天气数据获取与缓存 |
| 新增 | `src/app/api/weather/route.ts` | API 代理路由 |
| 新增 | `src/components/WeatherBanner.tsx` | 核心天气展示组件 |
| 修改 | `src/lib/types.ts` | 新增 WeatherData 等类型 |
| 修改 | `src/components/MainView.tsx` | 集成 WeatherBanner |
| 修改 | `src/lib/user-settings.ts` | 新增 weather_city 设置项 |

## 颜色动效亮点总结

1. **整个卡片背景**随天气条件渐变呼吸（晴天暖金色、雨天冷蓝色）
2. **UV 数值周围**有动态光晕，强度和颜色随紫外等级变化
3. **AQI 进度条**不同色段间平滑过渡动画
4. **晴天粒子**：细小光点飘浮；**雨天粒子**：竖线水滴下落；**雪天粒子**：雪花飘落
5. **Glass 高光线**随天气主题色微调，保持整体玻璃质感统一
6. 所有动画使用 `prefers-reduced-motion` 降级
