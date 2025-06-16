import React, { memo, useMemo } from 'react'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

/**
 * MaskOverlay 组件 - 提供字幕遮罩模式的半透明覆盖层
 * MaskOverlay component - Provides semi-transparent overlay for subtitle mask mode
 */
const MaskOverlay = memo((): React.JSX.Element => {
  const { styles } = useTheme()

  const style = useMemo(
    (): React.CSSProperties => ({
      ...styles.subtitleMaskOverlay,
      position: 'absolute',
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%',
      zIndex: 5,
      pointerEvents: 'none'
    }),
    [styles]
  )

  return <div style={style} />
})

MaskOverlay.displayName = 'MaskOverlay'

export { MaskOverlay }
