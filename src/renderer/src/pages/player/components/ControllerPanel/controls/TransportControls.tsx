import { usePlayerStore } from '@renderer/state/stores/player.store'
import {
  FastForward,
  Pause as IconPause,
  Play as IconPlay,
  Rewind,
  SkipBack,
  SkipForward
} from 'lucide-react'
import React from 'react'
import styled from 'styled-components'

import { usePlayerCommandsOrchestrated } from '../../../hooks/usePlayerCommandsOrchestrated'
import {
  ControlCircleButton,
  ControlIconButton,
  ControlPrimaryCircleButton
} from '../styles/controls'

export default function TransportControls() {
  const paused = usePlayerStore((s) => s.paused)
  const cmd = usePlayerCommandsOrchestrated()

  return (
    <CenterControls>
      <ClusterButton title="上一条" aria-label="Previous" onClick={cmd.goToPreviousSubtitle}>
        <SkipBack size={18} />
      </ClusterButton>
      <SeekButton title="后退10秒" aria-label="Seek back 10s" onClick={cmd.seekBackwardByStep}>
        <Rewind size={18} />
      </SeekButton>

      <PlayPauseButton onClick={cmd.playPause} aria-label={paused ? 'Play' : 'Pause'}>
        {paused ? (
          <IconPlay className="lucide-custom" size={18} />
        ) : (
          <IconPause className="lucide-custom" size={18} />
        )}
      </PlayPauseButton>

      <SeekButton title="快进10秒" aria-label="Seek forward 10s" onClick={cmd.seekForwardByStep}>
        <FastForward size={18} />
      </SeekButton>
      <ClusterButton title="下一条" aria-label="Next" onClick={cmd.goToNextSubtitle}>
        <SkipForward size={18} />
      </ClusterButton>
    </CenterControls>
  )
}

const CenterControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1 1 auto;
`
const SeekButton = ControlCircleButton
const PlayPauseButton = ControlPrimaryCircleButton
const ClusterButton = ControlIconButton
