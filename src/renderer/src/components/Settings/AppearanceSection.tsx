import React, { useCallback, useState } from 'react'
import {
  Card,
  Typography,
  Button,
  Space,
  Divider,
  ColorPicker,
  Slider,
  Row,
  Col,
  Collapse,
  InputNumber,
  message,
  Switch,
  Alert,
  Modal
} from 'antd'
import {
  EyeOutlined,
  ReloadOutlined,
  BgColorsOutlined,
  SunOutlined,
  MoonOutlined,
  CompressOutlined,
  ExpandOutlined,
  BgColorsOutlined as PaletteOutlined,
  FontSizeOutlined,
  BorderOutlined,
  WindowsOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined as RestartOutlined
} from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'
import type { Color } from 'antd/es/color-picker'
import { ThemeCustomization, useThemeCustomization } from '@renderer/hooks/useThemeCustomization'
import { useAppConfig } from '@renderer/hooks/useAppConfig'

const { Text, Title } = Typography

interface ThemeModeCardProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}

/**
 * Reusable theme mode card component
 */
function ThemeModeCard({
  active,
  onClick,
  icon,
  title,
  description
}: ThemeModeCardProps): React.JSX.Element {
  const { token } = useTheme()

  return (
    <Col span={12}>
      <Card
        size="small"
        className={active ? 'theme-mode-active' : 'theme-mode-card'}
        onClick={onClick}
        style={{
          cursor: 'pointer',
          border: active
            ? `2px solid ${token.colorPrimary}`
            : `1px solid ${token.colorBorderSecondary}`,
          background: active ? token.colorPrimaryBg : token.colorBgContainer
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }}>{icon}</div>
          <div>
            <Text strong>{title}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
              {description}
            </Text>
          </div>
        </div>
      </Card>
    </Col>
  )
}

// Theme mode configuration
const themeModes = [
  {
    key: 'default' as const,
    icon: <SunOutlined />,
    title: '亮色主题',
    description: '清爽明亮的界面风格'
  },
  {
    key: 'dark' as const,
    icon: <MoonOutlined />,
    title: '暗色主题',
    description: '护眼的深色界面'
  },
  {
    key: 'compact' as const,
    icon: <CompressOutlined />,
    title: '紧凑主题',
    description: '节省空间的布局'
  },
  {
    key: 'darkCompact' as const,
    icon: <ExpandOutlined />,
    title: '暗色紧凑',
    description: '暗色 + 紧凑布局'
  }
]

/**
 * Renders the appearance settings section, providing a user interface for customizing theme modes, colors, and subtitle display options.
 *
 * Includes controls for selecting theme algorithms (light, dark, compact, dark compact), customizing primary and status colors, and resetting theme or subtitle settings. Typography and layout customization panels are present but currently disabled. Also displays informational tips and shortcut key explanations related to subtitle management.
 *
 * @returns The appearance settings UI as a React element.
 */
