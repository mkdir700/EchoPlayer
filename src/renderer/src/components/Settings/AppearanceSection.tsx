import React from 'react'
import { Card, Typography, Button, Space, Divider } from 'antd'
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { useSubtitleReset } from '@renderer/hooks/useSubtitleReset'

const { Text } = Typography

export function AppearanceSection(): React.JSX.Element {
  const { resetSubtitleSettings, hasSubtitleSettings } = useSubtitleReset()

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EyeOutlined style={{ color: 'var(--accent-color)' }} />
          <span>外观设置</span>
        </div>
      }
      className="settings-section-card"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 字幕设置区域 */}
        <div>
          <Text
            strong
            style={{
              color: 'var(--text-primary)',
              display: 'block',
              fontSize: '16px',
              marginBottom: '8px'
            }}
          >
            字幕显示设置
          </Text>

          <div style={{ marginBottom: '16px' }}>
            <Text
              style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                display: 'block',
                lineHeight: '1.5'
              }}
            >
              管理字幕的位置、大小和背景设置。如果字幕显示异常或无法看到，可以重置为默认配置。
            </Text>
          </div>

          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                  重置字幕设置
                </Text>
                <Text style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>
                  将字幕位置、大小和背景重置为默认配置
                </Text>
                {hasSubtitleSettings() && (
                  <Text
                    style={{
                      color: 'var(--warning-color)',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      display: 'block',
                      marginTop: '4px'
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
          </div>
        </div>

        <Divider />

        {/* 快捷键说明 */}
        <div>
          <Text
            strong
            style={{
              color: 'var(--text-primary)',
              display: 'block',
              fontSize: '16px',
              marginBottom: '8px'
            }}
          >
            快捷键说明
          </Text>

          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ color: 'var(--text-muted)' }}>重置字幕设置</Text>
                <Text
                  code
                  style={{
                    background: 'var(--code-bg)',
                    color: 'var(--accent-color)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  Ctrl + Shift + R
                </Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ color: 'var(--text-muted)' }}>拖拽字幕位置</Text>
                <Text
                  code
                  style={{
                    background: 'var(--code-bg)',
                    color: 'var(--accent-color)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  鼠标拖拽
                </Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ color: 'var(--text-muted)' }}>调整字幕大小</Text>
                <Text
                  code
                  style={{
                    background: 'var(--code-bg)',
                    color: 'var(--accent-color)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  拖拽右下角
                </Text>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ color: 'var(--text-muted)' }}>切换字幕背景</Text>
                <Text
                  code
                  style={{
                    background: 'var(--code-bg)',
                    color: 'var(--accent-color)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  悬停字幕区域
                </Text>
              </div>
            </Space>
          </div>
        </div>

        {/* 将来可以添加更多外观设置 */}
        <Divider />

        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            更多外观设置功能即将推出...
          </Text>
        </div>
      </Space>
    </Card>
  )
}
