import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import RendererLogger from '@renderer/utils/logger'

interface SubtitleOverlayProps {
  // 保留必要的外部回调 / Keep necessary external callbacks
  onWordHover?: (isHovering: boolean) => void // 用于控制栏显示 / For controls display
  // 新增划词选中相关属性 / New text selection related props
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

/**
 * Renders a full-area overlay for subtitles, forwarding necessary callbacks to the underlying subtitle component.
 *
 * @param onWordHover - Optional callback for word hover events (mainly for controls display).
 * @param enableTextSelection - Whether to enable text selection functionality.
 * @param onSelectionChange - Callback triggered when text selection changes.
 * @returns A React element displaying the subtitle overlay.
 */
function SubtitleOverlay({
  onWordHover,
  enableTextSelection = false,
  onSelectionChange
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
        enableTextSelection={enableTextSelection}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}

// 导出 memo 化的组件
const MemoizedSubtitleOverlay = memo(SubtitleOverlay)

export { MemoizedSubtitleOverlay as SubtitleOverlay }
