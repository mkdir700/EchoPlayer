import { loggerService } from '@logger'
import { isMac, isWin } from '@renderer/infrastructure/constants'
import { useNavbarPosition, useSettings } from '@renderer/infrastructure/hooks/useSettings'
import useUserTheme from '@renderer/infrastructure/hooks/useUserTheme'
import { buildStyles } from '@renderer/infrastructure/styles'
import { IpcChannel } from '@shared/IpcChannel'
import type { ThemeStyles } from '@types'
import { ThemeMode } from '@types'
import type { GlobalToken } from 'antd'
import { theme } from 'antd'
import React, { createContext, PropsWithChildren, use, useEffect, useMemo, useState } from 'react'

const logger = loggerService.withContext('ThemeContext')

interface ThemeContextType {
  theme: ThemeMode
  settedTheme: ThemeMode
  compactMode: boolean
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
  styles: ThemeStyles
  token: GlobalToken
}

const ThemeContext = createContext<ThemeContextType>({
  theme: ThemeMode.system,
  settedTheme: ThemeMode.dark,
  compactMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
  styles: {} as ThemeStyles,
  token: {} as GlobalToken
})

interface ThemeProviderProps extends PropsWithChildren {
  defaultTheme?: ThemeMode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 用户设置的主题
  const { theme: settedTheme, compactMode, setTheme: setSettedTheme } = useSettings()
  const [actualTheme, setActualTheme] = useState<ThemeMode>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? ThemeMode.dark : ThemeMode.light
  )
  const { initUserTheme } = useUserTheme()
  const { navbarPosition } = useNavbarPosition()

  logger.info('🎨 [ThemeProvider] 初始化:', {
    settedTheme,
    actualTheme,
    compactMode,
    timestamp: Date.now()
  })

  // 获取 Ant Design 的 token 并生成样式
  const { token } = theme.useToken()
  const styles = useMemo(() => buildStyles(token), [actualTheme, compactMode, token])

  const toggleTheme = () => {
    const nextTheme = {
      [ThemeMode.light]: ThemeMode.dark,
      [ThemeMode.dark]: ThemeMode.system,
      [ThemeMode.system]: ThemeMode.light
    }[settedTheme]
    setSettedTheme(nextTheme || ThemeMode.system)
  }

  useEffect(() => {
    // Set initial theme and OS attributes on body
    document.body.setAttribute('os', isMac ? 'mac' : isWin ? 'windows' : 'linux')
    document.body.setAttribute('theme-mode', actualTheme)
    document.body.setAttribute('navbar-position', navbarPosition)

    // if theme is old auto, then set theme to system
    // we can delete this after next big release
    if (
      settedTheme !== ThemeMode.dark &&
      settedTheme !== ThemeMode.light &&
      settedTheme !== ThemeMode.system
    ) {
      setSettedTheme(ThemeMode.system)
    }

    initUserTheme()

    // listen for theme updates from main process
    return window.electron.ipcRenderer.on(IpcChannel.ThemeUpdated, (_, actualTheme: ThemeMode) => {
      document.body.setAttribute('theme-mode', actualTheme)
      setActualTheme(actualTheme)
    })
  }, [actualTheme, initUserTheme, setSettedTheme, settedTheme])

  // 监听主题状态变化
  useEffect(() => {
    logger.info('🎨 [ThemeProvider] 主题状态变化:', {
      settedTheme,
      actualTheme,
      compactMode,
      timestamp: Date.now()
    })
  }, [settedTheme, actualTheme, compactMode])

  useEffect(() => {
    window.api.setTheme(settedTheme)
  }, [settedTheme])

  return (
    <ThemeContext
      value={{
        theme: actualTheme,
        settedTheme,
        toggleTheme,
        compactMode,
        setTheme: setSettedTheme,
        styles,
        token
      }}
    >
      {children}
    </ThemeContext>
  )
}

export const useTheme = () => use(ThemeContext)
