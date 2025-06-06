import React from 'react'
import { Card, Typography, Badge } from 'antd'
import { useUIStore } from '@renderer/stores'

const { Text } = Typography

/**
 * Debug component to show fullscreen state information
 * Only visible in development mode
 */
export function FullscreenTestInfo(): React.JSX.Element | null {
  const fullscreen = useUIStore((state) => state.fullscreen)
  const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)
  const showSubtitleList = useUIStore((state) => state.showSubtitleList)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card
      size="small"
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 1000,
        opacity: 0.8,
        minWidth: 200
      }}
      title="🖥️ Fullscreen Debug"
    >
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
        <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
          <Text>Press F key to toggle</Text>
        </div>
      </div>
    </Card>
  )
}
