import { usePlayerCommands } from '@renderer/pages/player/hooks/usePlayerCommands'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Maximize, Minimize } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ControlIconButton } from '../styles/controls'

export default function FullscreenButton() {
  const { t } = useTranslation()
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const cmd = usePlayerCommands()

  return (
    <Button
      onClick={() => cmd.setFullscreen(!isFullscreen)}
      aria-label="Toggle fullscreen"
      title={isFullscreen ? t('controls.fullscreen.exit') : t('controls.fullscreen.enter')}
    >
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </Button>
  )
}

const Button = styled(ControlIconButton)``
