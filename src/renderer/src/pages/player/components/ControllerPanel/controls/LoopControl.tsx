import { usePlayerStore } from '@renderer/state/stores/player.store'
import { LoopMode } from '@types'
import { Repeat } from 'lucide-react'
import React, { useState } from 'react'
import styled from 'styled-components'

import { ControlToggleButton } from '../styles/controls'

export default function LoopControl() {
  const loopEnabled = usePlayerStore((s) => s.loopEnabled)
  const loopMode = usePlayerStore((s) => s.loopMode)
  const loopCount = usePlayerStore((s) => s.loopCount)
  const loopRemaining = usePlayerStore((s) => s.loopRemainingCount)
  const setLoopEnabled = usePlayerStore((s) => s.setLoopEnabled)
  const setLoopMode = usePlayerStore((s) => s.setLoopMode)
  const setLoopCount = usePlayerStore((s) => s.setLoopCount)

  const [isLoopMenuOpen, setLoopMenuOpen] = useState(false)
  const [pendingLoopCount, setPendingLoopCount] = useState<number | null>(null)

  // 打开/关闭循环菜单时的处理：打开时缓存当前次数；关闭时统一应用
  const openLoopMenu = () => {
    setPendingLoopCount(loopCount)
    setLoopMenuOpen(true)
  }
  const closeLoopMenuAndApply = () => {
    // 先应用次数，再关闭菜单，降低外层点击误触造成的状态竞争
    if (pendingLoopCount !== null && pendingLoopCount !== loopCount) {
      setLoopCount(pendingLoopCount)
    }
    setPendingLoopCount(null)
    setLoopMenuOpen(false)
  }

  const activeCount = isLoopMenuOpen && pendingLoopCount !== null ? pendingLoopCount : loopCount

  return (
    <ControlToggleButton
      $active={loopEnabled}
      $menuOpen={isLoopMenuOpen}
      onClick={() => {
        if (isLoopMenuOpen) return // 菜单打开时，忽略外层按钮的切换，避免误触
        setLoopEnabled(!loopEnabled)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (isLoopMenuOpen) {
          closeLoopMenuAndApply()
        } else {
          openLoopMenu()
        }
      }}
      title="循环（右键更多选项）"
      aria-label={
        loopEnabled
          ? loopRemaining === -1
            ? '循环已开启：无限次'
            : loopCount > 0
              ? `循环已开启：第 ${loopCount - loopRemaining + 1}/${loopCount} 次`
              : '循环已完成'
          : '循环未开启'
      }
      aria-pressed={loopEnabled}
    >
      <Repeat size={18} />
      {loopEnabled && (loopRemaining === -1 || loopRemaining > 0) && (
        <LoopBadge $active={loopEnabled} aria-hidden="true">
          {loopRemaining === -1
            ? '∞'
            : loopCount > 0
              ? `${loopCount - loopRemaining + 1}/${loopCount}`
              : '0'}
        </LoopBadge>
      )}
      {isLoopMenuOpen && (
        <LoopMenu
          role="menu"
          onMouseLeave={closeLoopMenuAndApply}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            // 防止在菜单内部右键触发外层开关逻辑
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MenuSection>
            <MenuTitle>循环模式</MenuTitle>
            <MenuRow>
              <MenuOption
                $active={loopMode === LoopMode.SINGLE}
                onClick={() => {
                  setLoopMode(LoopMode.SINGLE)
                }}
              >
                单句循环
              </MenuOption>
              {/* 预留：AB 循环（暂不实现） */}
              <MenuOption $disabled>AB 循环（开发中）</MenuOption>
            </MenuRow>
          </MenuSection>

          <MenuSection>
            <MenuTitle>循环次数</MenuTitle>
            <MenuRow>
              <MenuOption
                onClick={() => {
                  setPendingLoopCount(-1)
                }}
                $active={activeCount === -1}
              >
                ∞
              </MenuOption>
              {[2, 5, 10].map((n) => (
                <MenuOption
                  key={n}
                  onClick={() => {
                    setPendingLoopCount(n)
                  }}
                  $active={activeCount === n}
                >
                  {n}
                </MenuOption>
              ))}
              <CustomInput
                type="number"
                min={1}
                max={99}
                placeholder=""
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = Number((e.target as HTMLInputElement).value)
                    if (Number.isFinite(v)) {
                      const n = Math.max(1, Math.min(99, Math.floor(v)))
                      setPendingLoopCount(n)
                    }
                    closeLoopMenuAndApply()
                  }
                }}
              />
            </MenuRow>
          </MenuSection>
        </LoopMenu>
      )}
    </ControlToggleButton>
  )
}

const LoopBadge = styled.span<{ $active?: boolean }>`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? 'transparent' : 'var(--color-border)')};
  background: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-background-soft)')};
  color: ${(p) => (p.$active ? 'var(--color-white)' : 'var(--color-text-1)')};
  font-size: 9px;
  line-height: 14px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  max-width: 28px;
`

const LoopMenu = styled.div`
  position: absolute;
  z-index: 1000;
  top: -8px;
  left: 40px;
  transform: translateY(-100%);
  background: var(--modal-background-glass);
  border: 1px solid var(--modal-border-color);
  border-radius: 10px;
  box-shadow: var(--modal-shadow);
  backdrop-filter: blur(20px);
  padding: 10px 12px;
  color: var(--color-text);
  min-width: 260px;
`

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  & + & {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--color-border);
  }
`

const MenuTitle = styled.div`
  font-size: 12px;
  color: var(--color-text-2);
  text-align: left;
`

const MenuRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const MenuOption = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  border: 1px solid ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-border)')};
  background: ${(p) => (p.$active ? 'var(--color-primary-mute)' : 'var(--color-background-soft)')};
  color: ${(p) => (p.$disabled ? 'var(--color-text-3)' : 'var(--color-text-1)')};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  &:hover {
    background: ${(p) => (p.$active ? 'var(--color-primary-soft)' : 'var(--color-hover)')};
  }
`

const CustomInput = styled.input`
  width: 72px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text-1);
  padding: 0 8px;
  font-size: 12px;
`
