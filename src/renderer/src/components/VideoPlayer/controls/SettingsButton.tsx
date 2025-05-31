import React, { useState } from 'react'
import { Button, Tooltip, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

const { Text } = Typography

interface SettingsButtonProps {
  className?: string
  popupClassName?: string
  buttonClassName?: string
}

export function SettingsButton({
  className = '',
  popupClassName = '',
  buttonClassName = ''
}: SettingsButtonProps): React.JSX.Element {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className={className}>
      <Tooltip title="更多设置">
        <Button
          icon={<SettingOutlined />}
          type="text"
          onClick={(e) => {
            setShowSettings(!showSettings)
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          size="small"
          className={buttonClassName}
        />
      </Tooltip>

      {showSettings && (
        <div className={popupClassName}>
          <div>
            <Text>播放设置</Text>
            <div>
              <Text>更多功能即将推出...</Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
