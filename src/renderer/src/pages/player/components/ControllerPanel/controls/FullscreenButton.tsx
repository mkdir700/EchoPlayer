import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Maximize, Minimize } from 'lucide-react'
import React from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'
import { ControlIconButton } from '../styles/controls'

export default function FullscreenButton() {
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const cmd = usePlayerCommands()

  return (
    <Button onClick={cmd.toggleFullscreen} aria-label="Toggle fullscreen" title="全屏">
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </Button>
  )
}

const Button = styled(ControlIconButton)``
