import React, { useCallback, useMemo } from 'react'
import { VideoSection } from '@renderer/components/VideoSection/VideoSection'
import { SidebarSectionContainer } from '@renderer/components/SidebarSection/SidebarSectionContainer'
import { PlayPageHeader } from '@renderer/components/PlayPageHeader'

// 导入所需的 hooks
import { useShortcutCommand, useCommandShortcuts } from '@renderer/hooks/useCommandShortcuts'
import { usePlayStateSaver } from '@renderer/hooks/usePlayStateSaver'
import { usePlayStateInitializer } from '@renderer/hooks/usePlayStateInitializer'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useTheme } from '@renderer/hooks/useTheme'
import { CurrentSubtitleDisplayProvider } from '@renderer/contexts/CurrentSubtitleDisplayContext'
import { useUIStore, useFullscreenMode } from '@renderer/stores'
import { FullscreenTestInfo } from '@renderer/components/VideoPlayer/FullscreenTestInfo'

interface PlayPageProps {
  onBack: () => void
}

// 🚀 性能优化：自定义比较函数，只在 onBack 真正改变时才重新渲染
const PlayPageMemo = React.memo<PlayPageProps>(
  function PlayPage({ onBack }) {
    // 🎨 获取主题样式
    const { styles, token } = useTheme()

    // 🖥️ 获取UI状态，用于全屏模式布局调整
    const showSubtitleList = useUIStore((state) => state.showSubtitleList)
    const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)

    // 🖥️ 获取全屏模式控制
    const { toggleFullscreen } = useFullscreenMode()

    // 📊 移除频繁的渲染日志，避免性能影响
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 PlayPage 渲染 - ', new Date().toLocaleTimeString())
    }

    // 📹 视频播放相关 hooks - 稳定的引用
    const { toggle, stepBackward, stepForward } = useVideoControls()

    // 💾 播放状态保存 - 🚀 已优化，不会导致重新渲染
    const { savePlayStateRef } = usePlayStateSaver()

    // 🔄 播放状态初始化
    usePlayStateInitializer({
      savePlayStateRef
    })

    // 🚀 初始化命令式快捷键系统 - 只执行一次
    useCommandShortcuts()

    // ⌨️ 快捷键命令注册 - 使用稳定的引用
    const shortcutCommands = useMemo(
      () => ({
        playPause: toggle,
        stepBackward: stepBackward,
        stepForward: stepForward,
        toggleFullscreen: toggleFullscreen
      }),
      [toggle, stepBackward, stepForward, toggleFullscreen]
    )

    // 注册快捷键 - 使用稳定的引用避免重新绑定
    useShortcutCommand('playPause', shortcutCommands.playPause)
    useShortcutCommand('stepBackward', shortcutCommands.stepBackward)
    useShortcutCommand('stepForward', shortcutCommands.stepForward)
    useShortcutCommand('toggleFullscreen', shortcutCommands.toggleFullscreen)

    // 🔙 返回处理 - 优化性能，确保保存状态
    const handleBack = useCallback(async () => {
      console.log('🔙 处理返回操作')
      // 退出前保存一次进度
      if (savePlayStateRef.current) {
        try {
          await savePlayStateRef.current(true)
          console.log('✅ 退出前保存进度成功')
        } catch (error) {
          console.error('❌ 退出前保存进度失败:', error)
        }
      }
      onBack()
    }, [onBack, savePlayStateRef])

    // 🚀 记忆化容器样式，避免全屏切换时重复计算
    const containerStyle = useMemo(
      () => ({
        ...styles.playPageContainer,
        // 全屏时使用黑色背景，避免白色区域
        backgroundColor: showPlayPageHeader ? styles.playPageContainer?.backgroundColor : '#000000'
      }),
      [styles.playPageContainer, showPlayPageHeader]
    )

    // 🚀 记忆化内容区域样式
    const contentAreaStyle = useMemo(
      () => ({
        ...styles.playPageContent,
        // 全屏时确保内容区域也是黑色背景
        backgroundColor: showPlayPageHeader ? styles.playPageContent?.backgroundColor : '#000000'
      }),
      [styles.playPageContent, showPlayPageHeader]
    )

    // 🚀 记忆化视频区域容器样式
    const videoContainerStyle = useMemo(
      () => ({
        flex: showSubtitleList ? '1 1 70%' : '1 1 100%',
        minWidth: showSubtitleList ? '50%' : '100%',
        maxWidth: showSubtitleList ? '80%' : '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'flex, min-width, max-width'
      }),
      [showSubtitleList]
    )

    // 🚀 记忆化分割线样式
    const dividerStyle = useMemo(
      () => ({
        width: '1px',
        backgroundColor: token.colorBorderSecondary,
        cursor: 'col-resize',
        opacity: showSubtitleList ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }),
      [token.colorBorderSecondary, showSubtitleList]
    )

    // 🚀 记忆化侧边栏样式
    const sidebarStyle = useMemo(
      () => ({
        flex: showSubtitleList ? '1 1 30%' : '0 0 0%',
        minWidth: showSubtitleList ? '20%' : '0%',
        maxWidth: showSubtitleList ? '50%' : '0%',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'flex, min-width, max-width'
      }),
      [showSubtitleList]
    )

    return (
      <CurrentSubtitleDisplayProvider>
        <div style={containerStyle}>
          {/* 仅在开发模式下显示全屏测试信息 / Only show fullscreen test info in development mode */}
          {process.env.NODE_ENV === 'development' && <FullscreenTestInfo />}

          {/* 播放页面独立Header - 始终渲染，由组件内部控制显示/隐藏动画 */}
          <PlayPageHeader onBack={handleBack} />

          <div style={contentAreaStyle}>
            {/* 🎬 视频播放区域 - 始终保持在固定位置，避免重新挂载 */}
            <div
              style={{
                display: 'flex',
                height: '100%',
                width: '100%'
              }}
            >
              {/* 视频区域容器 - 根据全屏状态调整宽度 */}
              <div style={videoContainerStyle}>
                <VideoSection key="main-video-section" />
              </div>

              {/* 侧边栏区域 - 使用动画控制显示/隐藏 */}
              <>
                {/* 分割线 */}
                <div style={dividerStyle} />
                {/* 字幕列表区域 */}
                <div style={sidebarStyle}>
                  <div style={styles.sidebarSection}>
                    <div style={styles.sidebarDivider} />
                    <SidebarSectionContainer />
                  </div>
                </div>
              </>
            </div>
          </div>
        </div>
      </CurrentSubtitleDisplayProvider>
    )
  },
  (prevProps, nextProps) => {
    // 🎯 精确比较：只有当 onBack 函数真正改变时才重新渲染
    return prevProps.onBack === nextProps.onBack
  }
)

// 设置组件显示名称，便于调试
PlayPageMemo.displayName = 'PlayPage'

export const PlayPage = PlayPageMemo
