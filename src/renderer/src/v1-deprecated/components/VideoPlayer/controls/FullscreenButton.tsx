import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { useFullscreenMode } from '@renderer/hooks/features/ui/useFullscreenMode'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { Button, Tooltip } from 'antd'
import React from 'react'

interface FullscreenButtonProps {
  variant?: 'compact' | 'fullscreen' // 新增：支持不同的显示模式
}

export function FullscreenButton({
  variant = 'compact'
}: FullscreenButtonProps): React.JSX.Element {
  const { isFullscreen, toggleFullscreen } = useFullscreenMode()
  const { styles } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发

    // 优先使用新的状态管理，如果没有则回退到传入的回调
    toggleFullscreen()
  }

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return styles.fullscreenControlBtn
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return styles.controlBtn
  }

  return (
    <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
      <Button
        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={handleClick}
        type="text"
        style={getButtonStyles()}
        size="small"
      />
    </Tooltip>
  )
}
