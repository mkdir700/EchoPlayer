import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Switch,
  Typography,
  Space,
  Divider,
  notification,
  Select,
  Alert,
  Tag
} from 'antd'
import {
  SyncOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExperimentOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography
const { Option } = Select

interface UpdateSettings {
  autoUpdate: boolean
  lastChecked?: number
  updateChannel: 'stable' | 'beta' | 'alpha'
}

export function UpdateSection(): React.JSX.Element {
  const [updateSettings, setUpdateSettings] = useState<UpdateSettings>({
    autoUpdate: true,
    lastChecked: 0,
    updateChannel: 'stable'
  })
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')

  // 获取当前版本和设置
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [version, settings] = await Promise.all([
          window.api.update.getAppVersion(),
          window.api.update.getUpdateSettings()
        ])
        setCurrentVersion(version)
        setUpdateSettings(settings)
      } catch (error) {
        console.error('获取应用信息失败:', error)
      }
    }

    loadData()
  }, [])

  // 检查更新
  const handleCheckForUpdates = async (): Promise<void> => {
    try {
      setIsCheckingForUpdates(true)
      const result = await window.api.update.checkForUpdates({ silent: false })

      if (result && result.status === 'not-available') {
        notification.success({
          message: '已是最新版本',
          description: '您当前使用的已经是最新版本。',
          duration: 3
        })
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      notification.error({
        message: '检查更新失败',
        description: String(error),
        duration: 4
      })
    } finally {
      setIsCheckingForUpdates(false)
    }
  }

  // 切换自动更新
  const handleToggleAutoUpdate = async (checked: boolean): Promise<void> => {
    try {
      await window.api.update.enableAutoUpdate(checked)
      const newSettings = { ...updateSettings, autoUpdate: checked }
      setUpdateSettings(newSettings)
      await window.api.update.saveUpdateSettings(newSettings)

      notification.success({
        message: checked ? '已启用自动更新' : '已禁用自动更新',
        description: checked ? '应用将在后台自动检查并提示可用更新' : '您需要手动检查更新',
        duration: 3
      })
    } catch (error) {
      console.error('切换自动更新设置失败:', error)
      notification.error({
        message: '设置失败',
        description: String(error),
        duration: 4
      })
    }
  }

  // 更改更新渠道
  const handleUpdateChannelChange = async (channel: 'stable' | 'beta' | 'alpha'): Promise<void> => {
    try {
      await window.api.update.setUpdateChannel(channel)
      const newSettings = { ...updateSettings, updateChannel: channel }
      setUpdateSettings(newSettings)

      notification.success({
        message: '更新渠道已变更',
        description: `已切换到 ${getChannelDisplayName(channel)} 渠道`,
        duration: 3
      })
    } catch (error) {
      console.error('更改更新渠道失败:', error)
      notification.error({
        message: '设置失败',
        description: String(error),
        duration: 4
      })
    }
  }

  // 获取渠道显示名称
  const getChannelDisplayName = (channel: string): string => {
    switch (channel) {
      case 'stable':
        return '稳定版'
      case 'beta':
        return '测试版'
      case 'alpha':
        return '开发版'
      default:
        return '未知'
    }
  }

  // 格式化最后检查时间
  const formatLastChecked = (timestamp?: number): string => {
    if (!timestamp) return '从未检查'
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '刚刚检查'
    if (diffInHours < 24) return `${diffInHours} 小时前`
    return `${Math.floor(diffInHours / 24)} 天前`
  }

  return (
    <Card title="应用更新" className="settings-card">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 版本信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong>当前版本:</Text>
            <Tag color="blue">{currentVersion || '未知'}</Tag>
            <Text type="secondary">上次检查: {formatLastChecked(updateSettings.lastChecked)}</Text>
          </Space>

          <Button
            type="primary"
            icon={<SyncOutlined spin={isCheckingForUpdates} />}
            loading={isCheckingForUpdates}
            onClick={handleCheckForUpdates}
          >
            检查更新
          </Button>
        </div>

        <Divider />

        {/* 自动更新设置 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space direction="vertical">
            <Text strong>自动检查更新</Text>
            <Text type="secondary">应用将定期在后台检查更新并通知您</Text>
          </Space>
          <Switch checked={updateSettings.autoUpdate} onChange={handleToggleAutoUpdate} />
        </div>

        <Divider />

        {/* 更新渠道设置 */}
        <div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>更新渠道</Text>
            <Select
              value={updateSettings.updateChannel}
              onChange={handleUpdateChannelChange}
              style={{ width: 200 }}
            >
              <Option value="stable">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  稳定版
                </Space>
              </Option>
              <Option value="beta">
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  测试版
                </Space>
              </Option>
              <Option value="alpha">
                <Space>
                  <ExperimentOutlined style={{ color: '#f5222d' }} />
                  开发版
                </Space>
              </Option>
            </Select>

            <Alert
              message={
                <Space>
                  <Text>当前使用 {getChannelDisplayName(updateSettings.updateChannel)} 渠道</Text>
                </Space>
              }
              description={
                updateSettings.updateChannel === 'stable'
                  ? '推荐用于日常使用，稳定性最高，更新频率较低'
                  : updateSettings.updateChannel === 'beta'
                    ? '包含新功能的预发布版本，可能存在一些已知问题'
                    : '包含最新功能的开发版本，仅供测试使用，可能不稳定'
              }
              type={
                updateSettings.updateChannel === 'stable'
                  ? 'success'
                  : updateSettings.updateChannel === 'beta'
                    ? 'warning'
                    : 'error'
              }
              showIcon
              style={{ marginTop: 8 }}
            />
          </Space>
        </div>

        <Divider />

        {/* 更新说明 */}
        <div>
          <Paragraph>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            <Text strong>更新功能说明：</Text>
          </Paragraph>
          <ul style={{ paddingLeft: 24, margin: 0 }}>
            <li>
              <Text>
                <strong>增量更新：</strong> 只下载变更部分，节省带宽和时间
              </Text>
            </li>
            <li>
              <Text>
                <strong>安全验证：</strong> 更新包经过数字签名验证，确保安全可靠
              </Text>
            </li>
            <li>
              <Text>
                <strong>自动重启：</strong> 更新完成后，应用将自动重启以应用新版本
              </Text>
            </li>
            <li>
              <Text>
                <strong>回滚保护：</strong> 支持在更新失败时自动回滚到之前版本
              </Text>
            </li>
          </ul>
        </div>
      </Space>
    </Card>
  )
}
