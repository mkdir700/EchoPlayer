import React, { useState, useEffect } from 'react'
import { Card, Space, Switch, Button, Divider, Typography, message, Input } from 'antd'
import { DeleteOutlined, FolderOpenOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppState } from '@renderer/hooks/useAppState'
import { useTheme } from '@renderer/hooks/useTheme'
import { useAppConfig } from '@renderer/hooks/useAppConfig'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'

const { Text } = Typography

interface DataManagementSectionProps {
  className?: string
}

export function DataManagementSection({
  className
}: DataManagementSectionProps): React.JSX.Element {
  const { clearAppState, enableAutoSave, isAutoSaveEnabled } = useAppState()
  const { token, styles } = useTheme()
  const { dataDirectory, updateConfig, loading } = useAppConfig()
  const [tempDataDirectory, setTempDataDirectory] = useState<string>(dataDirectory)

  // 同步 dataDirectory 变化 / Sync dataDirectory changes
  useEffect(() => {
    setTempDataDirectory(dataDirectory)
  }, [dataDirectory])

  const handleClearState = (): void => {
    clearAppState()
    message.success('应用数据已清除')
  }

  const handleToggleAutoSave = (checked: boolean): void => {
    enableAutoSave(checked)
    message.success(checked ? '自动保存已启用' : '自动保存已禁用')
  }

  const handleSelectDataDirectory = async (): Promise<void> => {
    try {
      const result = await FileSystemHelper.openFileDialog({
        title: '选择数据存储目录',
        properties: ['openDirectory']
      })

      if (result && result.length > 0) {
        const selectedPath = result[0]
        setTempDataDirectory(selectedPath)

        const response = await updateConfig({ dataDirectory: selectedPath })
        if (response.success) {
          message.success('数据目录已更新')
        } else {
          message.error(response.error || '更新数据目录失败')
        }
      }
    } catch (error) {
      console.error('选择数据目录失败:', error)
      message.error('选择数据目录失败')
    }
  }

  const handleDataDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTempDataDirectory(e.target.value)
  }

  const handleDataDirectoryInputBlur = async (): Promise<void> => {
    if (tempDataDirectory !== dataDirectory && tempDataDirectory.trim()) {
      try {
        const response = await updateConfig({ dataDirectory: tempDataDirectory.trim() })
        if (response.success) {
          message.success('数据目录已更新')
        } else {
          message.error(response.error || '更新数据目录失败')
          // 恢复为原来的值
          setTempDataDirectory(dataDirectory)
        }
      } catch (error) {
        console.error('更新数据目录失败:', error)
        message.error('更新数据目录失败')
        // 恢复为原来的值
        setTempDataDirectory(dataDirectory)
      }
    } else if (!tempDataDirectory.trim()) {
      // 如果输入为空，恢复为原来的值
      setTempDataDirectory(dataDirectory)
      message.warning('数据目录不能为空')
    }
  }

  const handleResetToDefault = async (): Promise<void> => {
    try {
      const defaultPath = await window.api.appConfig.getDefaultDataDirectory()
      setTempDataDirectory(defaultPath)

      const response = await updateConfig({ dataDirectory: defaultPath })
      if (response.success) {
        message.success('已重置为默认数据目录')
      } else {
        message.error(response.error || '重置失败')
        setTempDataDirectory(dataDirectory)
      }
    } catch (error) {
      console.error('重置数据目录失败:', error)
      message.error('重置数据目录失败')
    }
  }

  return (
    <Card
      title="数据管理"
      className={`settings-section-card ${className || ''}`}
      style={styles.settingsSectionCard}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 自动保存设置 */}
        <div style={styles.settingsRow}>
          <div style={styles.settingsRowDescription}>
            <Text
              strong
              style={{ color: token.colorText, display: 'block', marginBottom: token.marginXXS }}
            >
              自动保存应用状态
            </Text>
            <Text
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSizeSM,
                lineHeight: 1.5
              }}
            >
              自动保存视频进度、字幕设置和界面配置
            </Text>
          </div>
          <Switch
            checked={isAutoSaveEnabled}
            onChange={handleToggleAutoSave}
            style={{ flexShrink: 0 }}
          />
        </div>

        <Divider style={styles.settingsDivider} />

        {/* 数据存储目录设置 */}
        <div style={styles.settingsRow}>
          <div style={styles.settingsRowDescription}>
            <Text
              strong
              style={{ color: token.colorText, display: 'block', marginBottom: token.marginXXS }}
            >
              数据存储目录
            </Text>
            <Text
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSizeSM,
                lineHeight: 1.5
              }}
            >
              设置应用数据和缓存文件的存储位置
            </Text>
          </div>

          {/* 数据目录控制区域 - 右对齐 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              gap: token.marginXS,
              alignItems: 'flex-end',
              minWidth: 280,
              maxWidth: 320
            }}
          >
            {/* 输入框和浏览按钮 */}
            <Space.Compact style={{ width: '100%', maxWidth: 280 }}>
              <Input
                placeholder="输入路径"
                value={tempDataDirectory}
                onChange={handleDataDirectoryInputChange}
                onBlur={handleDataDirectoryInputBlur}
                style={{
                  fontFamily: token.fontFamilyCode || 'monospace',
                  fontSize: token.fontSizeSM
                }}
                required
              />
              <Button
                icon={<FolderOpenOutlined />}
                onClick={handleSelectDataDirectory}
                loading={loading}
                type="default"
              >
                浏览
              </Button>
            </Space.Compact>

            {/* 重置按钮 */}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleResetToDefault}
              loading={loading}
              type="link"
              style={{
                color: token.colorTextTertiary,
                padding: 0,
                height: 'auto',
                fontSize: token.fontSizeSM - 1
              }}
            >
              重置为默认目录
            </Button>
          </div>
        </div>

        <Divider style={styles.settingsDivider} />

        {/* 清除数据设置 */}
        <div style={styles.settingsRow}>
          <div style={styles.settingsRowDescription}>
            <Text
              strong
              style={{ color: token.colorText, display: 'block', marginBottom: token.marginXXS }}
            >
              清除所有数据
            </Text>
            <Text
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSizeSM,
                lineHeight: 1.5
              }}
            >
              清除所有保存的应用状态和设置
            </Text>
            <Text
              style={{
                color: token.colorWarning,
                fontSize: token.fontSizeSM - 1,
                marginTop: token.marginXS,
                display: 'block',
                lineHeight: 1.4
              }}
            >
              ⚠️ 此操作不可逆，请谨慎操作
            </Text>
          </div>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearState}
            style={{ flexShrink: 0 }}
          >
            清除数据
          </Button>
        </div>
      </Space>
    </Card>
  )
}
