import React, { useMemo } from 'react'
import { VideoSection } from '@renderer/components/VideoSection/VideoSection'
import { SidebarSectionContainer } from '@renderer/components/SidebarSection/SidebarSectionContainer'

// 导入所需的 hooks
import { useShortcutCommand, useCommandShortcuts } from '@renderer/hooks/useCommandShortcuts'
import { usePlayStateSaver } from '@renderer/hooks/usePlayStateSaver'
import { usePlayStateInitializer } from '@renderer/hooks/usePlayStateInitializer'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useTheme } from '@renderer/hooks/useTheme'
// 导入测试相关 hooks 和常量 / Import test-related hooks and constants
import { useTestIds } from '@renderer/hooks/useTestIds'
import { PLAY_PAGE_ELEMENTS } from '@renderer/utils/test-utils'
import { CurrentSubtitleDisplayProvider } from '@renderer/contexts/CurrentSubtitleDisplayContext'
import { useUIStore, useFullscreenMode } from '@renderer/stores'
import { FullscreenTestInfo } from '@renderer/components/VideoPlayer/FullscreenTestInfo'

// 🚀 性能优化：使用 React.memo 避免不必要的重新渲染
interface PlayPageProps {
  onBack?: () => void
}

const PlayPageMemo = React.memo(function PlayPage({ onBack }: PlayPageProps) {
  // 🎨 获取主题样式
  const { styles, token } = useTheme()

  // 🧪 使用统一的测试常量并生成测试标识符 / Use unified test constants and generate test identifiers
  const testIds = useTestIds('play-page', PLAY_PAGE_ELEMENTS)

  // 🖥️ 获取UI状态，用于全屏模式布局调整
  const showSubtitleList = useUIStore((state) => state.showSubtitleList)
  const showPlayPageHeader = useUIStore((state) => state.showPlayPageHeader)

  // 🔧 计算 TitleBar 高度（compact 模式在不同平台下的高度）
  const [titleBarHeight, setTitleBarHeight] = React.useState(40) // 默认 40px

  React.useEffect(() => {
    const getTitleBarHeight = async (): Promise<void> => {
      try {
        const platform = await window.api.window.getPlatform()
        // TitleBar 在 compact 模式下：macOS 32px，其他平台 40px
        setTitleBarHeight(platform === 'darwin' ? 32 : 40)
      } catch (error) {
        console.warn('获取平台信息失败，使用默认高度:', error)
      }
    }
    getTitleBarHeight()
  }, [])

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

  // 注意：返回处理逻辑已迁移到 App.tsx 的 TitleBar 中
  // handleBack 逻辑现在由 TitleBar 通过 onBack 回调处理

  // 🚀 记忆化容器样式，避免全屏切换时重复计算
  const containerStyle = useMemo(
    () => ({
      ...styles.playPageContainer,
      // 全屏时使用黑色背景，避免白色区域
      backgroundColor: showPlayPageHeader ? styles.playPageContainer?.backgroundColor : '#000000',
      // 🔧 修复高度计算：全屏时占满整个视口，非全屏时减去 TitleBar 高度
      height: `calc(100vh - ${titleBarHeight}px)`
    }),
    [styles.playPageContainer, showPlayPageHeader, titleBarHeight]
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
      <div style={containerStyle} {...testIds.withTestId('container')}>
        {/* 仅在开发模式下显示全屏测试信息 / Only show fullscreen test info in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div {...testIds.withTestId('fullscreenTestInfo')}>
            <FullscreenTestInfo />
          </div>
        )}

        <div style={contentAreaStyle} {...testIds.withTestId('contentArea')}>
          {/* 🎬 视频播放区域 - 始终保持在固定位置，避免重新挂载 */}
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%'
            }}
          >
            {/* 视频区域容器 - 根据全屏状态调整宽度 */}
            <div style={videoContainerStyle} {...testIds.withTestId('videoContainer')}>
              <VideoSection key="main-video-section" onBack={onBack} />
            </div>

            {/* 侧边栏区域 - 使用动画控制显示/隐藏 */}
            <>
              {/* 分割线 */}
              <div style={dividerStyle} {...testIds.withTestId('divider')} />
              {/* 字幕列表区域 */}
              <div style={sidebarStyle} {...testIds.withTestId('sidebarContainer')}>
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
})

// 设置组件显示名称，便于调试
PlayPageMemo.displayName = 'PlayPage'

export const PlayPage = PlayPageMemo
export type { PlayPageProps }
