import { loggerService } from '@logger'
import { AntdProvider, NotificationProvider, ThemeProvider } from '@renderer/contexts'
import { useSettings } from '@renderer/infrastructure/hooks/useSettings'
import { configSyncService } from '@renderer/services'
import { appLifecycleService } from '@renderer/services/AppLifecycleService'
import HomePageVideoService from '@renderer/services/HomePageVideos'
import { useVideoListStore } from '@renderer/state/stores/video-list.store'
import React, { useCallback, useEffect, useState } from 'react'

import { SearchOverlay } from './components/SearchOverlay'
import { StartupLoadingState } from './components/StartupIntro'
import TopViewContainer from './components/TopView'
import Router from './Router'

const logger = loggerService.withContext('App.tsx')

// 内部组件，可以访问设置
const AppContent: React.FC = () => {
  const { showStartupIntro } = useSettings()
  const { setLoading, setCachedVideos, setInitialized } = useVideoListStore()

  // 简化状态管理 - 只保留必要的状态
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadCompleted, setPreloadCompleted] = useState(false)
  const [introCompleted, setIntroCompleted] = useState(false)

  // 计算是否应该显示主应用
  const shouldShowMainApp =
    !showStartupIntro || (introCompleted && preloadCompleted && !isPreloading)

  // 预加载 HomePage 数据
  const preloadHomePageData = useCallback(async () => {
    if (isPreloading || preloadCompleted) return // 防止重复预加载

    try {
      setIsPreloading(true)
      logger.info('开始预加载 HomePage 数据')

      setLoading(true)

      // 预加载数据并缓存到 store
      const svc = new HomePageVideoService()
      const videos = await svc.getHomePageVideos(50)

      // 缓存到 store 供 HomePage 使用
      setCachedVideos(videos)
      setInitialized(true)

      logger.info('HomePage 数据预加载完成，已缓存到 store', { videoCount: videos.length })
      setPreloadCompleted(true)
    } catch (error) {
      logger.error('预加载 HomePage 数据失败:', { error })
    } finally {
      setLoading(false)
      setIsPreloading(false)
    }
  }, [isPreloading, preloadCompleted, setCachedVideos, setInitialized, setLoading])

  // StartupIntro 完成回调 - 使用 useCallback 稳定引用
  const handleIntroComplete = useCallback(() => {
    logger.info('🎬 启动界面完成回调触发', { preloadCompleted, isPreloading })

    setIntroCompleted(true) // 标记启动介绍已完成

    // 移除手动设置showMainApp，让计算属性自动处理
    logger.info('🔄 启动介绍已完成，等待状态重新计算')
  }, [preloadCompleted, isPreloading])

  // 应用初始化逻辑 - 只执行一次
  useEffect(() => {
    logger.info('🔄 初始化逻辑检查', { isInitialized, showStartupIntro })

    if (isInitialized) {
      logger.info('⏩ 已初始化，跳过重复初始化')
      return // 避免重复初始化
    }

    logger.info('🚀 开始应用初始化', { showStartupIntro })
    preloadHomePageData().then(() => {
      logger.info('✅ 主应用条件满足（跳过启动界面）')
    })
    setIsInitialized(true)

    // 确保所有分支都有返回值
    return undefined
  }, [showStartupIntro, isInitialized, preloadHomePageData])

  // 渲染前的条件检查
  const shouldRenderIntro = showStartupIntro && !shouldShowMainApp
  const shouldRenderMainApp = shouldShowMainApp

  return (
    <TopViewContainer>
      {/* 基于计算属性显示主应用 */}
      {shouldRenderMainApp && (
        <>
          <Router />
          <SearchOverlay />
        </>
      )}

      {/* 显示启动页面 - 只在启用且主应用未显示时显示 */}
      {shouldRenderIntro && <StartupLoadingState visible={true} onComplete={handleIntroComplete} />}
    </TopViewContainer>
  )
}

function App(): React.JSX.Element {
  logger.info('App initialized')

  useEffect(() => {
    // 应用初始化过程
    const initializeApp = async () => {
      try {
        logger.info('开始应用初始化')

        // 同步配置从 main 进程到 renderer store
        await configSyncService.syncAllConfigs()

        logger.info('应用初始化完成')
      } catch (error) {
        logger.error('应用初始化失败:', { error })
      }
    }

    initializeApp()

    logger.debug('应用生命周期服务已初始化')

    // 组件卸载时清理服务
    return () => {
      try {
        appLifecycleService.dispose()
        logger.debug('应用生命周期服务已清理')
      } catch (error) {
        logger.error('清理应用生命周期服务时出错:', { error })
      }
    }
  }, [])

  return (
    <ThemeProvider>
      <AntdProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AntdProvider>
    </ThemeProvider>
  )
}

export default App
