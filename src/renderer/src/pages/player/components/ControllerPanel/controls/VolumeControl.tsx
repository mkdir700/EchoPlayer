import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import styled from 'styled-components'

import { usePlayerCommandsOrchestrated } from '../../../hooks/usePlayerCommandsOrchestrated'
import { GlassPopup } from '../styles/controls'

const VOLUME_KEY_POINTS = [
  { value: 0, label: '静音' },
  { value: 0.25, label: '25%' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' }
]

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const { changeVolumeBy, toggleMute } = usePlayerCommandsOrchestrated()

  const [isVolumeOpen, setVolumeOpen] = useState(false)
  const volumeControlRef = useRef<HTMLDivElement | null>(null)
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const setVolumeLevel = useCallback(
    (level: number) => {
      const clampedLevel = Math.max(0, Math.min(1, level))
      const delta = clampedLevel - volume
      changeVolumeBy(delta)
    },
    [volume, changeVolumeBy]
  )

  const onSliderMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const slider = sliderRef.current
      if (!slider) return
      const rect = slider.getBoundingClientRect()
      const update = (clientX: number) => {
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        setVolumeLevel(ratio)
        if (ratio > 0 && muted) toggleMute()
      }
      update(e.clientX)

      const onMove = (evt: MouseEvent) => update(evt.clientX)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [muted, setVolumeLevel, toggleMute]
  )

  // 点击外部关闭
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const volEl = volumeControlRef.current
      if (volEl && !volEl.contains(e.target as Node)) setVolumeOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <VolumeControlWrap ref={volumeControlRef}>
      <VolumeButton
        onClick={() => setVolumeOpen((v) => !v)}
        aria-label="Toggle volume panel"
        title="音量"
      >
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
          <CustomVolumeSlider ref={sliderRef} onMouseDown={onSliderMouseDown}>
            <CustomVolumeTrack />
            <CustomVolumeFill style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
            {VOLUME_KEY_POINTS.map((p) => (
              <CustomVolumeKeyPoint
                key={p.value}
                style={{ left: `${p.value * 100}%` }}
                $active={Math.abs((muted ? 0 : volume) - p.value) < 0.05}
                onClick={(e) => {
                  e.stopPropagation()
                  setVolumeLevel(p.value)
                  if (p.value > 0 && muted) toggleMute()
                }}
                title={p.label}
              />
            ))}
            <CustomVolumeHandle style={{ left: `${(muted ? 0 : volume) * 100}%` }} />
          </CustomVolumeSlider>
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

const VolumePopup = styled(GlassPopup)``

const CustomVolumeSlider = styled.div`
  position: relative;
  width: 180px;
  height: 16px;
  cursor: pointer;
`
const CustomVolumeTrack = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border);
  border-radius: 1.5px;
  transform: translateY(-50%);
`
const CustomVolumeFill = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
  transform: translateY(-50%);
  transition: width 0.15s ease;
`
const CustomVolumeHandle = styled.div`
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px var(--color-border);
`
const CustomVolumeKeyPoint = styled.div<{ $active?: boolean }>`
  position: absolute;
  top: 50%;
  width: ${(p) => (p.$active ? 8 : 6)}px;
  height: ${(p) => (p.$active ? 8 : 6)}px;
  background: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-text-3)')};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.15s ease;
`
