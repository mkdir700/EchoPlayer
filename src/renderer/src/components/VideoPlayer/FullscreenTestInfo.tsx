import React, { useState } from 'react'
import { Card, Typography, Badge, Button } from 'antd'
import { UpOutlined, DownOutlined } from '@ant-design/icons'
import { useUIStore } from '@renderer/stores'
import { useShortcuts } from '@renderer/hooks/useShortcuts'

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

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // 切换折叠状态 / Toggle collapse state
  const toggleCollapse = (): void => {
    setCollapsed(!collapsed)
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
        minWidth: collapsed ? 200 : 250,
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
          <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
            <Text>按 F 进入全屏，按 ESC 退出</Text>
          </div>
        </div>
      )}
    </Card>
  )
}
