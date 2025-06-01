import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import { DisplayMode } from '@renderer/types'
import RendererLogger from '@renderer/utils/logger'
import styles from './VideoPlayer.module.css'

interface SubtitleOverlayProps {
  displayModeRef: React.RefObject<DisplayMode>
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

function SubtitleOverlay({
  displayModeRef,
  onWordHover,
  onPauseOnHover
}: SubtitleOverlayProps): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleOverlay',
    props: {
      displayMode: displayModeRef.current
    }
  })

  return (
    <div className={styles.subtitleOverlay}>
      <SubtitleV3
        displayMode={displayModeRef.current}
        onWordHover={onWordHover}
        onPauseOnHover={onPauseOnHover}
      />
    </div>
  )
}

// 导出 memo 化的组件
const MemoizedSubtitleOverlay = memo(SubtitleOverlay)

export { MemoizedSubtitleOverlay as SubtitleOverlay }
