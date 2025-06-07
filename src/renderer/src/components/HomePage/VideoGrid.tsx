import React from 'react'
import { Row } from 'antd'
import { VideoCard } from './VideoCard'
import type { RecentPlayItem } from '@renderer/types'

interface VideoGridProps {
  recentPlays: RecentPlayItem[]
  isCompactMode: boolean
  onOpenVideo: (item: RecentPlayItem) => void
  onDeleteVideo: (id: string, fileName: string) => void
}

/**
 * VideoGrid component for displaying a grid of video cards
 * 用于显示视频卡片网格的组件
 */
export function VideoGrid({
  recentPlays,
  isCompactMode,
  onOpenVideo,
  onDeleteVideo
}: VideoGridProps): React.JSX.Element {
  // 根据模式决定列数，优化宽屏显示 / Determine column count based on mode, optimized for wide screens
  const getColProps = (
    isCompactMode: boolean
  ): {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  } => ({
    xs: isCompactMode ? 12 : 24, // 手机：紧凑模式2列，普通模式1列
    sm: isCompactMode ? 8 : 12, // 小平板：紧凑模式3列，普通模式2列
    md: isCompactMode ? 6 : 8, // 平板：紧凑模式4列，普通模式3列
    lg: isCompactMode ? 4 : 6, // 小桌面：紧凑模式6列，普通模式4列
    xl: isCompactMode ? 3 : 4, // 大桌面：紧凑模式8列，普通模式6列
    xxl: isCompactMode ? 2.4 : 3.2 // 超大桌面：紧凑模式10列，普通模式7.5列，更好利用宽屏空间
  })

  // 响应式间距设置 / Responsive gutter settings
  const getResponsiveGutter = (): [number, number] => {
    // 根据模式和屏幕尺寸动态调整间距
    const horizontal = isCompactMode ? 10 : 14
    const vertical = isCompactMode ? 10 : 14
    return [horizontal, vertical]
  }

  return (
    <Row gutter={getResponsiveGutter()}>
      {recentPlays.slice(0, 24).map((item) => (
        <VideoCard
          key={item.fileId}
          item={item}
          isCompactMode={isCompactMode}
          onOpen={onOpenVideo}
          onDelete={onDeleteVideo}
          colProps={getColProps(isCompactMode)}
        />
      ))}
    </Row>
  )
}
