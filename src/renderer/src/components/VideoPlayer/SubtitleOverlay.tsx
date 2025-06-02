import React, { memo } from 'react'
import { SubtitleV3 } from './SubtitleV3'
import RendererLogger from '@renderer/utils/logger'
import styles from './VideoPlayer.module.css'

interface SubtitleOverlayProps {
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

function SubtitleOverlay({ onWordHover, onPauseOnHover }: SubtitleOverlayProps): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleOverlay'
  })

  return (
    <div className={styles.subtitleOverlay}>
      <SubtitleV3 onWordHover={onWordHover} onPauseOnHover={onPauseOnHover} />
    </div>
  )
}

// 导出 memo 化的组件
const MemoizedSubtitleOverlay = memo(SubtitleOverlay)

export { MemoizedSubtitleOverlay as SubtitleOverlay }
