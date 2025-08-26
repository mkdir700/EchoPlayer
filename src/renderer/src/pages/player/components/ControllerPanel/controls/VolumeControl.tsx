import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Slider } from 'antd'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import React, { useCallback } from 'react'
import styled from 'styled-components'

import { usePlayerCommandsOrchestrated } from '../../../hooks/usePlayerCommandsOrchestrated'
import { useControlMenuManager } from '../hooks/useControlMenuManager'
import { GlassPopup } from '../styles/controls'

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const { changeVolumeBy, toggleMute } = usePlayerCommandsOrchestrated()

  // 使用全局菜单管理器
  const {
    isMenuOpen: isVolumeOpen,
    toggleMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'volume'
  })

  const setVolumeLevel = useCallback(
    (level: number) => {
      const normalizedLevel = level / 100 // antd Slider 使用 0-100，我们的状态使用 0-1
      const clampedLevel = Math.max(0, Math.min(1, normalizedLevel))
      const delta = clampedLevel - volume
      changeVolumeBy(delta)
    },
    [volume, changeVolumeBy]
  )

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolumeLevel(value)
      // 如果当前是静音状态且设置了音量，则取消静音
      if (value > 0 && muted) {
        toggleMute()
      }
    },
    [setVolumeLevel, muted, toggleMute]
  )

  return (
    <VolumeControlWrap ref={containerRef}>
      <VolumeButton onClick={toggleMenu} aria-label="Toggle volume panel" title="音量">
        {muted ? (
          <VolumeX size={18} />
        ) : volume > 0.5 ? (
          <Volume2 size={18} />
        ) : (
          <Volume1 size={18} />
        )}
      </VolumeButton>
      {isVolumeOpen && (
        <VolumePopup role="dialog">
          <StyledSlider
            min={0}
            max={100}
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={handleVolumeChange}
            tooltip={{
              formatter: (value) => `${value}%`,
              placement: 'top'
            }}
          />
        </VolumePopup>
      )}
    </VolumeControlWrap>
  )
}

const VolumeControlWrap = styled.div`
  position: relative;
`

const VolumeButton = styled.button`
  position: relative;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-2);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  &:hover {
    background: var(--color-hover);
    color: var(--color-text-1);
    transform: scale(1.05);
  }
  &:active {
    background: var(--color-active);
    transform: scale(0.95);
  }
`

const VolumePopup = styled(GlassPopup)`
  padding: 4px 12px;
  min-width: 160px;
`

const StyledSlider = styled(Slider)`
  width: 160px;

  .ant-slider-rail {
    background-color: var(--color-border);
    height: 3px;
  }

  .ant-slider-track {
    background-color: var(--color-primary);
    height: 3px;
  }

  .ant-slider-mark-text {
    display: none; /* 隐藏标记点下方的文本 */
  }
`
