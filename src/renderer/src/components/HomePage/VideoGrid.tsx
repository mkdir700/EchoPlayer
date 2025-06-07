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
  // 根据模式决定列数 / Determine column count based on mode
  const getColProps = (
    isCompactMode: boolean
  ): {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  } => ({
    xs: isCompactMode ? 12 : 24,
    sm: isCompactMode ? 4 : 8,
    md: isCompactMode ? 4 : 8,
    lg: isCompactMode ? 4 : 8,
    xl: isCompactMode ? 4 : 8
  })

  return (
    <Row gutter={[16, 16]}>
      {recentPlays.slice(0, 12).map((item) => (
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
