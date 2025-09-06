import { loggerService } from '@logger'
import { AntdProvider, NotificationProvider, ThemeProvider } from '@renderer/contexts'
import { configSyncService } from '@renderer/services'
import React, { useEffect, useState } from 'react'

import { SearchOverlay } from './components/SearchOverlay'
import SplashScreen from './components/SplashScreen'
import TopViewContainer from './components/TopView'
import Router from './Router'

const logger = loggerService.withContext('App.tsx')

function App(): React.JSX.Element {
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashExiting, setSplashExiting] = useState(false)

  logger.info('App initialized')

  useEffect(() => {
    // 模拟应用初始化过程
    const initializeApp = async () => {
      try {
        logger.info('开始应用初始化')

        // 最小显示时间确保用户能看到启动页面
        const minDisplayTime = new Promise((resolve) => setTimeout(resolve, 1500))

        // 这里可以添加真实的初始化逻辑，比如：
        // - 加载用户设置
        // - 初始化数据库
        // - 检查更新等

        // 同步配置从 main 进程到 renderer store
        const configSyncPromise = configSyncService.syncAllConfigs()

        await Promise.all([
          minDisplayTime,
          configSyncPromise
          // 其他初始化任务...
        ])

        logger.info('应用初始化完成，准备隐藏启动页面')

        // 开始退出动画
        setSplashExiting(true)
      } catch (error) {
        logger.error('应用初始化失败:', { error })
        // 即使初始化失败也要隐藏启动页面
        setSplashExiting(true)
      }
    }

    initializeApp()
  }, [])

  // 启动页面退出动画完成后完全隐藏
  const handleSplashAnimationEnd = () => {
    logger.debug('启动页面动画完成，完全隐藏')
    setSplashVisible(false)
    setSplashExiting(false)
  }

  return (
    <ThemeProvider>
      <AntdProvider>
        <NotificationProvider>
          <TopViewContainer>
            <Router />
            <SearchOverlay />
            <SplashScreen
              isVisible={splashVisible}
              isExiting={splashExiting}
              onAnimationEnd={handleSplashAnimationEnd}
            />
          </TopViewContainer>
        </NotificationProvider>
      </AntdProvider>
    </ThemeProvider>
  )
}

export default App
