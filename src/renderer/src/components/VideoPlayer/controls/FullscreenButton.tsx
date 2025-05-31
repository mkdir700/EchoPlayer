import React from 'react'
import { Button, Tooltip } from 'antd'
import { FullscreenOutlined } from '@ant-design/icons'

interface FullscreenButtonProps {
  onFullscreenToggle: () => void
  className?: string
}

export function FullscreenButton({
  onFullscreenToggle,
  className = ''
}: FullscreenButtonProps): React.JSX.Element {
  return (
    <Tooltip title="进入全屏">
      <Button
        icon={<FullscreenOutlined />}
        onClick={(e) => {
          onFullscreenToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={className}
        size="small"
      />
    </Tooltip>
  )
}
