import { PLAYBACK_RATE_PRESETS } from '@renderer/infrastructure'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Zap } from 'lucide-react'
import styled from 'styled-components'

import { useControlMenuManager } from '../../../hooks/useControlMenuManager'
import { useHoverMenu } from '../../../hooks/useHoverMenu'
import { usePlayerCommands } from '../../../hooks/usePlayerCommands'
import { ControlContainer, GlassPopup } from '../styles/controls'

export default function PlaybackRateControl() {
  const rawPlaybackRate = usePlayerStore((s) => s.playbackRate)
  const favoriteRates = usePlayerStore((s) => s.favoriteRates)
  const cycleFavoriteRate = usePlayerStore((s) => s.cycleFavoriteRate)
  const toggleFavoriteRate = usePlayerStore((s) => s.toggleFavoriteRate)
  const { setPlaybackRate } = usePlayerCommands()

  // 确保 playbackRate 始终是一个有效的数字
  const playbackRate =
    typeof rawPlaybackRate === 'number' && !isNaN(rawPlaybackRate) ? rawPlaybackRate : 1

  // 使用全局菜单管理器
  const {
    isMenuOpen: isRateOpen,
    toggleMenu,
    closeMenu,
    openMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'playback-rate'
  })

  // 使用hover菜单逻辑
  const { buttonProps, menuProps } = useHoverMenu({
    isMenuOpen: isRateOpen,
    openMenu,
    closeMenu,
    openDelay: 200,
    closeDelay: 100
  })

  const setSpeed = (rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(3, rate))
    setPlaybackRate(clampedRate)
  }

  // 处理左键点击：循环切换常用速度
  const handleLeftClick = () => {
    if (favoriteRates.length > 0) {
      cycleFavoriteRate()
    } else {
      // 如果没有常用速度，使用默认逻辑（打开菜单）
      toggleMenu()
    }
  }

  // 检查当前速度是否为常用速度
  const isFavoriteRate = (rate: number) => {
    return favoriteRates.some((fav) => Math.abs(fav - rate) < 1e-6)
  }

  // 处理速度选项的点击事件
  const handleRateOptionClick = (rate: number, event: React.MouseEvent) => {
    event.preventDefault()

    if (event.ctrlKey) {
      // Ctrl + 点击：切换收藏状态
      toggleFavoriteRate(rate)
    } else {
      // 普通点击：设置速度并关闭菜单
      setSpeed(rate)
      closeMenu()
    }
  }

  // 处理右键菜单
  const handleRateOptionContextMenu = (rate: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    toggleFavoriteRate(rate)
  }

  return (
    <ControlContainer ref={containerRef}>
      <RateButton
        {...buttonProps}
        onClick={(e) => {
          e.preventDefault()
          // 左键点击处理常用速度切换，右键或其他情况打开菜单
          if (e.button === 0) {
            handleLeftClick()
          } else {
            buttonProps.onClick(toggleMenu)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          openMenu()
        }}
        aria-label="Playback rate"
      >
        <Zap size={16} />
        <span>{playbackRate.toFixed(2).replace(/\.00$/, '')}x</span>
      </RateButton>
      {isRateOpen && (
        <RateDropdown role="menu" {...menuProps}>
          <RateGrid>
            {PLAYBACK_RATE_PRESETS.map((opt) => {
              const active = Math.abs(opt - playbackRate) < 1e-6
              const isFavorite = isFavoriteRate(opt)
              return (
                <RateOption
                  key={opt}
                  $active={active}
                  $favorite={isFavorite}
                  onClick={(event) => handleRateOptionClick(opt, event)}
                  onContextMenu={(event) => handleRateOptionContextMenu(opt, event)}
                >
                  <RateOptionContent>
                    <span>{opt}</span>
                  </RateOptionContent>
                </RateOption>
              )
            })}
          </RateGrid>
          <RateHint>右键或 Control+点击 设置常用速度</RateHint>
        </RateDropdown>
      )}
    </ControlContainer>
  )
}

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

const RateOption = styled.button<{ $active?: boolean; $favorite?: boolean }>`
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 6px;
  position: relative;
  border: 1px solid
    ${(props) => {
      if (props.$active) return 'var(--color-primary)'
      if (props.$favorite) return 'var(--color-warning)'
      return 'var(--color-border)'
    }};
  background: ${(props) => {
    if (props.$active) return 'var(--color-primary-mute)'
    if (props.$favorite) return 'var(--color-warning-mute)'
    return 'var(--color-background-soft)'
  }};
  color: var(--color-text-1);
  min-height: 28px;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) => {
      if (props.$active) return 'var(--color-primary-soft)'
      if (props.$favorite) return 'var(--color-warning-soft)'
      return 'var(--color-hover)'
    }};
    transform: scale(1.02);
  }

  /* 收藏状态的额外视觉提示 */
  ${(props) =>
    props.$favorite &&
    `
    &::before {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--color-warning);
      opacity: 0.6;
      z-index: 1;
    }
  `}

  /* 激活状态优先级高于收藏状态 */
  ${(props) =>
    props.$active &&
    props.$favorite &&
    `
    &::before {
      background: var(--color-primary);
    }
  `}
`

const RateOptionContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const RateHint = styled.div`
  font-size: 11px;
  color: var(--color-text-3);
  text-align: center;
  padding: 8px 12px 4px;
  border-top: 1px solid var(--color-border-light);
  margin-top: 8px;
  opacity: 0.8;
`
