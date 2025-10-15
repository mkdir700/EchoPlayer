import { loggerService } from '@logger'
import { useSubtitleOverlay } from '@renderer/pages/player/hooks'
import { useControlMenuManager } from '@renderer/pages/player/hooks/useControlMenuManager'
import { useHoverMenu } from '@renderer/pages/player/hooks/useHoverMenu'
import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Captions } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { ControlContainer, ControlToggleButton } from '../styles/controls'

const logger = loggerService.withContext('CaptionsButton')

export default function CaptionsButton() {
  const { t } = useTranslation()
  const integration = useSubtitleOverlay()

  // 获取当前字幕配置
  const currentConfig = usePlayerStore((s) => s.subtitleOverlay)
  const displayMode = currentConfig?.displayMode ?? SubtitleDisplayMode.NONE
  const backgroundStyle = currentConfig?.backgroundStyle ?? {
    type: SubtitleBackgroundType.BLUR,
    opacity: 0.8
  }
  const isMaskMode = integration.isMaskMode

  // 配置操作
  const setDisplayMode = integration.setDisplayMode
  const setBackgroundType = integration.setBackgroundType

  // 使用全局菜单管理器
  const {
    isMenuOpen: isCaptionsMenuOpen,
    closeMenu: closeCaptionsMenu,
    openMenu,
    containerRef
  } = useControlMenuManager({
    menuId: 'captions'
  })

  // 使用hover菜单Hook
  const { buttonProps, menuProps } = useHoverMenu({
    openDelay: 200,
    closeDelay: 100,
    disabled: false,
    isMenuOpen: isCaptionsMenuOpen,
    openMenu,
    closeMenu: closeCaptionsMenu
  })

  // 显示模式选项
  const displayModes = useMemo(
    () => [
      {
        mode: SubtitleDisplayMode.NONE,
        label: t('player.controls.subtitle.display-mode.hide.label'),
        tooltip: t('player.controls.subtitle.display-mode.hide.tooltip')
      },
      {
        mode: SubtitleDisplayMode.ORIGINAL,
        label: t('player.controls.subtitle.display-mode.original.label'),
        tooltip: t('player.controls.subtitle.display-mode.original.tooltip')
      },
      {
        mode: SubtitleDisplayMode.TRANSLATED,
        label: t('player.controls.subtitle.display-mode.translation.label'),
        tooltip: t('player.controls.subtitle.display-mode.translation.tooltip')
      },
      {
        mode: SubtitleDisplayMode.BILINGUAL,
        label: t('player.controls.subtitle.display-mode.bilingual.label'),
        tooltip: t('player.controls.subtitle.display-mode.bilingual.tooltip')
      }
    ],
    [t]
  )

  // 背景类型选项
  const backgroundTypes = useMemo(
    () => [
      {
        type: SubtitleBackgroundType.TRANSPARENT,
        tooltip: t('player.controls.subtitle.background-type.transparent.tooltip')
      },
      {
        type: SubtitleBackgroundType.BLUR,
        tooltip: t('player.controls.subtitle.background-type.blur.tooltip')
      },
      {
        type: SubtitleBackgroundType.SOLID_BLACK,
        tooltip: t('player.controls.subtitle.background-type.solid-black.tooltip')
      },
      {
        type: SubtitleBackgroundType.SOLID_GRAY,
        tooltip: t('player.controls.subtitle.background-type.solid-gray.tooltip')
      }
    ],
    [t]
  )

  // 事件处理器
  const handleModeChange = (mode: SubtitleDisplayMode) => {
    setDisplayMode(mode)
    logger.info('字幕显示模式已切换', { mode })
  }

  const handleBackgroundChange = (type: SubtitleBackgroundType) => {
    if (isMaskMode) return
    setBackgroundType(type)
    logger.info('字幕背景类型已切换', { type })
  }

  // 切换字幕显示/隐藏（左键点击功能）
  const toggleCaptions = () => {
    if (displayMode === SubtitleDisplayMode.NONE) {
      // 如果当前隐藏，默认显示双语
      setDisplayMode(SubtitleDisplayMode.BILINGUAL)
      logger.info('字幕已启用', { mode: SubtitleDisplayMode.BILINGUAL })
    } else {
      // 如果当前显示，则隐藏
      setDisplayMode(SubtitleDisplayMode.NONE)
      logger.info('字幕已隐藏')
    }
  }

  return (
    <ControlContainer ref={containerRef}>
      <ControlToggleButton
        $active={displayMode !== SubtitleDisplayMode.NONE}
        $menuOpen={isCaptionsMenuOpen}
        aria-label="Toggle captions / Hover for settings"
        onClick={() => buttonProps.onClick(toggleCaptions)}
        onMouseEnter={buttonProps.onMouseEnter}
        onMouseLeave={buttonProps.onMouseLeave}
        aria-pressed={displayMode !== SubtitleDisplayMode.NONE}
      >
        <Captions size={18} />
      </ControlToggleButton>

      {isCaptionsMenuOpen && (
        <CaptionsMenu
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={menuProps.onMouseEnter}
          onMouseLeave={menuProps.onMouseLeave}
        >
          <MenuSection>
            <MenuTitle>{t('player.controls.subtitle.mask-mode.title')}</MenuTitle>
            <MenuRow>
              <MenuOption
                $active={isMaskMode}
                onClick={() => integration.toggleMaskMode()}
                title={
                  isMaskMode
                    ? t('player.controls.subtitle.mask-mode.disable.tooltip')
                    : t('player.controls.subtitle.mask-mode.enable.tooltip')
                }
              >
                <span>{t('player.controls.subtitle.mask-mode.label')}</span>
              </MenuOption>
            </MenuRow>
          </MenuSection>

          <MenuSection>
            <MenuTitle>{t('player.controls.subtitle.display-mode.title')}</MenuTitle>
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
            <MenuTitle>{t('player.controls.subtitle.background-type.title')}</MenuTitle>
            <MenuRow>
              {backgroundTypes.map(({ type, tooltip }) => (
                <MenuOption
                  key={type}
                  $active={backgroundStyle.type === type}
                  $disabled={isMaskMode}
                  disabled={isMaskMode}
                  aria-disabled={isMaskMode}
                  tabIndex={isMaskMode ? -1 : 0}
                  onClick={() => {
                    if (isMaskMode) {
                      return
                    }

                    handleBackgroundChange(type)
                  }}
                  title={
                    isMaskMode
                      ? t('player.controls.subtitle.mask-mode.background-locked.tooltip')
                      : tooltip
                  }
                >
                  <BackgroundPreview $type={type} />
                </MenuOption>
              ))}
            </MenuRow>
          </MenuSection>
        </CaptionsMenu>
      )}
    </ControlContainer>
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
    background: ${(p) =>
      p.$disabled
        ? p.$active
          ? 'var(--color-primary-mute)'
          : 'var(--color-background-soft)'
        : p.$active
          ? 'var(--color-primary-soft)'
          : 'var(--color-hover)'};
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
