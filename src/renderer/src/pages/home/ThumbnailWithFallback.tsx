import { DEFAULT_COLOR_PRIMARY } from '@renderer/infrastructure'
import React from 'react'
import styled from 'styled-components'

export interface ThumbnailWithFallbackProps {
  src?: string
  alt: string
  className?: string
}

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const FallbackBox = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: var(--color-background-mute);
`

function getPrimaryColor(): string {
  try {
    const el = document.body || document.documentElement
    const v = getComputedStyle(el).getPropertyValue('--color-primary').trim()
    if (v) return v
  } catch (_e) {
    // 忽略：在 SSR/测试环境可能无法访问 DOM 与 CSS 变量，回退到默认主色
    return DEFAULT_COLOR_PRIMARY
  }
  return DEFAULT_COLOR_PRIMARY
}

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function parseColor(input: string): { r: number; g: number; b: number } | null {
  if (!input) return null
  const s = input.trim().toLowerCase()
  if (s.startsWith('#')) {
    const hex = s.slice(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return { r, g, b }
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return { r, g, b }
    }
    return null
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const parts = m[1]
      .split(',')
      .map((x) => x.trim())
      .slice(0, 3)
      .map((x) => (x.endsWith('%') ? Math.round((parseFloat(x) / 100) * 255) : parseInt(x, 10)))
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      const [r, g, b] = parts
      return { r, g, b }
    }
  }
  return null
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const h = (n: number) => clamp(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function mix(
  c: { r: number; g: number; b: number },
  t: { r: number; g: number; b: number },
  amount: number
) {
  const a = Math.max(0, Math.min(1, amount))
  return {
    r: c.r + (t.r - c.r) * a,
    g: c.g + (t.g - c.g) * a,
    b: c.b + (t.b - c.b) * a
  }
}

function lighten(hex: string, amount = 0.15) {
  const c = parseColor(hex)
  if (!c) return hex
  const white = { r: 255, g: 255, b: 255 }
  return toHex(mix(c, white, amount))
}

function darken(hex: string, amount = 0.15) {
  const c = parseColor(hex)
  if (!c) return hex
  const black = { r: 0, g: 0, b: 0 }
  return toHex(mix(c, black, amount))
}

export function ThumbnailWithFallback({ src, alt, className }: ThumbnailWithFallbackProps) {
  const [errored, setErrored] = React.useState(false)

  if (src && !errored) {
    return <Img className={className} src={src} alt={alt} onError={() => setErrored(true)} />
  }

  const primary = getPrimaryColor()
  const c1 = lighten(primary, 0.12)
  const c2 = darken(primary, 0.18)
  const accent1 = lighten(primary, 0.4)
  const accent2 = lighten(primary, 0.25)

  return (
    <FallbackBox className={className} aria-label={alt} role="img">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 90"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* 基础渐变背景 */}
          <linearGradient id="thumb_g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>

          {/* 角落光斑（极光效果） */}
          <radialGradient id="blob1" cx="20%" cy="15%" r="60%">
            <stop offset="0%" stopColor={accent1} stopOpacity="0.85" />
            <stop offset="100%" stopColor={accent1} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blob2" cx="85%" cy="20%" r="70%">
            <stop offset="0%" stopColor={accent2} stopOpacity="0.6" />
            <stop offset="100%" stopColor={accent2} stopOpacity="0" />
          </radialGradient>

          {/* 细网格图案 */}
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path
              d="M8 0 H0 V8"
              fill="none"
              stroke="var(--color-white)"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </pattern>

          {/* 暗角 */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
          </radialGradient>
        </defs>

        {/* 背景层 */}
        <rect width="160" height="90" fill="url(#thumb_g)" />
        <rect width="160" height="90" fill="url(#blob1)" />
        <rect width="160" height="90" fill="url(#blob2)" />
        <rect width="160" height="90" fill="url(#grid)" />
        <rect width="160" height="90" fill="url(#vignette)" />

        {/* 中心播放图标（极简） */}
        <g opacity="0.95">
          <circle cx="80" cy="45" r="18" fill="var(--color-white)" fillOpacity="0.12" />
          <circle
            cx="80"
            cy="45"
            r="18"
            fill="none"
            stroke="var(--color-white)"
            strokeOpacity="0.28"
          />
          <polygon points="76,36 92,45 76,54" fill="var(--color-white)" />
        </g>
      </svg>
    </FallbackBox>
  )
}

export default ThumbnailWithFallback