export function AppearanceSection(): React.JSX.Element {
  const { token } = useTheme()
  const {
    customization: themeConfig,
    updateAndApplyTheme,
    resetToDefault
  } = useThemeCustomization()

  // 应用配置管理 / Application configuration management
  const { useWindowFrame, updateConfig, restartApp } = useAppConfig()
  const [isRestartModalVisible, setIsRestartModalVisible] = useState(false)

  const handleColorChange = useCallback(
    (
      colorType: keyof Pick<
        ThemeCustomization,
        'colorPrimary' | 'colorSuccess' | 'colorWarning' | 'colorError'
      >
    ) =>
      (color: Color | string) => {
        const colorValue = typeof color === 'string' ? color : color.toHexString()
        updateAndApplyTheme({ [colorType]: colorValue })
      },
    [updateAndApplyTheme]
  )

  const handleSliderChange = useCallback(
    (configKey: keyof Pick<ThemeCustomization, 'borderRadius' | 'fontSize'>) => (value: number) => {
      updateAndApplyTheme({ [configKey]: value })
    },
    [updateAndApplyTheme]
  )

  const handleAlgorithmChange = useCallback(
    (algorithm: ThemeCustomization['algorithm']) => {
      updateAndApplyTheme({ algorithm })
    },
    [updateAndApplyTheme]
  )

  const handleReset = useCallback(() => {
    resetToDefault()
    message.success('主题设置已重置为默认配置')
  }, [resetToDefault])

  // 窗口框架设置处理器 / Window frame settings handlers
  const handleWindowFrameChange = useCallback(
    async (checked: boolean) => {
      try {
        const response = await updateConfig({ useWindowFrame: checked })
        if (response.success) {
          // 显示重启确认对话框 / Show restart confirmation dialog
          setIsRestartModalVisible(true)
        } else {
          message.error(response.error || '更新窗口框架设置失败')
        }
      } catch (error) {
        console.error('更新窗口框架设置失败:', error)
        message.error('更新窗口框架设置失败')
      }
    },
    [updateConfig]
  )

  const handleConfirmRestart = useCallback(async () => {
    try {
      await restartApp()
    } catch (error) {
      console.error('重启应用失败:', error)
      message.error('重启应用失败')
    }
  }, [restartApp])

  const handleCancelRestart = useCallback(() => {
    setIsRestartModalVisible(false)
    message.info('设置已保存，请手动重启应用使设置生效')
  }, [])

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EyeOutlined style={{ color: token.colorPrimary }} />
          <span>外观设置</span>
        </div>
      }
      className="settings-section-card"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} size="small" onClick={handleReset} type="default">
            重置主题
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Theme Algorithm Selection */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: token.marginSM }}>
            <BgColorsOutlined style={{ marginRight: token.marginXS, color: token.colorPrimary }} />
            主题模式
          </Title>

          <Row gutter={[16, 16]}>
            {themeModes.map((mode) => (
              <ThemeModeCard
                key={mode.key}
                active={themeConfig.algorithm === mode.key}
                onClick={() => handleAlgorithmChange(mode.key)}
                icon={mode.icon}
                title={mode.title}
                description={mode.description}
              />
            ))}
          </Row>
        </div>

        <Divider />

        {/* 窗口框架设置 / Window Frame Settings */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: token.marginSM }}>
            <WindowsOutlined style={{ marginRight: token.marginXS, color: token.colorPrimary }} />
            窗口框架设置
          </Title>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: `${token.paddingMD}px 0`
            }}
          >
            <div style={{ flex: 1, marginRight: token.marginLG }}>
              <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                使用系统窗口框架
              </Text>
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                启用后将使用系统原生的窗口标题栏和边框，禁用后将使用自定义的沉浸式标题栏设计
              </Text>
              <br />
              <Alert
                message="更改此设置需要重启应用才能生效"
                type="info"
                showIcon
                style={{ marginTop: token.marginSM }}
                icon={<ExclamationCircleOutlined />}
              />
            </div>
            <Switch
              checked={useWindowFrame}
              onChange={handleWindowFrameChange}
              checkedChildren="系统框架"
              unCheckedChildren="沉浸式"
            />
          </div>
        </div>

        <Divider />

        {/* Color Customization */}
        <Collapse
          defaultActiveKey={['colors']}
          ghost
          expandIconPosition="end"
          items={[
            {
              key: 'colors',
              label: (
                <Title level={5} style={{ margin: 0 }}>
                  <PaletteOutlined
                    style={{ marginRight: token.marginXS, color: token.colorPrimary }}
                  />
                  色彩定制
                </Title>
              ),
              children: (
                <Row gutter={[24, 16]}>
                  <Col span={12}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text strong>主色调</Text>
                      <ColorPicker
                        value={themeConfig.colorPrimary}
                        onChange={handleColorChange('colorPrimary')}
                        showText
                        size="large"
                        presets={[
                          {
                            label: 'Apple Colors',
                            colors: ['#007AFF', '#5AC8FA', '#34C759', '#FF9500', '#FF3B30']
                          }
                        ]}
                      />
                    </div>
                  </Col>

                  <Col span={12}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text strong>成功色</Text>
                      <ColorPicker
                        value={themeConfig.colorSuccess}
                        onChange={handleColorChange('colorSuccess')}
                        showText
                        size="large"
                      />
                    </div>
                  </Col>

                  <Col span={12}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text strong>警告色</Text>
                      <ColorPicker
                        value={themeConfig.colorWarning}
                        onChange={handleColorChange('colorWarning')}
                        showText
                        size="large"
                      />
                    </div>
                  </Col>

                  <Col span={12}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text strong>错误色</Text>
                      <ColorPicker
                        value={themeConfig.colorError}
                        onChange={handleColorChange('colorError')}
                        showText
                        size="large"
                      />
                    </div>
                  </Col>
                </Row>
              )
            },
            {
              key: 'typography',
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  <Title level={5} style={{ margin: 0, color: token.colorTextTertiary }}>
                    <FontSizeOutlined
                      style={{ marginRight: token.marginXS, color: token.colorTextTertiary }}
                    />
                    字体设置
                  </Title>
                  <Text
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorTextTertiary,
                      fontStyle: 'italic',
                      background: token.colorFillAlter,
                      padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`
                    }}
                  >
                    暂不支持
                  </Text>
                </div>
              ),
              children: (
                <div
                  style={{
                    position: 'relative',
                    opacity: 0.5,
                    pointerEvents: 'none'
                  }}
                >
                  <Row gutter={[24, 16]}>
                    <Col span={24}>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: token.marginSM
                          }}
                        >
                          <Text strong>基础字号</Text>
                          <InputNumber
                            value={themeConfig.fontSize}
                            onChange={(value) => handleSliderChange('fontSize')(value || 16)}
                            min={12}
                            max={20}
                            step={1}
                            addonAfter="px"
                            size="small"
                            disabled
                          />
                        </div>
                        <Slider
                          value={themeConfig.fontSize}
                          onChange={handleSliderChange('fontSize')}
                          min={12}
                          max={20}
                          marks={{ 12: '12px', 14: '14px', 16: '16px', 18: '18px', 20: '20px' }}
                          step={1}
                          disabled
                        />
                      </div>
                    </Col>
                  </Row>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: token.colorBgElevated,
                      padding: `${token.paddingXS}px ${token.paddingSM}px`,
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorder}`,
                      fontSize: token.fontSizeSM,
                      color: token.colorTextSecondary,
                      fontWeight: 500,
                      boxShadow: token.boxShadow
                    }}
                  >
                    🚧 功能开发中，敬请期待
                  </div>
                </div>
              )
            },
            {
              key: 'layout',
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  <Title level={5} style={{ margin: 0, color: token.colorTextTertiary }}>
                    <BorderOutlined
                      style={{ marginRight: token.marginXS, color: token.colorTextTertiary }}
                    />
                    布局设置
                  </Title>
                  <Text
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorTextTertiary,
                      fontStyle: 'italic',
                      background: token.colorFillAlter,
                      padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`
                    }}
                  >
                    暂不支持
                  </Text>
                </div>
              ),
              children: (
                <div
                  style={{
                    position: 'relative',
                    opacity: 0.5,
                    pointerEvents: 'none'
                  }}
                >
                  <Row gutter={[24, 16]}>
                    <Col span={24}>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: token.marginSM
                          }}
                        >
                          <Text strong>圆角大小</Text>
                          <InputNumber
                            value={themeConfig.borderRadius}
                            onChange={(value) => handleSliderChange('borderRadius')(value || 8)}
                            min={0}
                            max={16}
                            step={1}
                            addonAfter="px"
                            size="small"
                            disabled
                          />
                        </div>
                        <Slider
                          value={themeConfig.borderRadius}
                          onChange={handleSliderChange('borderRadius')}
                          min={0}
                          max={16}
                          marks={{ 0: '0px', 4: '4px', 8: '8px', 12: '12px', 16: '16px' }}
                          step={1}
                          disabled
                        />
                      </div>
                    </Col>
                  </Row>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: token.colorBgElevated,
                      padding: `${token.paddingXS}px ${token.paddingSM}px`,
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorder}`,
                      fontSize: token.fontSizeSM,
                      color: token.colorTextSecondary,
                      fontWeight: 500,
                      boxShadow: token.boxShadow
                    }}
                  >
                    🚧 功能开发中，敬请期待
                  </div>
                </div>
              )
            }
          ]}
        />
      </Space>

      {/* 重启确认对话框 / Restart confirmation modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginXS }}>
            <RestartOutlined style={{ color: token.colorPrimary }} />
            <span>重启应用</span>
          </div>
        }
        open={isRestartModalVisible}
        onOk={handleConfirmRestart}
        onCancel={handleCancelRestart}
        okText="立即重启"
        cancelText="稍后手动重启"
        okButtonProps={{
          icon: <RestartOutlined />,
          type: 'primary'
        }}
        cancelButtonProps={{
          type: 'default'
        }}
        centered
        maskClosable={false}
      >
        <div style={{ padding: `${token.paddingSM}px 0` }}>
          <Text>窗口框架设置已更新。为了使新设置生效，需要重启应用。</Text>
          <br />
          <br />
          <Text type="secondary">您可以选择立即重启，或者稍后手动重启应用。</Text>
        </div>
      </Modal>
    </Card>
  )
}
