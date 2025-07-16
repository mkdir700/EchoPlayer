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
import { FC, PropsWithChildren } from 'react'

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

  let defaultTheme = appleTheme

  const algorithms: (typeof theme.defaultAlgorithm)[] = [] // 生成算法数组 / Generate algorithm array
  if (settedTheme === ThemeMode.dark) {
    algorithms.push(theme.darkAlgorithm)
    defaultTheme = appleDarkTheme
  }
  if (compactMode) {
    algorithms.push(theme.compactAlgorithm)
  }
  if (algorithms.length === 0) {
    algorithms.push(theme.defaultAlgorithm)
  }

  if (defaultTheme.token) {
    defaultTheme.token.borderRadius = borderRadius
    defaultTheme.token.colorPrimary = userTheme.colorPrimary
    defaultTheme.token.colorSuccess = userTheme.colorSuccess
    defaultTheme.token.colorWarning = userTheme.colorWarning
    defaultTheme.token.colorError = userTheme.colorError
  }

  return (
    <ConfigProvider locale={getAntdLocale(language)} theme={defaultTheme}>
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
