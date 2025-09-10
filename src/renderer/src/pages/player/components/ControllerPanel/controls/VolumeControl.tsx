import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Slider } from 'antd'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import styled from 'styled-components'

import { useControlMenuManager } from '../../../hooks/useControlMenuManager'
import { useHoverMenu } from '../../../hooks/useHoverMenu'
import { usePlayerCommands } from '../../../hooks/usePlayerCommands'
import { useVolumeWheelControl } from '../../../hooks/useVolumeWheelControl'
import { GlassPopup } from '../styles/controls'

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const { changeVolumeBy, toggleMute } = usePlayerCommands()

  // 使用全局菜单管理器
  const {
    isMenuOpen: isVolumeOpen,
    closeMenu: closeVolumeMenu,
    openMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'volume'
  })

  // 使用hover菜单Hook
  const { buttonProps, menuProps } = useHoverMenu({
    openDelay: 200,
    closeDelay: 100,
    disabled: false,
    isMenuOpen: isVolumeOpen,
    openMenu,
    closeMenu: closeVolumeMenu
  })

  // 使用滚轮控制Hook
  const { containerRef: wheelContainerRef } = useVolumeWheelControl({
    enabled: isVolumeOpen
  })

  // 同步ref - 让滚轮控制的ref指向菜单管理器的容器元素
  useEffect(() => {
    if (containerRef.current && wheelContainerRef.current !== containerRef.current) {
      wheelContainerRef.current = containerRef.current
    }
  }, [containerRef, wheelContainerRef])

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
      <VolumeButton
        onClick={() => buttonProps.onClick(toggleMute)}
        onMouseEnter={buttonProps.onMouseEnter}
        onMouseLeave={buttonProps.onMouseLeave}
        aria-label="Toggle mute / Hover for volume slider"
      >
        {muted || volume === 0 ? (
          <VolumeX size={18} />
        ) : volume > 0.5 ? (
          <Volume2 size={18} />
        ) : (
          <Volume1 size={18} />
        )}
      </VolumeButton>
      {isVolumeOpen && (
        <VolumePopup
          role="dialog"
          onMouseEnter={menuProps.onMouseEnter}
          onMouseLeave={menuProps.onMouseLeave}
        >
          <StyledSlider
            vertical
            min={0}
            max={100}
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={handleVolumeChange}
            tooltip={{
              formatter: (value) => `${value}%`,
              placement: 'left'
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
  padding: 12px 4px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledSlider = styled(Slider)`
  height: 80px;

  .ant-slider-rail {
    background-color: var(--color-border);
    width: 3px;
  }

  .ant-slider-track {
    background-color: var(--color-primary);
    width: 3px;
  }

  .ant-slider-mark-text {
    display: none; /* 隐藏标记点下方的文本 */
  }
`
