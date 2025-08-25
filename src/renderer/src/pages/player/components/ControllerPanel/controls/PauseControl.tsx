import { usePlayerStore } from '@renderer/state/stores/player.store'
import { InputNumber, Switch } from 'antd'
import { PauseCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { ControlToggleButton } from '../styles/controls'

export default function AutoPauseButton() {
  const { t } = useTranslation()
  const autoPauseEnabled = usePlayerStore((s) => s.autoPauseEnabled)
  const pauseOnSubtitleEnd = usePlayerStore((s) => s.pauseOnSubtitleEnd)
  const resumeEnabled = usePlayerStore((s) => s.resumeEnabled)
  const resumeDelay = usePlayerStore((s) => s.resumeDelay)
  const setAutoPauseEnabled = usePlayerStore((s) => s.setAutoPauseEnabled)
  const setPauseOnSubtitleEnd = usePlayerStore((s) => s.setPauseOnSubtitleEnd)
  const setResumeEnabled = usePlayerStore((s) => s.setResumeEnabled)
  const setResumeDelay = usePlayerStore((s) => s.setResumeDelay)

  const [isMenuOpen, setMenuOpen] = useState(false)
  const [pendingPauseOnSubtitleEnd, setPendingPauseOnSubtitleEnd] = useState(pauseOnSubtitleEnd)
  const [pendingResumeEnabled, setPendingResumeEnabled] = useState(resumeEnabled)
  const [pendingDelay, setPendingDelay] = useState<number>(resumeDelay)

  const openMenu = () => {
    setPendingPauseOnSubtitleEnd(pauseOnSubtitleEnd)
    setPendingResumeEnabled(resumeEnabled)
    setPendingDelay(resumeDelay)
    setMenuOpen(true)
  }
  const closeMenuAndApply = () => {
    // 统一提交
    if (pendingPauseOnSubtitleEnd !== pauseOnSubtitleEnd)
      setPauseOnSubtitleEnd(pendingPauseOnSubtitleEnd)
    if (pendingResumeEnabled !== resumeEnabled) setResumeEnabled(pendingResumeEnabled)
    if (Number.isFinite(pendingDelay) && pendingDelay !== resumeDelay) setResumeDelay(pendingDelay)
    setMenuOpen(false)
  }

  return (
    <ControlToggleButton
      $active={autoPauseEnabled}
      $menuOpen={isMenuOpen}
      title={autoPauseEnabled ? '自动暂停：已开启（右键设置）' : '自动暂停：未开启（右键设置）'}
      aria-label={autoPauseEnabled ? '关闭自动暂停' : '开启自动暂停'}
      onClick={() => {
        if (isMenuOpen) return
        setAutoPauseEnabled(!autoPauseEnabled)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        if (isMenuOpen) {
          closeMenuAndApply()
        } else {
          openMenu()
        }
      }}
      aria-pressed={autoPauseEnabled}
    >
      <PauseCircle size={18} />

      {isMenuOpen && (
        <MenuContainer
          role="menu"
          onMouseLeave={closeMenuAndApply}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <MenuSection>
            <MenuTitle>字幕结束暂停</MenuTitle>
            <Row>
              <Switch
                size="small"
                checked={pendingPauseOnSubtitleEnd}
                onChange={(checked) => setPendingPauseOnSubtitleEnd(checked)}
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
                {pendingPauseOnSubtitleEnd ? '已开启' : '已关闭'}
              </span>
            </Row>
          </MenuSection>

          <MenuSection>
            <MenuTitle>{t('controls.auto_pause.resume_title')}</MenuTitle>
            <Row>
              <Switch
                size="small"
                checked={pendingResumeEnabled}
                onChange={(checked) => setPendingResumeEnabled(checked)}
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
                {pendingResumeEnabled ? '已开启' : '已关闭'}
              </span>
            </Row>
          </MenuSection>

          <MenuSection>
            <MenuTitle>{t('controls.auto_pause.resume_delay')}</MenuTitle>
            <Row>
              <InputNumber
                size="small"
                min={1}
                max={30}
                step={1}
                value={pendingDelay / 1000}
                onChange={(v) => setPendingDelay(typeof v === 'number' ? v * 1000 : 0)}
                onPressEnter={closeMenuAndApply}
                style={{ width: 100 }}
              />
              <QuickChip onClick={() => setPendingDelay(5000)} $active={pendingDelay === 5000}>
                5
              </QuickChip>
              <QuickChip onClick={() => setPendingDelay(10000)} $active={pendingDelay === 10000}>
                10
              </QuickChip>
            </Row>
          </MenuSection>
        </MenuContainer>
      )}
    </ControlToggleButton>
  )
}

const MenuContainer = styled.div`
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
  min-width: 240px;
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

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const QuickChip = styled.button<{ $active?: boolean }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-border)')};
  background: ${(p) => (p.$active ? 'var(--color-primary-mute)' : 'var(--color-background-soft)')};
  color: var(--color-text-1);
  cursor: pointer;
  &:hover {
    background: ${(p) => (p.$active ? 'var(--color-primary-soft)' : 'var(--color-hover)')};
  }
`
