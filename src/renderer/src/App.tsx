import React, { useCallback, useMemo, useState } from 'react'
import { Layout } from 'antd'

// 导入组件
import { AppSidebar } from '@renderer/components/AppSidebar/AppSidebar'
import { TitleBar } from '@renderer/components/TitleBar/TitleBar'
import { HomePage } from '@renderer/pages/HomePage'
import { PlayPage } from '@renderer/pages/PlayPage'
import { FavoritesPage } from '@renderer/pages/FavoritesPage'
import { AboutPage } from '@renderer/pages/AboutPage'
import { SettingsPage } from '@renderer/pages/SettingsPage'
import UpdateNotification from '@renderer/components/UpdateNotification'

import { ShortcutProvider } from '@renderer/contexts/ShortcutContext'
import { PlayingVideoProvider } from '@renderer/contexts/PlayingVideoContext'
import { SubtitleListProvider } from '@renderer/contexts/SubtitleListContext'
import { VideoPlayerProvider } from '@renderer/contexts/VideoPlayerContext'
import { useSubtitleReset } from '@renderer/hooks/useSubtitleReset'
import { ThemeProvider } from '@renderer/contexts/ThemeContext'
import { useAppConfig } from '@renderer/hooks/useAppConfig'

// 导入类型
import { PageType } from '@renderer/types'

// 导入性能监控工具
import { performanceMonitor } from '@renderer/utils/performance'

const { Content } = Layout

/**
 * Renders the main application content with page navigation and context providers.
 *
 * Manages the current page state and conditionally renders the appropriate page component. Provides global subtitle reset functionality and wraps content with video-related context providers. Handles navigation between home, play, favorites, about, and settings pages.
 */
function AppContent(): React.JSX.Element {
  // 启用字幕重置功能和全局快捷键
  useSubtitleReset()
  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<PageType>('home')
  // 应用配置管理
  const { useWindowFrame } = useAppConfig()

  // 导航到播放页面
  const handleNavigateToPlay = useCallback(() => {
    console.log('🎬 导航到播放页面')
    setCurrentPage('play')
  }, [])

  // 返回主页回调函数
  const handleBackToHome = useCallback(() => {
    setCurrentPage('home')
    // 在下一个渲染周期结束性能测量
    requestAnimationFrame(() => {
      performanceMonitor.end('page-transition-to-home')
    })
  }, [])

  // 渲染页面内容
  const renderPageContent = useMemo((): React.JSX.Element => {
    return (
      <>
        {/* 主页 */}
        {currentPage === 'home' && (
          <div>
            <HomePage onNavigateToPlay={handleNavigateToPlay} />
          </div>
        )}

        {/* 播放页面  */}
        {currentPage === 'play' && (
          <SubtitleListProvider>
            <div>
              <PlayPage onBack={handleBackToHome} />
            </div>
          </SubtitleListProvider>
        )}

        {/* 其他页面 - 条件渲染，覆盖在播放页面之上 */}
        {currentPage === 'favorites' && (
          <div>
            <FavoritesPage />
          </div>
        )}
        {currentPage === 'about' && (
          <div>
            <AboutPage />
          </div>
        )}
        {currentPage === 'settings' && (
          <div>
            <SettingsPage />
          </div>
        )}
      </>
    )
  }, [currentPage, handleNavigateToPlay, handleBackToHome])

  // 处理设置页面导航 / Handle settings page navigation
  const handleSettingsClick = useCallback(() => {
    setCurrentPage('settings')
  }, [])

  return (
    <PlayingVideoProvider>
      <VideoPlayerProvider>
        <Layout style={{ minHeight: '100vh' }}>
          {/* 自定义标题栏 - 仅在非系统框架模式下显示 / Custom title bar - only show in non-system frame mode */}
          {!useWindowFrame && (
            <TitleBar
              showWindowControls={true}
              onSettingsClick={handleSettingsClick}
              variant={currentPage === 'play' ? 'compact' : 'default'}
            />
          )}

          {currentPage !== 'play' ? (
            <>
              <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
              <Content
                style={{
                  marginLeft: 80,
                  // 为固定的标题栏预留空间 / Reserve space for fixed title bar
                  marginTop: !useWindowFrame ? 32 : 0,
                  paddingTop: !useWindowFrame ? 1 : 0 // 额外的小间距以避免紧贴 / Extra small spacing to avoid tight fit
                }}
              >
                {renderPageContent}
              </Content>
            </>
          ) : (
            <div
              style={{
                // 播放页面也需要为固定标题栏预留空间 / Play page also needs space for fixed title bar
                marginTop: !useWindowFrame ? 32 : 0,
                paddingTop: !useWindowFrame ? 1 : 0
              }}
            >
              {renderPageContent}
            </div>
          )}
        </Layout>
      </VideoPlayerProvider>
    </PlayingVideoProvider>
  )
}

/**
 * The root component that sets up global providers and renders the main application content.
 *
 * Wraps the application with theme and keyboard shortcut contexts, and displays update notifications.
 *
 * @returns The main application JSX element.
 */
function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ShortcutProvider>
        <AppContent />
        <UpdateNotification />
      </ShortcutProvider>
    </ThemeProvider>
  )
}

export default App
