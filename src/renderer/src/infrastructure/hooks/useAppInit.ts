// import { loggerService } from '@logger'
// import useUpdateHandler from './useUpdateHandler'
import { useTheme } from '@renderer/contexts'
import i18n from '@renderer/i18n'
import { defaultLanguage } from '@shared/config/constant'
import { useEffect } from 'react'

import { isMac } from '../constants'
// import { useDefaultModel } from './useAssistant'
// import useFullScreenNotice from './useFullScreenNotice'
// import { useRuntime } from './useRuntime'
import { useSettings } from './useSettings'

// const logger = loggerService.withContext('useAppInit')

export function useAppInit() {
  const { language, windowStyle } = useSettings()
  const { theme } = useTheme()

  // useEffect(() => {
  //   document.getElementById('spinner')?.remove()
  //   // eslint-disable-next-line no-restricted-syntax
  //   console.timeEnd('init')

  //   // Initialize MemoryService after app is ready
  //   MemoryService.getInstance()
  // }, [])

  // useEffect(() => {
  //   window.api.getDataPathFromArgs().then((dataPath) => {
  //     if (dataPath) {
  //       window.navigate('/settings/data', { replace: true })
  //     }
  //   })
  // }, [])

  // useEffect(() => {
  //   window.electron.ipcRenderer.on(IpcChannel.App_SaveData, async () => {
  //     await handleSaveData()
  //   })
  // }, [])

  // useUpdateHandler()
  // useFullScreenNotice()

  useEffect(() => {
    i18n.changeLanguage(language || navigator.language || defaultLanguage)
  }, [language])

  useEffect(() => {
    const transparentWindow = windowStyle === 'transparent' && isMac

    // if (minappShow) {
    //   window.root.style.background =
    //     windowStyle === 'transparent' && isMac
    //       ? 'var(--color-background)'
    //       : 'var(--navbar-background)'
    //   return
    // }

    window.root.style.background = transparentWindow
      ? 'var(--navbar-background-mac)'
      : 'var(--navbar-background)'
  }, [windowStyle, theme])
}
