import { loggerService } from '@logger'
import { useSettings } from '@renderer/infrastructure/hooks/useSettings'
import appleTheme, { appleDarkTheme } from '@renderer/infrastructure/styles/theme'
import { LanguageVarious, ThemeMode } from '@types'
import { ConfigProvider, theme } from 'antd'
import elGR from 'antd/locale/el_GR'
import enUS from 'antd/locale/en_US'
import esES from 'antd/locale/es_ES'
import frFR from 'antd/locale/fr_FR'
import jaJP from 'antd/locale/ja_JP'
import ptPT from 'antd/locale/pt_PT'
import ruRU from 'antd/locale/ru_RU'
import zhCN from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'
import { FC, PropsWithChildren, useEffect, useMemo } from 'react'

import { useTheme } from './theme.context'

const logger = loggerService.withContext('AntdProvider')

export const AntdProvider: FC<PropsWithChildren> = ({ children }) => {
  const { language, userTheme } = useSettings()
  const { theme: settedTheme, compactMode } = useTheme()

  // 调试日志：记录 AntdProvider 初始化
  logger.info('🎨 [AntdProvider] 初始化:', {
    language,
    userTheme,
    settedTheme,
    compactMode,
    timestamp: Date.now()
  })

  const borderRadius =
    userTheme.borderRadius === 'small' ? 2 : userTheme.borderRadius === 'medium' ? 4 : 6

  // 使用 useMemo 优化算法数组和默认主题的计算
  const { algorithms, defaultTheme } = useMemo(() => {
    let selectedTheme = appleTheme
    const algorithmArray: (typeof theme.defaultAlgorithm)[] = []

    if (settedTheme === ThemeMode.dark) {
      algorithmArray.push(theme.darkAlgorithm)
      selectedTheme = appleDarkTheme
    }
    if (compactMode) {
      algorithmArray.push(theme.compactAlgorithm)
    }
    if (algorithmArray.length === 0) {
      algorithmArray.push(theme.defaultAlgorithm)
    }

    return {
      algorithms: algorithmArray,
      defaultTheme: selectedTheme
    }
  }, [settedTheme, compactMode])

  // 使用 useMemo 确保主题配置的稳定性，只依赖具体的值而不是整个对象
  const themeConfig = useMemo(() => {
    const config = { ...defaultTheme }
    if (config.token) {
      config.token = {
        ...config.token,
        borderRadius,
        colorPrimary: userTheme.colorPrimary,
        colorSuccess: userTheme.colorSuccess,
        colorWarning: userTheme.colorWarning,
        colorError: userTheme.colorError
      }
    }
    return config
  }, [
    defaultTheme,
    borderRadius,
    userTheme.colorPrimary,
    userTheme.colorSuccess,
    userTheme.colorWarning,
    userTheme.colorError
  ])

  // 确保主题更新时强制重新渲染 ConfigProvider
  useEffect(() => {
    logger.info('🎨 [AntdProvider] 主题配置更新:', {
      colorPrimary: userTheme.colorPrimary,
      settedTheme,
      algorithms: algorithms.length,
      timestamp: Date.now()
    })
  }, [userTheme.colorPrimary, settedTheme, algorithms.length])

  return (
    <ConfigProvider locale={getAntdLocale(language)} theme={themeConfig}>
      {children}
    </ConfigProvider>
  )
}

function getAntdLocale(language: LanguageVarious) {
  switch (language) {
    case 'zh-CN':
      return zhCN
    case 'zh-TW':
      return zhTW
    case 'en-US':
      return enUS
    case 'ru-RU':
      return ruRU
    case 'ja-JP':
      return jaJP
    case 'el-GR':
      return elGR
    case 'es-ES':
      return esES
    case 'fr-FR':
      return frFR
    case 'pt-PT':
      return ptPT
    default:
      return zhCN
  }
}
