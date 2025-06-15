import React from 'react'
import { ReloadOutlined } from '@ant-design/icons'

interface LoopIconProps {
  isSingleLoop: boolean // 是否开启循环 / Whether loop is enabled
  count: number // 循环次数：-1=无限，2-50=指定次数 / Loop count: -1=infinite, 2-50=specific count
  remainingCount: number // 剩余循环次数 / Remaining loop count
  isActive: boolean // 是否激活状态 / Whether active state
  variant?: 'compact' | 'fullscreen' // 显示变体 / Display variant
}

/**
 * 循环播放图标组件，支持显示循环次数
 * Loop playback icon component with support for displaying loop count
 */
export function LoopIcon({
  isSingleLoop,
  count,
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
    if (!isSingleLoop) return null // 循环关闭时不显示 / Don't display when loop is off

    if (count === -1) {
      // 无限循环显示无限符号 / Infinite loop shows infinity symbol
      return <span style={getCountStyle()}>∞</span>
    }

    if (count >= 2 && remainingCount > 0) {
      // 指定次数循环显示剩余次数 / Specific count loop shows remaining count
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
