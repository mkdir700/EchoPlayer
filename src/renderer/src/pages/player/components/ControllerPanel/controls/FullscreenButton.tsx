import { loggerService } from '@logger'
import { useFullscreen } from '@renderer/infrastructure/hooks/useFullscreen'
import { IpcChannel } from '@shared/IpcChannel'
import { Maximize, Minimize } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ControlIconButton } from '../styles/controls'

const logger = loggerService.withContext('FullscreenButton')

export default function FullscreenButton() {
  const { t } = useTranslation()
  const isFullscreen = useFullscreen()

  const handleToggleFullscreen = async () => {
    try {
      await window.electron.ipcRenderer.invoke(IpcChannel.Window_ToggleFullScreen)
    } catch (error) {
      logger.error('Failed to toggle fullscreen:', { error })
    }
  }

  return (
    <Button
      onClick={handleToggleFullscreen}
      aria-label="Toggle fullscreen"
      title={
        isFullscreen ? t('player.controls.fullscreen.exit') : t('player.controls.fullscreen.enter')
      }
    >
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </Button>
  )
}

const Button = styled(ControlIconButton)``
