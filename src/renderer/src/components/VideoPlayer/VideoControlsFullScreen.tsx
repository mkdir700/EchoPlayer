import React, { memo } from 'react'
import { FullScreenVideoProgressBar } from './FullScreenVideoProgressBar'
import {
  FullScreenLeftControls,
  FullScreenCenterControls,
  FullScreenRightControls,
  FullScreenCenterPlayButton
} from './controls'
// 导入必要的 hooks
import { useVideoPlayState, useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'
import { useReactPlayerController } from '@renderer/hooks/useReactPlayerController'
import { useFullscreenMode } from '@renderer/hooks/useFullscreenMode'
import { useTheme } from '@renderer/hooks/useTheme'
import type { VideoControlsProps } from '@renderer/types'

// 扩展接口以包含 showControls 属性（全屏模式特有）
interface VideoControlsFullScreenProps extends VideoControlsProps {
  showControls: boolean
}

function VideoControlsFullScreen({
  showControls,
  isVideoLoaded,
  videoError,
  onFullscreenToggle
}: VideoControlsFullScreenProps): React.JSX.Element {
  // 使用 hooks 获取状态和控制方法，避免通过 props 传递
  const isPlaying = useVideoPlayState()
  const { toggle, stepBackward, stepForward } = useVideoControls()
  const subtitleControl = useSubtitleControl()
  const { volumeRef } = useVideoPlaybackSettingsContext()
  const playerController = useReactPlayerController()
  const { isFullscreen } = useFullscreenMode()
  const { styles } = useTheme()

  // 获取当前值
  const volume = volumeRef.current

  const controlsBarStyle = {
    ...styles.fullscreenControlsBar,
    ...(showControls ? styles.fullscreenControlsBarVisible : {})
  }

  return (
    <>
      {/* 顶部进度条 - 独立组件 */}
      <FullScreenVideoProgressBar />

      {/* 中央播放按钮 - 仅在暂停时显示 */}
      <FullScreenCenterPlayButton
        isPlaying={isPlaying}
        showControls={showControls}
        isVideoLoaded={isVideoLoaded}
        videoError={videoError}
        onPlayPause={toggle}
      />

      {/* 主控制栏 - 悬停时显示 */}
      <div style={controlsBarStyle}>
        {/* 左侧控制区 - 功能按钮（现在内部管理状态） */}
        <FullScreenLeftControls isVideoLoaded={isVideoLoaded} />

        {/* 中间控制区 - 播放控制（现在内部管理状态） */}
        <FullScreenCenterControls
          isVideoLoaded={isVideoLoaded}
          isPlaying={isPlaying}
          videoError={videoError}
          onStepBackward={stepBackward}
          onPlayPause={toggle}
          onStepForward={stepForward}
          onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
          onNextSubtitle={subtitleControl.goToNextSubtitle}
        />

        {/* 右侧控制区 - 系统控制（现在内部管理状态） */}
        <FullScreenRightControls
          volume={volume}
          isFullscreen={isFullscreen}
          showControls={showControls}
          onVolumeChange={playerController.adjustVolume}
          onFullscreenToggle={onFullscreenToggle}
        />
      </div>
    </>
  )
}

// 自定义比较函数，只在必要时重新渲染
const arePropsEqual = (
  prevProps: VideoControlsFullScreenProps,
  nextProps: VideoControlsFullScreenProps
): boolean => {
  // 比较控制状态
  if (prevProps.showControls !== nextProps.showControls) return false
  if (prevProps.isVideoLoaded !== nextProps.isVideoLoaded) return false
  if (prevProps.videoError !== nextProps.videoError) return false

  // onFullscreenToggle 回调函数保持稳定，无需比较
  return true
}

// 导出 memo 包装的组件
const MemoizedVideoControlsFullScreen = memo(VideoControlsFullScreen, arePropsEqual)

export { MemoizedVideoControlsFullScreen as VideoControlsFullScreen }
