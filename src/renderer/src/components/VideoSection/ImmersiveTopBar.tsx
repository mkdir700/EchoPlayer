import React, { useCallback } from 'react'
import { Button, Typography, Tooltip } from 'antd'
import { ArrowLeftOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { useFullscreenMode } from '@renderer/hooks/features/ui/useFullscreenMode'
import { useUIStore } from '@renderer/stores'
import { performanceMonitor } from '@renderer/utils/performance'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

const { Text } = Typography

// 截断文件名的工具函数 / Utility function to truncate file name
function truncateFileName(fileName: string, maxLength: number = 40): string {
  if (fileName.length <= maxLength) return fileName

  const extension = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'))
  const maxNameLength = maxLength - extension.length - 4 // 4 for "..." and "."

  if (nameWithoutExt.length <= maxNameLength) return fileName

  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`
}

// 沉浸式顶部 Bar 组件 / Immersive Top Bar Component
interface ImmersiveTopBarProps {
  onBack?: () => void
}

export function ImmersiveTopBar({ onBack }: ImmersiveTopBarProps): React.JSX.Element {
  const playingVideoContext = usePlayingVideoContext()
  const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)
  const { isFullscreen } = useFullscreenMode()
  const { token } = useTheme()

  // 返回主页处理 / Handle back to home
  const handleBackClick = useCallback(() => {
    if (onBack) {
      performanceMonitor.start('page-transition-to-home')
      onBack()
    }
  }, [onBack])

  // 如果是全屏模式或者头部被隐藏，则不显示 / Don't show in fullscreen mode or when header is hidden
  if (isFullscreen || !showPlayPageHeader) {
    return <></>
  }

  // 沉浸式顶部栏样式 / Immersive top bar styles
  const barStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48px', // 减小高度，更加沉浸式 / Reduced height for better immersion
    background:
      'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)',
    backdropFilter: 'blur(12px) saturate(150%)',
    WebkitBackdropFilter: 'blur(12px) saturate(150%)',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${token.paddingMD}px`,
    zIndex: token.zIndexPopupBase,
    transition: `all ${token.motionDurationSlow} ${token.motionEaseInOut}`,
    pointerEvents: 'auto'
  }

  // 只显示图标的返回按钮样式 / Icon-only back button styles
  const backButtonStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: token.borderRadius,
    width: '32px',
    height: '32px',
    minWidth: '32px', // 确保按钮是正方形 / Ensure button is square
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
    fontSize: token.fontSizeSM,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  }

  // 视频信息区域样式 / Video info area styles
  const videoInfoStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.marginXS,
    color: 'rgba(255, 255, 255, 0.9)',
    minWidth: 0 // 允许内容压缩 / Allow content to shrink
  }

  // 视频图标样式 / Video icon styles
  const videoIconStyle: React.CSSProperties = {
    fontSize: token.fontSize,
    color: 'rgba(255, 255, 255, 0.6)',
    flexShrink: 0
  }

  // 更小的标题文字样式 / Smaller title text styles
  const videoTitleStyle: React.CSSProperties = {
    fontSize: token.fontSizeSM, // 使用更小的字体 / Use smaller font size
    fontWeight: 400, // 使用常规字重 / Use regular font weight
    color: 'rgba(255, 255, 255, 0.8)', // 稍微降低透明度 / Slightly reduce opacity
    textAlign: 'center',
    maxWidth: '300px', // 减小最大宽度 / Reduce max width
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2
  }

  return (
    <div style={barStyle}>
      {/* 左侧图标按钮 / Left icon button */}
      <Tooltip title="返回首页" placement="bottom">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBackClick}
          style={backButtonStyle}
        />
      </Tooltip>

      {/* 中间视频信息 / Center video info */}
      <div style={videoInfoStyle}>
        <VideoCameraOutlined style={videoIconStyle} />
        <Tooltip title={playingVideoContext.videoFileName} placement="bottom">
          <Text style={videoTitleStyle}>
            {truncateFileName(playingVideoContext.videoFileName, 30)}
          </Text>
        </Tooltip>
      </div>

      {/* 右侧空白区域，保持布局平衡 / Right empty area for layout balance */}
      <div style={{ width: '32px', flexShrink: 0 }}></div>
    </div>
  )
}
