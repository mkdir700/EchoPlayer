import React, { useCallback, useMemo, useState } from 'react'
import { Layout } from 'antd'

// 导入组件
import { AppHeader } from '@renderer/components/AppHeader/AppHeader'
import { HomePage } from '@renderer/pages/HomePage'
import { PlayPage } from '@renderer/pages/PlayPage'
import { FavoritesPage } from '@renderer/pages/FavoritesPage'
import { AboutPage } from '@renderer/pages/AboutPage'
import { SettingsPage } from '@renderer/pages/SettingsPage'

import { ShortcutProvider } from '@renderer/contexts/ShortcutContext'
import { PlaybackSettingsProvider } from '@renderer/contexts/PlaybackSettingsContext'
import { PlayingVideoProvider } from '@renderer/contexts/PlayingVideoContext'
import { SubtitleListProvider } from '@renderer/contexts/SubtitleListContext'
import { VideoPlayerProvider } from '@renderer/contexts/VideoPlayerContext'

// 导入类型
import { PageType } from '@renderer/types'

// 导入样式
import styles from './App.module.css'

// 导入性能监控工具
import { performanceMonitor } from '@renderer/utils/performance'

const { Content } = Layout

function App(): React.JSX.Element {
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
          <div className={styles.pageContainer}>
            <HomePage onNavigateToPlay={handleNavigateToPlay} />
          </div>
        )}

        {/* 播放页面  */}
        {currentPage === 'play' && (
          <VideoPlayerProvider>
            <SubtitleListProvider>
              <div className={styles.pageContainer}>
                <PlayPage onBack={handleBackToHome} />
              </div>
            </SubtitleListProvider>
          </VideoPlayerProvider>
        )}

        {/* 其他页面 - 条件渲染，覆盖在播放页面之上 */}
        {currentPage === 'favorites' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <FavoritesPage />
          </div>
        )}
        {currentPage === 'about' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <AboutPage />
          </div>
        )}
        {currentPage === 'settings' && (
          <div className={`${styles.pageContainer} ${styles.otherPage}`}>
            <SettingsPage />
          </div>
        )}
      </>
    )
  }, [currentPage, handleNavigateToPlay, handleBackToHome])

  return (
    <PlaybackSettingsProvider>
      <ShortcutProvider>
        <PlayingVideoProvider>
          <Layout className={styles.appLayout}>
            {currentPage !== 'play' ? (
              <>
                <AppHeader currentPage={currentPage} onPageChange={setCurrentPage} />
                <Content className={styles.appContent}>{renderPageContent}</Content>
              </>
            ) : (
              <div className={styles.playPageFullscreen}>{renderPageContent}</div>
            )}
          </Layout>
        </PlayingVideoProvider>
      </ShortcutProvider>
    </PlaybackSettingsProvider>
  )
}

export default App
