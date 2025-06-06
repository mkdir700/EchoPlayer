import React, { useCallback } from 'react'
import { Button, Typography, Tooltip } from 'antd'
import { ArrowLeftOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { performanceMonitor } from '@renderer/utils/performance'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useTheme } from '@renderer/hooks/useTheme'
import { useUIStore } from '@renderer/stores'

const { Text } = Typography

interface PlayPageHeaderProps {
  onBack: () => void
}

// 截断文件名的工具函数
function truncateFileName(fileName: string, maxLength: number = 50): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'))
  const maxNameLength = maxLength - extension.length - 4 // 4 for "..." and "."

  if (nameWithoutExt.length <= maxNameLength) return fileName

  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`
}

// 使用React.memo优化组件，避免不必要的重渲染
export const PlayPageHeader = React.memo<PlayPageHeaderProps>(function PlayPageHeader({ onBack }) {
  // 优化的返回按钮点击处理
  const handleBackClick = useCallback(() => {
    performanceMonitor.start('page-transition-to-home')
    onBack()
  }, [onBack])

  const playingVideoContext = usePlayingVideoContext()
  const videoFileName = playingVideoContext.videoFileName
  const { styles } = useTheme()

  // 获取全屏状态，决定是否显示头部
  const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)

  // 动态计算样式，使用height和margin动画实现平滑过渡且不占用空间
  const headerStyle = {
    ...styles.playPageHeader,
    height: showPlayPageHeader ? '56px' : '0px',
    marginBottom: showPlayPageHeader ? '0px' : '0px',
    overflow: 'hidden' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // 使用Material Design缓动函数
    opacity: showPlayPageHeader ? 1 : 0,
    pointerEvents: showPlayPageHeader ? 'auto' : 'none',
    willChange: 'height, opacity' // 优化性能
  } as React.CSSProperties

  // 背景装饰样式，跟随头部显示状态
  const backgroundStyle = {
    ...styles.playPageHeaderBackground,
    opacity: showPlayPageHeader ? 1 : 0,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  return (
    <div style={headerStyle}>
      {/* 背景装饰 */}
      <div style={backgroundStyle} />

      {/* 左侧：返回按钮 */}
      <div style={styles.playPageHeaderLeft}>
        <Tooltip title="返回首页" placement="bottom">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackClick}
            style={styles.playPageBackButton}
            size="large"
          />
        </Tooltip>
      </div>

      {/* 中间：视频信息 */}
      <div style={styles.playPageHeaderCenter}>
        <div style={styles.playPageVideoInfo}>
          <VideoCameraOutlined style={styles.playPageVideoIcon} />
          <div style={styles.playPageVideoDetails}>
            <Tooltip title={videoFileName} placement="bottom">
              <Text style={styles.playPageVideoTitle}>{truncateFileName(videoFileName)}</Text>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 右侧：预留空间 */}
      <div style={styles.playPageHeaderRight}>{/* 可以添加其他功能按钮，如设置、全屏等 */}</div>
    </div>
  )
})
