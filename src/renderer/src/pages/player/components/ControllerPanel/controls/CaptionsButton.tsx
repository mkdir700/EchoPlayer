import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { Captions } from 'lucide-react'
import React from 'react'
import styled from 'styled-components'

import { ControlIconButton } from '../styles/controls'

export default function CaptionsButton() {
  const openSettings = usePlayerUIStore((s) => s.openSettings)
  return (
    <Button title="字幕" aria-label="Captions" onClick={() => openSettings()}>
      <Captions size={18} />
    </Button>
  )
}

const Button = styled(ControlIconButton)``
