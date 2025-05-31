import React from 'react'
import { Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface LoopToggleButtonProps {
  isLooping: boolean
  isVideoLoaded: boolean
  onLoopToggle: () => void
  className?: string
}

export function LoopToggleButton({
  isLooping,
  isVideoLoaded,
  onLoopToggle,
  className = ''
}: LoopToggleButtonProps): React.JSX.Element {
  return (
    <Tooltip title={isLooping ? '关闭单句循环' : '开启单句循环'}>
      <Button
        icon={<ReloadOutlined />}
        onClick={(e) => {
          onLoopToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={`${className} ${isLooping ? 'active' : ''}`}
        disabled={!isVideoLoaded}
        size="small"
      />
    </Tooltip>
  )
}
