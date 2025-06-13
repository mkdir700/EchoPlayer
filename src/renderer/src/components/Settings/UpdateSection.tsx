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
import { useTheme } from '@renderer/hooks/useTheme'
import { UpdateNotificationBadge } from '@renderer/components/UpdateNotificationBadge/UpdateNotificationBadge'
import { useUpdateNotificationStore } from '@renderer/stores'
import { useIsShowRedDot } from '@renderer/stores/slices/updateNotificationStore'

const { Text } = Typography
const { Option } = Select

interface UpdateSettings {
  autoUpdate: boolean
  lastChecked?: number
  updateChannel: 'stable' | 'beta' | 'alpha'
}

export function UpdateSection(): React.JSX.Element {
  // 使用统一的主题系统
  const { token, styles } = useTheme()

  // 使用红点可见性而不是 hasNewVersion / Use red dot visibility instead of hasNewVersion
  const isShowUpdateRedDot = useIsShowRedDot('update_available')

  const { markUpdateAsSeen } = useUpdateNotificationStore()

  const [updateSettings, setUpdateSettings] = useState<UpdateSettings>({
    autoUpdate: true,
    lastChecked: 0,
    updateChannel: 'stable'
  })
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')

  // 组件特有样式 - 其他使用通用主题样式
  const componentStyles = {
    versionInfoContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: token.marginLG
    },
    versionDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXS
    },
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM
    },
    updateChannelSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginSM,
      width: '100%'
    },
    updateChannelSelect: {
      width: 200
    },
    alertContainer: {
      marginTop: token.marginSM
    }
  }

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

  // 检查更新 / Check for updates
  const handleCheckForUpdates = async (): Promise<void> => {
    try {
      setIsCheckingForUpdates(true)

      // 调用更新检查，silent: false 表示用户主动检查，会触发 UpdateNotification 显示
      // Call update check with silent: false to indicate user-initiated check, will trigger UpdateNotification display
      const result = await window.api.update.checkForUpdates({ silent: false })

      // 只有在没有可用更新时才显示"已是最新版本"的通知
      // Only show "already latest version" notification when no updates are available
      if (result && result.status === 'not-available') {
        notification.success({
          message: '已是最新版本',
          description: '您当前使用的已经是最新版本。',
          duration: 3
        })
      }
      // 如果有可用更新 (result.status === 'available')，UpdateNotification 组件会自动显示对话框
      // If updates are available (result.status === 'available'), UpdateNotification component will automatically show dialog
      else if (result && result.status === 'available') {
        console.log('发现可用更新，UpdateNotification 组件将自动显示更新对话框')
        // 不需要额外的通知，因为 UpdateNotification 组件会处理
        // No additional notification needed as UpdateNotification component will handle it
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
      // 设置更新渠道
      await window.api.update.setUpdateChannel(channel)
      const newSettings = { ...updateSettings, updateChannel: channel }
      setUpdateSettings(newSettings)

      notification.success({
        message: '更新渠道已变更',
        description: `已切换到 ${getChannelDisplayName(channel)} 渠道，正在检查新渠道的更新...`,
        duration: 4
      })

      // 立即触发更新检查以查找新渠道的更新
      // Immediately trigger update check to find updates in the new channel
      try {
        setIsCheckingForUpdates(true)
        const result = await window.api.update.checkForUpdates({ silent: true })

        if (result && result.status === 'available') {
          notification.info({
            message: '发现新版本',
            description: `在 ${getChannelDisplayName(channel)} 渠道中发现可用更新`,
            duration: 5
          })
        } else if (result && result.status === 'not-available') {
          notification.success({
            message: '渠道切换完成',
            description: `${getChannelDisplayName(channel)} 渠道已是最新版本`,
            duration: 3
          })
        }
      } catch (updateCheckError) {
        console.warn('切换渠道后检查更新失败:', updateCheckError)
        // 不显示错误通知，因为渠道切换本身是成功的
        // Don't show error notification as the channel switch itself was successful
      } finally {
        setIsCheckingForUpdates(false)
      }
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
    <Card title="应用更新" style={styles.settingsSectionCard}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 版本信息 */}
        <div style={componentStyles.versionInfoContainer}>
          <div style={componentStyles.versionDetails}>
            <div style={componentStyles.versionInfo}>
              <Text strong>当前版本:</Text>
              <Tag color="blue">{currentVersion || '未知'}</Tag>
            </div>
            <Text type="secondary">上次检查: {formatLastChecked(updateSettings.lastChecked)}</Text>
          </div>

          <UpdateNotificationBadge showDot={isShowUpdateRedDot} offset={[-8, 8]}>
            <Button
              type="primary"
              icon={<SyncOutlined spin={isCheckingForUpdates} />}
              loading={isCheckingForUpdates}
              onClick={() => {
                handleCheckForUpdates()
                // 用户点击检查更新时，标记为已查看
                if (isShowUpdateRedDot) {
                  markUpdateAsSeen()
                }
              }}
              style={{ marginLeft: token.marginXS, borderRadius: token.borderRadiusLG }}
            >
              检查更新
            </Button>
          </UpdateNotificationBadge>
        </div>

        <Divider style={styles.settingsDivider} />

        {/* 自动更新设置 */}
        <div style={styles.settingsRow}>
          <div style={styles.settingsRowDescription}>
            <Text strong>自动检查更新</Text>
            <Text type="secondary">应用将定期在后台检查更新并通知您</Text>
          </div>
          <Switch checked={updateSettings.autoUpdate} onChange={handleToggleAutoUpdate} />
        </div>

        <Divider style={styles.settingsDivider} />

        {/* 更新渠道设置 */}
        <div style={componentStyles.updateChannelSection}>
          <Text strong>更新渠道</Text>
          <Select
            value={updateSettings.updateChannel}
            onChange={handleUpdateChannelChange}
            style={componentStyles.updateChannelSelect}
            loading={isCheckingForUpdates}
            disabled={isCheckingForUpdates}
          >
            <Option value="stable">
              <Space>
                <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                稳定版
              </Space>
            </Option>
            <Option value="beta">
              <Space>
                <WarningOutlined style={{ color: token.colorWarning }} />
                测试版
              </Space>
            </Option>
            <Option value="alpha">
              <Space>
                <ExperimentOutlined style={{ color: token.colorError }} />
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
            style={componentStyles.alertContainer}
          />
        </div>

        <Divider style={styles.settingsDivider} />

        {/* 更新说明 */}
        <div>
          <div style={styles.settingsInfoHeader}>
            <InfoCircleOutlined style={styles.settingsInfoIcon} />
            <Text strong>更新功能说明：</Text>
          </div>
          <ul style={styles.settingsFeatureList}>
            <li style={styles.settingsFeatureListItem}>
              <Text>
                <strong>增量更新：</strong> 只下载变更部分，节省带宽和时间
              </Text>
            </li>
            <li style={styles.settingsFeatureListItem}>
              <Text>
                <strong>安全验证：</strong> 更新包经过数字签名验证，确保安全可靠
              </Text>
            </li>
            <li style={styles.settingsFeatureListItem}>
              <Text>
                <strong>自动重启：</strong> 更新完成后，应用将自动重启以应用新版本
              </Text>
            </li>
            <li style={styles.settingsFeatureListItem}>
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
