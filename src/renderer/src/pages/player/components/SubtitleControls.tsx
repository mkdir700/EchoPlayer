/**
 * SubtitleControls Component
 *
 * 字幕控制组件，提供：
 * - 显示模式切换按钮（隐藏/原文/译文/双语）
 * - 背景类型选择器（透明/模糊/纯色）
 * - 悬停时显示的平滑动画
 * - 现代化的图标和视觉反馈
 *
 * 重构后使用项目特定的字幕配置
 */

import { loggerService } from '@logger'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import React, { memo, useMemo } from 'react'
import styled, { css } from 'styled-components'

import { useSubtitleOverlayIntegration } from '../hooks'

const logger = loggerService.withContext('SubtitleControls')

// === 接口定义 ===
export interface SubtitleControlsProps {
  /** 是否显示控制面板 */
  visible?: boolean
  /** 自定义类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
}

// === 组件实现 ===
export const SubtitleControls = memo(function SubtitleControls({
  visible = false,
  className,
  style
}: SubtitleControlsProps) {
  // === 集成状态（重构版） ===
  const integration = useSubtitleOverlayIntegration()

  // === 配置数据（来自当前视频项目） ===
  const currentConfig = integration.currentConfig
  const displayMode = currentConfig?.displayMode ?? SubtitleDisplayMode.NONE
  const backgroundStyle = currentConfig?.backgroundStyle ?? {
    type: SubtitleBackgroundType.BLUR,
    opacity: 0.8
  }

  // === 配置操作（通过 integration） ===
  const setDisplayMode = integration.setDisplayMode
  const setBackgroundType = integration.setBackgroundType

  // === 检查配置是否已加载 ===
  const isConfigLoaded = integration.isConfigLoaded

  // === 显示模式选项 ===
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

  // === 背景类型选项 ===
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

  // 如果配置未加载，不显示控制面板
  if (!isConfigLoaded) {
    return null
  }

  // === 事件处理器 ===
  const handleModeChange = (mode: SubtitleDisplayMode) => {
    setDisplayMode(mode)
    logger.info('字幕显示模式已切换', {
      mode,
      videoId: integration.currentVideoId
    })
  }

  const handleBackgroundChange = (type: SubtitleBackgroundType) => {
    setBackgroundType(type)
    logger.info('字幕背景类型已切换', {
      type,
      videoId: integration.currentVideoId
    })
  }

  return (
    <ControlsContainer
      $visible={visible}
      className={className}
      style={style}
      data-testid="subtitle-controls"
      aria-label="字幕控制面板"
    >
      <ControlPanel>
        {/* 显示模式控制 */}
        {displayModes.map(({ mode, label, tooltip }) => (
          <ControlButton
            key={mode}
            $active={displayMode === mode}
            $variant="mode"
            onClick={() => handleModeChange(mode)}
            aria-label={tooltip}
            data-testid={`mode-${mode}`}
          >
            {label}
            <Tooltip>{tooltip}</Tooltip>
          </ControlButton>
        ))}

        <Divider />

        {/* 背景类型控制 */}
        {backgroundTypes.map(({ type, tooltip }) => (
          <ControlButton
            key={type}
            $active={backgroundStyle.type === type}
            $variant="background"
            onClick={() => handleBackgroundChange(type)}
            aria-label={tooltip}
            data-testid={`background-${type}`}
          >
            <BackgroundPreview $type={type} />
            <Tooltip>{tooltip}</Tooltip>
          </ControlButton>
        ))}
      </ControlPanel>
    </ControlsContainer>
  )
})

export default SubtitleControls

// === 样式组件 ===
const ControlsContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: -48px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 1200;

  /* 显示隐藏动画 */
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: translateY(${(props) => (props.$visible ? 0 : 8)}px);
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out;

  /* 隐藏时阻止交互 */
  pointer-events: ${(props) => (props.$visible ? 'auto' : 'none')};
`

const ControlPanel = styled.div`
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  gap: 4px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`

const ControlButton = styled.button<{
  $active?: boolean
  $variant?: 'mode' | 'background'
}>`
  background: ${(props) =>
    props.$active ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid
    ${(props) => (props.$active ? 'rgba(102, 126, 234, 0.6)' : 'rgba(255, 255, 255, 0.1)')};
  border-radius: 6px;
  padding: 6px 8px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;

  /* 字体样式 */
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => (props.$active ? '#ffffff' : 'rgba(255, 255, 255, 0.8)')};
  text-align: center;
  user-select: none;

  /* 悬停效果 */
  &:hover {
    background: ${(props) =>
      props.$active ? 'rgba(102, 126, 234, 1)' : 'rgba(255, 255, 255, 0.15)'};
    border-color: ${(props) =>
      props.$active ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
    transform: scale(1.05);
    color: #ffffff;
  }

  /* 按下效果 */
  &:active {
    transform: scale(0.95);
  }

  /* 焦点效果 */
  &:focus {
    outline: none;
    box-shadow:
      0 0 0 2px rgba(102, 126, 234, 0.4),
      ${(props) =>
        props.$active
          ? '0 2px 8px rgba(102, 126, 234, 0.3)'
          : '0 2px 8px rgba(255, 255, 255, 0.1)'};
  }

  /* 模式按钮特殊样式 */
  ${(props) =>
    props.$variant === 'mode' &&
    css`
      min-width: 36px;
      font-size: 10px;
      line-height: 1.2;
    `}

  /* 背景按钮特殊样式 */
  ${(props) =>
    props.$variant === 'background' &&
    css`
      min-width: 28px;
      padding: 6px;
    `}
`

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
  margin: 4px 2px;
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

const Tooltip = styled.div`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 1300;

  ${ControlButton}:hover & {
    opacity: 1;
  }
`
