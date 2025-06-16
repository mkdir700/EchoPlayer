import React, { useState } from 'react'
import { Card, Typography, Badge, Button } from 'antd'
import { UpOutlined, DownOutlined, FullscreenOutlined } from '@ant-design/icons'
import { useUIStore } from '@renderer/stores'
import { useShortcuts } from '@renderer/hooks/features/shortcuts/useShortcuts'

const { Text } = Typography

/**
 * Debug component to show fullscreen state information
 * Only visible in development mode
 */
export function FullscreenTestInfo(): React.JSX.Element | null {
  const fullscreen = useUIStore((state) => state.fullscreen)
  const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)
  const showSubtitleList = useUIStore((state) => state.showSubtitleList)
  const { getCurrentShortcut } = useShortcuts()

  // 折叠状态管理 / Collapse state management
  const [collapsed, setCollapsed] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // 切换折叠状态 / Toggle collapse state
  const toggleCollapse = (): void => {
    setCollapsed(!collapsed)
  }

  // 测试全屏 API / Test fullscreen API
  const testFullscreenAPI = async (): Promise<void> => {
    try {
      setTestResult('测试中...')
      console.log('🧪 开始测试全屏 API')

      // 获取平台信息
      const platform = await window.api.window.getPlatform()
      console.log('🖥️ 平台:', platform)
      setTestResult(`平台: ${platform}`)

      // 获取当前全屏状态
      const isFullScreen = await window.api.window.isFullScreen()
      console.log('📺 当前全屏状态:', isFullScreen)
      setTestResult((prev) => `${prev}\n当前全屏: ${isFullScreen}`)

      // 尝试切换全屏
      const newState = await window.api.window.toggleFullScreen()
      console.log('🔄 切换后状态:', newState)
      setTestResult((prev) => `${prev}\n切换后: ${newState}`)
    } catch (error) {
      console.error('❌ 全屏 API 测试失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setTestResult(`错误: ${errorMessage}`)
    }
  }

  // 标题组件，包含折叠按钮 / Title component with collapse button
  const cardTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>🖥️ Fullscreen Debug</span>
      <Button
        type="text"
        size="small"
        icon={collapsed ? <DownOutlined /> : <UpOutlined />}
        onClick={toggleCollapse}
        style={{ padding: '0 4px' }}
      />
    </div>
  )

  return (
    <Card
      size="small"
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 1000,
        opacity: 0.8,
        minWidth: collapsed ? 200 : 300,
        transition: 'all 0.3s ease'
      }}
      title={cardTitle}
      bodyStyle={{
        padding: collapsed ? 0 : 12,
        display: collapsed ? 'none' : 'block'
      }}
    >
      {!collapsed && (
        <div style={{ fontSize: 12 }}>
          <div>
            <Text strong>Fullscreen: </Text>
            <Badge
              status={fullscreen.isFullscreen ? 'success' : 'default'}
              text={fullscreen.isFullscreen ? 'ON' : 'OFF'}
            />
          </div>
          <div>
            <Text strong>In Mode: </Text>
            <Badge
              status={fullscreen.isInFullscreenMode ? 'processing' : 'default'}
              text={fullscreen.isInFullscreenMode ? 'YES' : 'NO'}
            />
          </div>
          <div>
            <Text strong>Header: </Text>
            <Badge
              status={showPlayPageHeader ? 'success' : 'error'}
              text={showPlayPageHeader ? 'VISIBLE' : 'HIDDEN'}
            />
          </div>
          <div>
            <Text strong>Sidebar: </Text>
            <Badge
              status={showSubtitleList ? 'success' : 'error'}
              text={showSubtitleList ? 'VISIBLE' : 'HIDDEN'}
            />
          </div>
          <div style={{ marginTop: 8, borderTop: '1px solid #d9d9d9', paddingTop: 8 }}>
            <Text strong>快捷键状态:</Text>
          </div>
          <div>
            <Text>F键全屏: </Text>
            <Badge status="default" text={getCurrentShortcut('toggleFullscreen') || 'F'} />
          </div>
          <div>
            <Text>ESC退出: </Text>
            <Badge
              status={fullscreen.isInFullscreenMode ? 'processing' : 'default'}
              text={fullscreen.isInFullscreenMode ? '已激活' : '未激活'}
            />
            <Text style={{ marginLeft: 4, fontSize: 10 }}>
              ({getCurrentShortcut('escapeFullscreen') || 'Escape'})
            </Text>
          </div>

          {/* 添加 API 测试按钮 */}
          <div style={{ marginTop: 8, borderTop: '1px solid #d9d9d9', paddingTop: 8 }}>
            <Text strong>API 测试:</Text>
            <div style={{ marginTop: 4 }}>
              <Button
                size="small"
                icon={<FullscreenOutlined />}
                onClick={testFullscreenAPI}
                type="primary"
              >
                测试全屏 API
              </Button>
            </div>
            {testResult && (
              <div style={{ marginTop: 4, fontSize: 10, whiteSpace: 'pre-line', color: '#666' }}>
                <Text>{testResult}</Text>
              </div>
            )}
          </div>

          <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
            <Text>按 F 进入全屏，按 ESC 退出</Text>
          </div>
        </div>
      )}
    </Card>
  )
}
