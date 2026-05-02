"use client"

import { useGlassSettings } from "@/hooks/useGlassSettings"

export function GlassStyleInjector() {
  const { settings } = useGlassSettings()
  const { enabled, blur, opacity, saturation } = settings

  if (!enabled) {
    return (
      <style>{`
        .glass, .glass-strong, .glass-subtle, .glass-nav, .glass-modal, .glass-btn {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: var(--bg-card) !important;
          border: 1px solid var(--border-light) !important;
          box-shadow: var(--shadow-sm) !important;
        }
        .glass::before, .glass-strong::before, .glass-modal::before { display: none !important; }
      `}</style>
    )
  }

  return (
    <style>{`
      .glass, .glass-strong, .glass-subtle {
        backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        -webkit-backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
      }
      .glass-nav {
        backdrop-filter: saturate(${(saturation * 1.1).toFixed(1)}) blur(${Math.round(blur * 1.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 1.1).toFixed(1)}) blur(${Math.round(blur * 1.5)}px) !important;
      }
      .glass-modal {
        backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
        -webkit-backdrop-filter: saturate(${saturation}) blur(${blur}px) !important;
      }
      .glass-btn {
        backdrop-filter: saturate(${(saturation * 0.9).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 0.9).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
      }
      .glass-subtle {
        backdrop-filter: saturate(${(saturation * 0.7).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
        -webkit-backdrop-filter: saturate(${(saturation * 0.7).toFixed(1)}) blur(${Math.round(blur * 0.5)}px) !important;
      }
    `}</style>
  )
}
