"use client"

import { useState } from "react"
import { Moon, Sun, Sparkles, Layers, Zap, Palette } from "lucide-react"

const ACCENTS = [
  { name: "蓝", color: "#3B82F6", hue: "210" },
  { name: "绿", color: "#10B981", hue: "160" },
  { name: "紫", color: "#8B5CF6", hue: "260" },
  { name: "橙", color: "#F59E0B", hue: "40" },
  { name: "粉", color: "#EC4899", hue: "330" },
  { name: "青", color: "#06B6D4", hue: "188" },
]

export default function GlassDemoPage() {
  const [dark, setDark] = useState(false)
  const [blurPx, setBlurPx] = useState(40)
  const [opacity, setOpacity] = useState(0.15)
  const [saturation, setSaturation] = useState(1.8)
  const [activeAccent, setActiveAccent] = useState(0)

  const bgColor = dark ? "#0B1120" : "#F0F4F8"
  const surfaceColor = dark ? "#1E293B" : "#FFFFFF"
  const textColor = dark ? "#F1F5F9" : "#0F172A"
  const subColor = dark ? "#94A3B8" : "#64748B"
  const accentColor = ACCENTS[activeAccent].color

  const glassStyle = {
    background: dark
      ? `rgba(255, 255, 255, ${opacity * 0.5})`
      : `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `saturate(${saturation}) blur(${blurPx}px)`,
    WebkitBackdropFilter: `saturate(${saturation}) blur(${blurPx}px)`,
    boxShadow: dark
      ? `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0.5px 0 rgba(255, 255, 255, 0.1)`
      : `0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0.5px 0 rgba(255, 255, 255, 0.5)`,
    position: "relative" as const,
    transform: "translateZ(0)",
  }

  const defaultBorder = `1px solid ${dark
    ? `rgba(255, 255, 255, ${0.06 + opacity * 0.4})`
    : `rgba(255, 255, 255, ${0.15 + opacity * 0.3})`}`

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${ACCENTS[activeAccent].color}22, transparent 60%),
                     radial-gradient(ellipse 60% 50% at 80% 80%, ${ACCENTS[(activeAccent + 2) % 6].color}15, transparent 50%),
                     ${bgColor}`,
        color: textColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ─── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              <span style={{ color: accentColor }}>Liquid Glass</span> 效果展示
            </h1>
            <p className="text-sm" style={{ color: subColor }}>
              iOS 26 风格玻璃质感 — 实时可调参数预览
            </p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="glass-btn w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
            style={glassStyle}
          >
            {dark ? <Sun size={18} color={textColor} /> : <Moon size={18} color={textColor} />}
          </button>
        </div>

        {/* ─── Controls ────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ ...glassStyle, borderRadius: "var(--radius-2xl)", border: defaultBorder }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ControlGroup label="模糊强度" value={`${blurPx}px`} icon={<Layers size={14} />}>
              <input
                type="range"
                min={5}
                max={80}
                value={blurPx}
                onChange={(e) => setBlurPx(Number(e.target.value))}
                className="w-full accent-current"
                style={{ colorScheme: dark ? "dark" : "light" }}
              />
            </ControlGroup>

            <ControlGroup label="背景透明度" value={`${Math.round(opacity * 100)}%`} icon={<Zap size={14} />}>
              <input
                type="range"
                min={2}
                max={40}
                value={Math.round(opacity * 100)}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full accent-current"
                style={{ colorScheme: dark ? "dark" : "light" }}
              />
            </ControlGroup>

            <ControlGroup label="色彩饱和度" value={saturation.toFixed(1)} icon={<Palette size={14} />}>
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-current"
                style={{ colorScheme: dark ? "dark" : "light" }}
              />
            </ControlGroup>
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium" style={{ color: subColor }}>色调：</span>
            {ACCENTS.map((a, i) => (
              <button
                key={a.name}
                onClick={() => setActiveAccent(i)}
                className="w-8 h-8 rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: a.color,
                  boxShadow: activeAccent === i ? `0 0 0 2px ${bgColor}, 0 0 0 4px ${a.color}` : "none",
                  transform: activeAccent === i ? "scale(1.15)" : "scale(1)",
                }}
                title={a.name}
              />
            ))}
          </div>
        </div>

        {/* ─── Cards Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <GlassCard
            title="基础 Glass"
            style={{
              ...glassStyle,
              borderRadius: "var(--radius-2xl)",
              border: defaultBorder,
            }}
            dark={dark}
            accent={accentColor}
            textColor={textColor}
            subColor={subColor}
          >
            <p className="text-xs" style={{ color: subColor }}>
              标准 Liquid Glass 面板，顶部自动高光线
            </p>
          </GlassCard>

          <GlassCard
            title="强 Glass"
            style={{
              ...glassStyle,
              background: dark
                ? `rgba(255, 255, 255, ${Math.min(opacity * 0.5 * 1.6, 0.25)})`
                : `rgba(255, 255, 255, ${Math.min(opacity * 1.6, 0.32)})`,
              border: dark
                ? `1px solid rgba(255, 255, 255, ${0.08 + opacity * 0.6})`
                : `1px solid rgba(255, 255, 255, ${0.2 + opacity * 0.5})`,
              borderRadius: "var(--radius-2xl)",
            }}
            dark={dark}
            accent={accentColor}
            textColor={textColor}
            subColor={subColor}
          >
            <p className="text-xs" style={{ color: subColor }}>
              更高不透明度，适合重要卡片和弹窗
            </p>
          </GlassCard>

          <GlassCard
            title="微妙 Glass"
            style={{
              ...glassStyle,
              background: dark
                ? `rgba(255, 255, 255, ${Math.max(opacity * 0.5 * 0.3, 0.015)})`
                : `rgba(255, 255, 255, ${Math.max(opacity * 0.3, 0.03)})`,
              backdropFilter: `saturate(${saturation * 0.7}) blur(${blurPx * 0.5}px)`,
              WebkitBackdropFilter: `saturate(${saturation * 0.7}) blur(${blurPx * 0.5}px)`,
              borderRadius: "var(--radius-2xl)",
              border: defaultBorder,
            }}
            dark={dark}
            accent={accentColor}
            textColor={textColor}
            subColor={subColor}
          >
            <p className="text-xs" style={{ color: subColor }}>
              极低透明度，适合背景装饰层
            </p>
          </GlassCard>
        </div>

        {/* ─── Components ──────────────────────────────── */}
        <h2 className="text-lg font-semibold mb-4">组件应用</h2>

        {/* Glass Nav */}
        <div
          className="flex items-center gap-4 px-5 py-3 mb-6"
          style={{
            ...glassStyle,
            background: dark
              ? `rgba(255, 255, 255, ${Math.min(opacity * 0.5 * 1.5, 0.18)})`
              : `rgba(255, 255, 255, ${Math.min(opacity * 1.5, 0.25)})`,
            backdropFilter: `saturate(${saturation * 1.2}) blur(${blurPx * 1.5}px)`,
            WebkitBackdropFilter: `saturate(${saturation * 1.2}) blur(${blurPx * 1.5}px)`,
            borderRadius: "var(--radius-xl)",
            borderBottom: `1px solid rgba(255,255,255,${dark ? 0.1 : 0.25})`,
          }}
        >
          <Sparkles size={18} color={accentColor} />
          <span className="font-semibold text-sm">Glass 导航栏</span>
          <div className="flex-1" />
          {["周", "日", "课程"].map((t, i) => (
            <span
              key={t}
              className="text-xs px-3 py-1 rounded-full transition-colors cursor-pointer"
              style={{
                background: i === 0 ? `${accentColor}22` : "transparent",
                color: i === 0 ? accentColor : subColor,
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Glass Buttons Row */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            className="px-5 py-2.5 text-sm font-medium rounded-xl cursor-pointer"
            style={{
              ...glassStyle,
              borderRadius: "var(--radius-md)",
              color: textColor,
              border: defaultBorder,
            }}
          >
            Glass 按钮
          </button>
          <button
            className="px-5 py-2.5 text-sm font-medium rounded-xl cursor-pointer"
            style={{
              ...glassStyle,
              borderRadius: "var(--radius-md)",
              color: accentColor,
              border: `1px solid ${accentColor}44`,
            }}
          >
            强调按钮
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer"
            style={{
              ...glassStyle,
              borderRadius: "50%",
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}33`,
            }}
          >
            <Sparkles size={16} color={accentColor} />
          </button>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-full cursor-pointer"
            style={{
              ...glassStyle,
              borderRadius: "50%",
              color: textColor,
              border: defaultBorder,
            }}
          >
            +
          </button>
        </div>

        {/* Glass Modal */}
        <div
          className="p-6 w-full max-w-md"
          style={{
            ...glassStyle,
            background: dark
              ? `rgba(255, 255, 255, ${Math.min(opacity * 0.5 * 1.8, 0.22)})`
              : `rgba(255, 255, 255, ${Math.min(opacity * 1.8, 0.3)})`,
            borderRadius: "var(--radius-2xl)",
            border: dark
              ? `1px solid rgba(255, 255, 255, ${0.1 + opacity * 0.6})`
              : `1px solid rgba(255, 255, 255, ${0.2 + opacity * 0.5})`,
            boxShadow: dark
              ? "0 25px 60px rgba(0,0,0,0.5), inset 0 0.5px 0 rgba(255,255,255,0.15)"
              : "0 25px 60px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,0.6)",
          }}
        >
          <h3 className="font-semibold text-base mb-2" style={{ color: textColor }}>
            Glass 弹窗
          </h3>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: subColor }}>
            具有强玻璃质感的模态弹窗，带有顶部高光线和外发光阴影。
          </p>
          <div className="flex gap-3 justify-end">
            <button className="text-xs px-4 py-2 rounded-lg cursor-pointer" style={{ color: subColor }}>
              取消
            </button>
            <button
              className="text-xs px-4 py-2 rounded-lg text-white font-medium cursor-pointer"
              style={{ background: accentColor }}
            >
              确认
            </button>
          </div>
        </div>

        {/* ─── CSS Code Block ──────────────────────────── */}
        <div
          className="mt-10 p-6 rounded-2xl"
          style={{
            ...glassStyle,
            borderRadius: "var(--radius-2xl)",
            border: defaultBorder,
          }}
        >
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: textColor }}>
            <Sparkles size={14} color={accentColor} />
            Glass CSS Token 系统
          </h2>
          <pre
            className="text-xs leading-relaxed overflow-x-auto p-4 rounded-xl font-mono"
            style={{
              background: dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
              color: subColor,
            }}
          >
            {`--glass-bg: rgba(255, 255, 255, ${opacity.toFixed(2)});
--glass-border: rgba(255, 255, 255, ${(0.15 + opacity * 0.3).toFixed(2)});
--glass-blur: blur(${blurPx}px);
--glass-highlight: linear-gradient(
  180deg,
  rgba(255,255,255,0.3) 0%,
  transparent 50%
);

/* 用法 */
.glass {
  background: var(--glass-bg);
  backdrop-filter: saturate(${saturation.toFixed(1)}) var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  transform: translateZ(0);
}

.glass::before {
  content: '';
  background: var(--glass-highlight);
  pointer-events: none;
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

function GlassCard({
  title,
  children,
  style,
  dark,
  accent,
  textColor,
  subColor,
}: {
  title: string
  children: React.ReactNode
  style: React.CSSProperties
  dark: boolean
  accent: string
  textColor: string
  subColor: string
}) {
  return (
    <div style={style}>
      <div
        className="px-5 py-3 font-semibold text-sm flex items-center gap-2"
        style={{
          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)"}`,
          color: textColor,
        }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
        {title}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ControlGroup({
  label,
  value,
  icon,
  children,
}: {
  label: string
  value: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "inherit" }}>
          {icon}
          {label}
        </span>
        <span className="text-xs font-mono opacity-60">{value}</span>
      </div>
      {children}
    </div>
  )
}
