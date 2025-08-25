import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { Settings } from 'lucide-react'
import React from 'react'
import styled from 'styled-components'

import { ControlIconButton } from '../styles/controls'

export default function SettingsButton() {
  const openSettings = usePlayerUIStore((s) => s.openSettings)
  return (
    <Button title="设置" aria-label="Settings" onClick={() => openSettings()}>
      <Settings size={18} />
    </Button>
  )
}

const Button = styled(ControlIconButton)``
