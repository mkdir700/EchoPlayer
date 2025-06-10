import React, { memo, useMemo } from 'react'
import { useTheme } from '@renderer/hooks/useTheme'
import type { ResizeHandleProps } from '../types'

/**
 * ResizeHandle 组件 - 提供字幕容器的调节大小控制手柄
 * ResizeHandle component - Provides resize control handle for subtitle container
 */
const ResizeHandle = memo(
  ({ visible, buttonSize, onMouseDown }: ResizeHandleProps): React.JSX.Element | null => {
    const { styles } = useTheme()

    const handleStyle = useMemo(
      (): React.CSSProperties => ({
        ...styles.subtitleResizeHandle,
        bottom: 0,
        right: 0,
        width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        cursor: 'se-resize',
        borderRadius: '3px 0 8px 0'
      }),
      [styles, buttonSize]
    )

    if (!visible) return null

    return <div onMouseDown={onMouseDown} style={handleStyle} />
  }
)

ResizeHandle.displayName = 'ResizeHandle'

export { ResizeHandle }
