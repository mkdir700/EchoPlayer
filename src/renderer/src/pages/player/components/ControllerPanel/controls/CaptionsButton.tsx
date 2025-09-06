import { loggerService } from '@logger'
import { useSubtitleOverlay } from '@renderer/pages/player/hooks'
import { useControlMenuManager } from '@renderer/pages/player/hooks/useControlMenuManager'
import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Captions } from 'lucide-react'
import { useMemo } from 'react'
import styled, { css } from 'styled-components'

import { ControlToggleButton } from '../styles/controls'

const logger = loggerService.withContext('CaptionsButton')

export default function CaptionsButton() {
  const integration = useSubtitleOverlay()

  // 获取当前字幕配置
  const currentConfig = usePlayerStore((s) => s.subtitleOverlay)
  const displayMode = currentConfig?.displayMode ?? SubtitleDisplayMode.NONE
  const backgroundStyle = currentConfig?.backgroundStyle ?? {
    type: SubtitleBackgroundType.BLUR,
    opacity: 0.8
  }

  // 配置操作
  const setDisplayMode = integration.setDisplayMode
  const setBackgroundType = integration.setBackgroundType

  // 使用全局菜单管理器
  const {
    isMenuOpen: isCaptionsMenuOpen,
    toggleMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'captions'
  })

  // 显示模式选项
  const displayModes = useMemo(
    () => [
      {
        mode: SubtitleDisplayMode.NONE,
        label: '隐藏',
        tooltip: '隐藏字幕 (Ctrl+1)'
      },
      {
        mode: SubtitleDisplayMode.ORIGINAL,
        label: '原文',
        tooltip: '仅显示原文 (Ctrl+2)'
      },
      {
        mode: SubtitleDisplayMode.TRANSLATED,
        label: '译文',
        tooltip: '仅显示译文 (Ctrl+3)'
      },
      {
        mode: SubtitleDisplayMode.BILINGUAL,
        label: '双语',
        tooltip: '显示双语字幕 (Ctrl+4)'
      }
    ],
    []
  )

  // 背景类型选项
  const backgroundTypes = useMemo(
    () => [
      {
        type: SubtitleBackgroundType.TRANSPARENT,
        tooltip: '透明背景'
      },
      {
        type: SubtitleBackgroundType.BLUR,
        tooltip: '模糊背景'
      },
      {
        type: SubtitleBackgroundType.SOLID_BLACK,
        tooltip: '黑色背景'
      },
      {
        type: SubtitleBackgroundType.SOLID_GRAY,
        tooltip: '灰色背景'
      }
    ],
    []
  )

  // 事件处理器
  const handleModeChange = (mode: SubtitleDisplayMode) => {
    setDisplayMode(mode)
    logger.info('字幕显示模式已切换', { mode })
  }

  const handleBackgroundChange = (type: SubtitleBackgroundType) => {
    setBackgroundType(type)
    logger.info('字幕背景类型已切换', { type })
  }

  return (
    <div ref={containerRef}>
      <ControlToggleButton
        $active={displayMode !== SubtitleDisplayMode.NONE}
        $menuOpen={isCaptionsMenuOpen}
        title="字幕控制"
        aria-label="字幕控制"
        onClick={toggleMenu}
        onContextMenu={(e) => {
          e.preventDefault()
          toggleMenu()
        }}
        aria-pressed={displayMode !== SubtitleDisplayMode.NONE}
      >
        <Captions size={18} />

        {isCaptionsMenuOpen && (
          <CaptionsMenu
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <MenuSection>
              <MenuTitle>显示模式</MenuTitle>
              <MenuRow>
                {displayModes.map(({ mode, label, tooltip }) => (
                  <MenuOption
                    key={mode}
                    $active={displayMode === mode}
                    onClick={() => handleModeChange(mode)}
                    title={tooltip}
                  >
                    {label}
                  </MenuOption>
                ))}
              </MenuRow>
            </MenuSection>

            <MenuSection>
              <MenuTitle>背景样式</MenuTitle>
              <MenuRow>
                {backgroundTypes.map(({ type, tooltip }) => (
                  <MenuOption
                    key={type}
                    $active={backgroundStyle.type === type}
                    onClick={() => handleBackgroundChange(type)}
                    title={tooltip}
                  >
                    <BackgroundPreview $type={type} />
                  </MenuOption>
                ))}
              </MenuRow>
            </MenuSection>
          </CaptionsMenu>
        )}
      </ControlToggleButton>
    </div>
  )
}

// === 样式组件 ===
const CaptionsMenu = styled.div`
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
  min-width: 200px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 28px;

  &:hover {
    background: ${(p) => (p.$active ? 'var(--color-primary-soft)' : 'var(--color-hover)')};
  }
`

const BackgroundPreview = styled.div<{ $type: SubtitleBackgroundType }>`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  ${(props) => {
    switch (props.$type) {
      case SubtitleBackgroundType.TRANSPARENT:
        return css`
          background: transparent;
          border-style: dashed;
        `
      case SubtitleBackgroundType.BLUR:
        return css`
          background: rgba(128, 128, 128, 0.3);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        `
      case SubtitleBackgroundType.SOLID_BLACK:
        return css`
          background: rgba(0, 0, 0, 0.8);
        `
      case SubtitleBackgroundType.SOLID_GRAY:
        return css`
          background: rgba(128, 128, 128, 0.8);
        `
      default:
        return css`
          background: transparent;
        `
    }
  }}
`
