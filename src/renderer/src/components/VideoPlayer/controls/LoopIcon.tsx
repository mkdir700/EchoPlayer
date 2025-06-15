import React from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import type { LoopMode } from '@types_/shared'

interface LoopIconProps {
  mode: LoopMode
  remainingCount: number
  isActive: boolean
  variant?: 'compact' | 'fullscreen'
}

/**
 * 循环播放图标组件，支持显示循环次数
 * Loop playback icon component with support for displaying loop count
 */
export function LoopIcon({
  mode,
  remainingCount,
  isActive,
  variant = 'compact'
}: LoopIconProps): React.JSX.Element {
  const getIconStyle = (): React.CSSProperties => {
    const baseSize = variant === 'fullscreen' ? 16 : 14
    return {
      fontSize: baseSize,
      position: 'relative',
      display: 'inline-block'
    }
  }

  const getCountStyle = (): React.CSSProperties => {
    const baseSize = variant === 'fullscreen' ? 10 : 8
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: baseSize,
      fontWeight: 'bold',
      lineHeight: 1,
      color: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
      textShadow: '0 0 2px rgba(0, 0, 0, 0.8)',
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }

  const renderCountDisplay = (): React.ReactNode => {
    if (mode === 'off') return null

    if (mode === 'single') {
      // 单句循环模式显示无限符号
      return <span style={getCountStyle()}>∞</span>
    }

    if (mode === 'count' && remainingCount > 0) {
      // 指定次数循环模式显示剩余次数
      return <span style={getCountStyle()}>{remainingCount}</span>
    }

    return null
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <ReloadOutlined style={getIconStyle()} />
      {renderCountDisplay()}
    </div>
  )
}
