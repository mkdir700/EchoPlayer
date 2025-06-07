import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import RendererLogger from '@renderer/utils/logger'

interface SubtitleOverlayProps {
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
  onResumeOnLeave: () => void
}

/**
 * Renders a full-area overlay for subtitles, forwarding hover and pause events to the underlying subtitle component.
 *
 * @param onWordHover - Callback invoked when a word in the subtitle is hovered or unhovered.
 * @param onPauseOnHover - Callback triggered when playback should pause (called when word card is shown).
 * @param onResumeOnLeave - Callback triggered when playback should resume (called when word card is closed).
 * @returns A React element displaying the subtitle overlay.
 */
function SubtitleOverlay({
  onWordHover,
  onPauseOnHover,
  onResumeOnLeave
}: SubtitleOverlayProps): React.JSX.Element {
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
      <SubtitleV3
        onWordHover={onWordHover}
        onPauseOnHover={onPauseOnHover}
        onResumeOnLeave={onResumeOnLeave}
      />
    </div>
  )
}

// 导出 memo 化的组件
const MemoizedSubtitleOverlay = memo(SubtitleOverlay)

export { MemoizedSubtitleOverlay as SubtitleOverlay }
