import React from 'react'
import { Card, Space, Switch, Button, Divider, Typography, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useAppState } from '@renderer/hooks/useAppState'
import { useTheme } from '@renderer/hooks/useTheme'

const { Text } = Typography

interface DataManagementSectionProps {
  className?: string
}

export function DataManagementSection({
  className
}: DataManagementSectionProps): React.JSX.Element {
  const { clearAppState, enableAutoSave, isAutoSaveEnabled } = useAppState()
  const { token, styles } = useTheme()

  const handleClearState = (): void => {
    clearAppState()
    message.success('应用数据已清除')
  }

  const handleToggleAutoSave = (checked: boolean): void => {
    enableAutoSave(checked)
    message.success(checked ? '自动保存已启用' : '自动保存已禁用')
  }

  // Settings item style based on theme system
  const settingsItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${token.paddingMD}px 0`,
    transition: `background-color ${token.motionDurationMid} ease`
  }

  const settingsItemInfoStyle = {
    flex: 1,
    marginRight: token.marginLG
  }

  return (
    <Card
      title="数据管理"
      className={`settings-section-card ${className || ''}`}
      style={styles.cardContainer}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={settingsItemStyle}>
          <div style={settingsItemInfoStyle}>
            <Text strong style={{ color: token.colorText, display: 'block' }}>
              自动保存应用状态
            </Text>
            <Text style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              自动保存视频进度、字幕设置和界面配置
            </Text>
            <Text
              style={{
                color: token.colorTextTertiary,
                fontSize: token.fontSizeSM - 1,
                fontStyle: 'italic',
                marginTop: token.marginXXS,
                display: 'block'
              }}
            >
              注意：只有通过&ldquo;选择文件&rdquo;按钮选择的视频文件才能自动恢复，拖拽上传的文件无法恢复
            </Text>
          </div>
          <Switch checked={isAutoSaveEnabled} onChange={handleToggleAutoSave} />
        </div>

        <Divider style={{ margin: `${token.marginMD}px 0` }} />

        <div style={settingsItemStyle}>
          <div style={settingsItemInfoStyle}>
            <Text strong style={{ color: token.colorText, display: 'block' }}>
              清除所有数据
            </Text>
            <Text style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
              清除所有保存的应用状态和设置
            </Text>
          </div>
          <Button danger icon={<DeleteOutlined />} onClick={handleClearState}>
            清除数据
          </Button>
        </div>
      </Space>
    </Card>
  )
}
