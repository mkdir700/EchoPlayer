import React, { useCallback, useMemo, useState } from 'react'
import { Layout } from 'antd'

// 导入组件
import { AppHeader } from '@renderer/components/AppHeader/AppHeader'
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

// 导入类型
import { PageType } from '@renderer/types'

// 导入性能监控工具
import { performanceMonitor } from '@renderer/utils/performance'

const { Content } = Layout

// 内部组件，用于在Provider内部启用全局功能
function AppContent(): React.JSX.Element {
  // 启用字幕重置功能和全局快捷键
  useSubtitleReset()
  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<PageType>('home')

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

  return (
    <PlayingVideoProvider>
      <VideoPlayerProvider>
        <Layout>
          {currentPage !== 'play' ? (
            <>
              <AppHeader currentPage={currentPage} onPageChange={setCurrentPage} />
              <Content>{renderPageContent}</Content>
            </>
          ) : (
            <div>{renderPageContent}</div>
          )}
        </Layout>
      </VideoPlayerProvider>
    </PlayingVideoProvider>
  )
}

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
