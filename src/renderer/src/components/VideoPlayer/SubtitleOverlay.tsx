import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import RendererLogger from '@renderer/utils/logger'

interface SubtitleOverlayProps {
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

function SubtitleOverlay({ onWordHover, onPauseOnHover }: SubtitleOverlayProps): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleOverlay'
  })

  const subtitleOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  }

  return (
    <div style={subtitleOverlayStyle}>
      <SubtitleV3 onWordHover={onWordHover} onPauseOnHover={onPauseOnHover} />
    </div>
  )
}

// 导出 memo 化的组件
const MemoizedSubtitleOverlay = memo(SubtitleOverlay)

export { MemoizedSubtitleOverlay as SubtitleOverlay }
