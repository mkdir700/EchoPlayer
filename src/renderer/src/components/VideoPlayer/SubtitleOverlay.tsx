import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import { useSubtitleDisplayMode } from '@renderer/hooks/useVideoPlaybackHooks'
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
 * 渲染字幕的全区域覆盖层，将必要的回调转发给底层字幕组件。
 *
 * When subtitle display mode is set to 'none', the subtitle component is completely hidden.
 * 当字幕显示模式设置为'none'时，字幕组件完全隐藏。
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
  // 获取当前字幕显示模式 / Get current subtitle display mode
  const displayMode = useSubtitleDisplayMode()

  RendererLogger.componentRender({
    component: 'SubtitleOverlay',
    props: { displayMode }
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

  // 当字幕模式为'none'时，不渲染字幕组件 / Don't render subtitle component when mode is 'none'
  if (displayMode === 'none') {
    RendererLogger.debug('SubtitleOverlay: 字幕模式为隐藏，不渲染SubtitleV3组件')
    return <div style={subtitleOverlayStyle} />
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
