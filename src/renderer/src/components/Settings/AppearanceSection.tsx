import React, { useCallback } from 'react'
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
  message
} from 'antd'
import {
  EyeOutlined,
  ReloadOutlined,
  BgColorsOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  CompressOutlined,
  ExpandOutlined,
  BgColorsOutlined as PaletteOutlined,
  FontSizeOutlined,
  BorderOutlined
} from '@ant-design/icons'
import { useSubtitleReset } from '@renderer/hooks/useSubtitleReset'
import { useTheme } from '@renderer/hooks/useTheme'
import type { Color } from 'antd/es/color-picker'
import { ThemeCustomization, useThemeCustomization } from '@renderer/hooks/useThemeCustomization'

const { Text, Title } = Typography

export function AppearanceSection(): React.JSX.Element {
  const { resetSubtitleSettings, hasSubtitleSettings } = useSubtitleReset()
  const { token } = useTheme()
  const {
    customization: themeConfig,
    updateAndApplyTheme,
    resetToDefault
  } = useThemeCustomization()

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
            <Col span={12}>
              <Card
                size="small"
                className={
                  themeConfig.algorithm === 'default' ? 'theme-mode-active' : 'theme-mode-card'
                }
                onClick={() => handleAlgorithmChange('default')}
                style={{
                  cursor: 'pointer',
                  border:
                    themeConfig.algorithm === 'default'
                      ? `2px solid ${token.colorPrimary}`
                      : `1px solid ${token.colorBorderSecondary}`,
                  background:
                    themeConfig.algorithm === 'default'
                      ? token.colorPrimaryBg
                      : token.colorBgContainer
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <SunOutlined
                    style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }}
                  />
                  <div>
                    <Text strong>亮色主题</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      清爽明亮的界面风格
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                size="small"
                className={
                  themeConfig.algorithm === 'dark' ? 'theme-mode-active' : 'theme-mode-card'
                }
                onClick={() => handleAlgorithmChange('dark')}
                style={{
                  cursor: 'pointer',
                  border:
                    themeConfig.algorithm === 'dark'
                      ? `2px solid ${token.colorPrimary}`
                      : `1px solid ${token.colorBorderSecondary}`,
                  background:
                    themeConfig.algorithm === 'dark' ? token.colorPrimaryBg : token.colorBgContainer
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <MoonOutlined
                    style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }}
                  />
                  <div>
                    <Text strong>暗色主题</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      护眼的深色界面
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                size="small"
                className={
                  themeConfig.algorithm === 'compact' ? 'theme-mode-active' : 'theme-mode-card'
                }
                onClick={() => handleAlgorithmChange('compact')}
                style={{
                  cursor: 'pointer',
                  border:
                    themeConfig.algorithm === 'compact'
                      ? `2px solid ${token.colorPrimary}`
                      : `1px solid ${token.colorBorderSecondary}`,
                  background:
                    themeConfig.algorithm === 'compact'
                      ? token.colorPrimaryBg
                      : token.colorBgContainer
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <CompressOutlined
                    style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }}
                  />
                  <div>
                    <Text strong>紧凑主题</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      节省空间的布局
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            <Col span={12}>
              <Card
                size="small"
                className={
                  themeConfig.algorithm === 'darkCompact' ? 'theme-mode-active' : 'theme-mode-card'
                }
                onClick={() => handleAlgorithmChange('darkCompact')}
                style={{
                  cursor: 'pointer',
                  border:
                    themeConfig.algorithm === 'darkCompact'
                      ? `2px solid ${token.colorPrimary}`
                      : `1px solid ${token.colorBorderSecondary}`,
                  background:
                    themeConfig.algorithm === 'darkCompact'
                      ? token.colorPrimaryBg
                      : token.colorBgContainer
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <ExpandOutlined
                    style={{ fontSize: 24, color: token.colorPrimary, marginBottom: 8 }}
                  />
                  <div>
                    <Text strong>暗色紧凑</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      暗色 + 紧凑布局
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
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

        <Divider />

        {/* 字幕设置区域 */}
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: token.marginSM }}>
            <SettingOutlined style={{ marginRight: token.marginXS, color: token.colorPrimary }} />
            字幕显示设置
          </Title>

          <div style={{ marginBottom: token.marginMD }}>
            <Text
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSizeSM,
                display: 'block',
                lineHeight: '1.5'
              }}
            >
              管理字幕的位置、大小和背景设置。如果字幕显示异常或无法看到，可以重置为默认配置。
            </Text>
          </div>

          <Card
            size="small"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <Text strong style={{ color: token.colorText, display: 'block' }}>
                  重置字幕设置
                </Text>
                <Text
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: token.fontSizeSM,
                    lineHeight: '1.4'
                  }}
                >
                  将字幕位置、大小和背景重置为默认配置
                </Text>
                {hasSubtitleSettings() && (
                  <Text
                    style={{
                      color: token.colorWarning,
                      fontSize: token.fontSizeSM,
                      fontStyle: 'italic',
                      display: 'block',
                      marginTop: token.marginXXS
                    }}
                  >
                    检测到自定义字幕设置
                  </Text>
                )}
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={resetSubtitleSettings}
                type="default"
                size="small"
              >
                重置
              </Button>
            </div>
          </Card>
        </div>

        <Divider />

        {/* 说明信息 */}
        <div
          style={{
            background: token.colorInfoBg,
            border: `1px solid ${token.colorInfoBorder}`,
            borderRadius: token.borderRadius,
            padding: token.paddingSM
          }}
        >
          <Text
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
              lineHeight: 1.5
            }}
          >
            💡 <strong>提示：</strong>
            主题设置会立即生效并自动保存。您可以随时点击右上角的&ldquo;重置主题&rdquo;按钮恢复默认设置。
          </Text>
        </div>

        {/* 快捷键说明 */}
        <Collapse
          ghost
          expandIconPosition="end"
          items={[
            {
              key: 'shortcuts',
              label: (
                <Title level={5} style={{ margin: 0 }}>
                  快捷键说明
                </Title>
              ),
              children: (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: token.colorTextSecondary }}>重置字幕设置</Text>
                    <Text
                      code
                      style={{
                        background: token.colorFillQuaternary,
                        color: token.colorPrimary,
                        padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                        borderRadius: token.borderRadius,
                        fontSize: token.fontSizeSM
                      }}
                    >
                      Ctrl + Shift + R
                    </Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: token.colorTextSecondary }}>拖拽字幕位置</Text>
                    <Text
                      code
                      style={{
                        background: token.colorFillQuaternary,
                        color: token.colorPrimary,
                        padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                        borderRadius: token.borderRadius,
                        fontSize: token.fontSizeSM
                      }}
                    >
                      鼠标拖拽
                    </Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: token.colorTextSecondary }}>调整字幕大小</Text>
                    <Text
                      code
                      style={{
                        background: token.colorFillQuaternary,
                        color: token.colorPrimary,
                        padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                        borderRadius: token.borderRadius,
                        fontSize: token.fontSizeSM
                      }}
                    >
                      拖拽右下角
                    </Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: token.colorTextSecondary }}>切换字幕背景</Text>
                    <Text
                      code
                      style={{
                        background: token.colorFillQuaternary,
                        color: token.colorPrimary,
                        padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                        borderRadius: token.borderRadius,
                        fontSize: token.fontSizeSM
                      }}
                    >
                      悬停字幕区域
                    </Text>
                  </div>
                </Space>
              )
            }
          ]}
        />
      </Space>
    </Card>
  )
}
