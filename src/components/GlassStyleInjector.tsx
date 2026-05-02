"use client"

import { useGlassSettings } from "@/hooks/useGlassSettings"

export function GlassStyleInjector() {
  const { settings } = useGlassSettings()
  const { enabled, blur, opacity, saturation } = settings

  const o = opacity / 100

  if (!enabled) {
    return (
      <style>{`
        .glass, .glass-strong, .glass-subtle, .glass-nav, .glass-modal, .glass-btn {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: var(--bg-card) !important;
          border: 1px solid var(--border-light) !important;
          box-shadow: var(--shadow-sm) !important;
          transform: none !important;
        }
        .glass::before, .glass-strong::before, .glass-modal::before { display: none !important; }
        .dark .glass, .dark .glass-strong, .dark .glass-subtle, .dark .glass-nav, .dark .glass-modal, .dark .glass-btn {
          background: var(--bg-card) !important;
        }
      `}</style>
    )
  }

  const gBg = `rgba(255, 255, 255, ${o})`
  const gBgStrong = `rgba(255, 255, 255, ${Math.min(o * 1.5, 0.3)})`
  const gBgSubtle = `rgba(255, 255, 255, ${Math.min(o * 0.4, 0.08)})`
  const gBgNav = `rgba(255, 255, 255, ${Math.min(o * 1.5, 0.22)})`
  const gBgModal = `rgba(255, 255, 255, ${Math.min(o * 1.8, 0.28)})`
  const gBorder = `rgba(255, 255, 255, ${0.15 + o * 0.3})`
  const gBorderStrong = `rgba(255, 255, 255, ${0.2 + o * 0.5})`
  const gShadow = `0 8px 32px rgba(0, 0, 0, ${0.04 + o * 0.1}), 0 2px 8px rgba(0, 0, 0, ${0.02 + o * 0.05}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.4 + o * 0.8})`
  const gShadowModal = `0 25px 60px rgba(0, 0, 0, ${0.08 + o * 0.1}), 0 8px 20px rgba(0, 0, 0, ${0.04 + o * 0.05}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.4 + o})`
  const gShadowNav = `0 1px 3px rgba(0, 0, 0, ${0.03 + o * 0.04}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.3 + o * 0.3})`

  const dO = o * 0.5
  const dBg = `rgba(255, 255, 255, ${dO})`
  const dBgStrong = `rgba(255, 255, 255, ${Math.min(dO * 1.5, 0.15)})`
  const dBgSubtle = `rgba(255, 255, 255, ${Math.max(dO * 0.3, 0.015)})`
  const dBgNav = `rgba(255, 255, 255, ${Math.min(dO * 1.4, 0.12)})`
  const dBgModal = `rgba(255, 255, 255, ${Math.min(dO * 1.6, 0.16)})`
  const dBorder = `rgba(255, 255, 255, ${0.06 + dO * 0.4})`
  const dBorderStrong = `rgba(255, 255, 255, ${0.08 + dO * 0.6})`
  const dShadow = `0 8px 32px rgba(0, 0, 0, ${0.2 + dO * 0.2}), 0 2px 8px rgba(0, 0, 0, ${0.1 + dO * 0.1}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.05 + dO * 0.4})`
  const dShadowModal = `0 25px 60px rgba(0, 0, 0, ${0.4 + dO * 0.2}), 0 8px 20px rgba(0, 0, 0, ${0.2 + dO * 0.1}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.1 + dO * 0.3})`
  const dShadowNav = `0 1px 3px rgba(0, 0, 0, ${0.1 + dO * 0.2}), inset 0 0.5px 0 rgba(255, 255, 255, ${0.08 + dO * 0.15})`

  return (
    <style>{`
      .glass {
        background: ${gBg} !important;
        backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        -webkit-backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        border-color: ${gBorder} !important;
        box-shadow: ${gShadow} !important;
        transform: translateZ(0) !important;
      }
      .glass::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.2 + o * 0.6}) 0%, transparent 50%) !important;
      }

      .dark .glass {
        background: ${dBg} !important;
        border-color: ${dBorder} !important;
        box-shadow: ${dShadow} !important;
      }
      .dark .glass::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.05 + dO * 0.3}) 0%, transparent 50%) !important;
      }

      .glass-strong {
        background: ${gBgStrong} !important;
        backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        -webkit-backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        border-color: ${gBorderStrong} !important;
        box-shadow: ${gShadow} !important;
        transform: translateZ(0) !important;
      }
      .glass-strong::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.25 + o * 0.8}) 0%, transparent 50%) !important;
      }

      .dark .glass-strong {
        background: ${dBgStrong} !important;
        border-color: ${dBorderStrong} !important;
        box-shadow: ${dShadow} !important;
      }
      .dark .glass-strong::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.06 + dO * 0.5}) 0%, transparent 50%) !important;
      }

      .glass-subtle {
        background: ${gBgSubtle} !important;
        backdrop-filter: saturate(${(saturation * 0.7).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 0.7).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        border-color: ${gBorder} !important;
        box-shadow: ${gShadow} !important;
        transform: translateZ(0) !important;
      }

      .dark .glass-subtle {
        background: ${dBgSubtle} !important;
        border-color: ${dBorder} !important;
        box-shadow: ${dShadow} !important;
      }

      .glass-nav {
        background: ${gBgNav} !important;
        backdrop-filter: saturate(${(saturation * 1.1).toFixed(1)}) blur(${Math.round(blur * 1.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 1.1).toFixed(1)}) blur(${Math.round(blur * 1.5)}px) !important;
        border-color: ${gBorder} !important;
        box-shadow: ${gShadowNav} !important;
        transform: translateZ(0) !important;
      }

      .dark .glass-nav {
        background: ${dBgNav} !important;
        border-color: ${dBorder} !important;
        box-shadow: ${dShadowNav} !important;
      }

      .glass-modal {
        background: ${gBgModal} !important;
        backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        -webkit-backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        border-color: ${gBorderStrong} !important;
        box-shadow: ${gShadowModal} !important;
        transform: translateZ(0) !important;
      }
      .glass-modal::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.3 + o * 0.8}) 0%, transparent 50%) !important;
      }

      .dark .glass-modal {
        background: ${dBgModal} !important;
        border-color: ${dBorderStrong} !important;
        box-shadow: ${dShadowModal} !important;
      }
      .dark .glass-modal::before {
        background: linear-gradient(180deg, rgba(255,255,255,${0.08 + dO * 0.5}) 0%, transparent 50%) !important;
      }

      .glass-btn {
        background: ${gBgStrong} !important;
        backdrop-filter: saturate(${(saturation * 0.9).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 0.9).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        border-color: ${gBorderStrong} !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0.5px 0 rgba(255, 255, 255, ${0.3 + o * 0.5}) !important;
        transform: translateZ(0) !important;
      }
      .glass-btn:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0.5px 0 rgba(255, 255, 255, ${0.4 + o * 0.5}) !important;
      }

      .dark .glass-btn {
        background: ${dBgStrong} !important;
        border-color: ${dBorderStrong} !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 0.5px 0 rgba(255, 255, 255, 0.1) !important;
      }
      .dark .glass-btn:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(255, 255, 255, 0.15) !important;
      }
    `}</style>
  )
}
