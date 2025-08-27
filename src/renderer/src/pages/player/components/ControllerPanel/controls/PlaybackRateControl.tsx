import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Check, Zap } from 'lucide-react'
import React from 'react'
import styled from 'styled-components'

import { useControlMenuManager } from '../../../hooks/useControlMenuManager'
import { usePlayerCommands } from '../../../hooks/usePlayerCommands'
import { GlassPopup } from '../styles/controls'

const RATE_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default function PlaybackRateControl() {
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const { setPlaybackRate } = usePlayerCommands()

  // 使用全局菜单管理器
  const {
    isMenuOpen: isRateOpen,
    toggleMenu,
    closeMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'playback-rate'
  })

  const setSpeed = (rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(3, rate))
    setPlaybackRate(clampedRate)
  }

  return (
    <PlaybackRateControlWrap ref={containerRef}>
      <RateButton onClick={toggleMenu} aria-label="Playback rate">
        <Zap size={16} />
        <span>{playbackRate.toFixed(2).replace(/\.00$/, '')}x</span>
      </RateButton>
      {isRateOpen && (
        <RateDropdown role="menu">
          <RateGrid>
            {RATE_OPTIONS.map((opt) => {
              const active = Math.abs(opt - playbackRate) < 1e-6
              return (
                <RateOption
                  key={opt}
                  $active={active}
                  onClick={() => {
                    setSpeed(opt)
                    closeMenu()
                  }}
                >
                  <span>{opt}</span>
                  {active && <Check size={14} />}
                </RateOption>
              )
            })}
          </RateGrid>
        </RateDropdown>
      )}
    </PlaybackRateControlWrap>
  )
}

const PlaybackRateControlWrap = styled.div`
  position: relative;
`

const RateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 64px;
  height: 32px;
  font-size: 12px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background: var(--color-hover);
    transform: scale(1.02);
  }
`

const RateDropdown = styled(GlassPopup)`
  min-width: 240px;
`

const RateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-xs, 8px);
`

const RateOption = styled.button<{ $active?: boolean }>`
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.$active ? 'var(--color-primary)' : 'var(--color-border)')};
  background: ${(props) =>
    props.$active ? 'var(--color-primary-mute)' : 'var(--color-background-soft)'};
  color: var(--color-text-1);
  min-height: 28px;
  transition: all 0.15s ease;
  &:hover {
    background: ${(props) => (props.$active ? 'var(--color-primary-soft)' : 'var(--color-hover)')};
  }
`
