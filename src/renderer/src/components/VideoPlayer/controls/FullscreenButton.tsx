import React from 'react'
import { Button, Tooltip } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { useFullscreenMode } from '@renderer/hooks/useFullscreenMode'

interface FullscreenButtonProps {
  onFullscreenToggle?: () => void // 保持向后兼容，但已可选
  className?: string
}

export function FullscreenButton({
  onFullscreenToggle,
  className = ''
}: FullscreenButtonProps): React.JSX.Element {
  const { isFullscreen, toggleFullscreen } = useFullscreenMode()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发

    // 优先使用新的状态管理，如果没有则回退到传入的回调
    toggleFullscreen()

    // 如果有传入的回调也调用它（向后兼容）
    if (onFullscreenToggle) {
      onFullscreenToggle()
    }
  }

  return (
    <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
      <Button
        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={handleClick}
        type="text"
        className={className}
        size="small"
      />
    </Tooltip>
  )
}
