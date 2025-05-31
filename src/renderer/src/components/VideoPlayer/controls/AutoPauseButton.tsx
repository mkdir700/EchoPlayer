import React from 'react'
import { Button, Tooltip } from 'antd'
import { PauseCircleFilled } from '@ant-design/icons'

interface AutoPauseButtonProps {
  autoPause: boolean
  isVideoLoaded: boolean
  onAutoSkipToggle: () => void
  className?: string
}

export function AutoPauseButton({
  autoPause,
  isVideoLoaded,
  onAutoSkipToggle,
  className = ''
}: AutoPauseButtonProps): React.JSX.Element {
  return (
    <Tooltip title={autoPause ? '关闭自动暂停' : '开启自动暂停'}>
      <Button
        icon={<PauseCircleFilled />}
        onClick={(e) => {
          onAutoSkipToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={`${className} ${autoPause ? 'active' : ''}`}
        disabled={!isVideoLoaded}
        size="small"
      />
    </Tooltip>
  )
}
