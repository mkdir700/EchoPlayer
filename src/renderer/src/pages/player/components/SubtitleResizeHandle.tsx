/**
 * SubtitleResizeHandle Component
 *
 * 独立的调整尺寸句柄组件：
 * - 只在遮罩模式下渲染
 * - 包含 Tooltip
 * - 处理鼠标事件
 * - 包含样式定义
 * - 支持主题变量适配
 */

import { ANIMATION_DURATION, EASING } from '@renderer/infrastructure/styles/theme'
import { Tooltip } from 'antd'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

export interface SubtitleResizeHandleProps {
  /** 句柄是否可见 */
  visible: boolean
  /** 鼠标按下事件处理 */
  onMouseDown: (event: React.MouseEvent) => void
  /** 双击事件处理 */
  onDoubleClick: (event: React.MouseEvent) => void
  /** 自定义 className */
  className?: string
  /** 测试 ID */
  testId?: string
}

/**
 * 调整尺寸句柄组件
 */
export const SubtitleResizeHandle = memo(function SubtitleResizeHandle({
  visible,
  onMouseDown,
  onDoubleClick,
  className,
  testId = 'subtitle-resize-handle'
}: SubtitleResizeHandleProps) {
  const { t } = useTranslation()

  if (!visible) {
    return null
  }

  return (
    <Tooltip
      title={t('settings.playback.subtitle.overlay.resizeHandle.tooltip')}
      placement="top"
      mouseEnterDelay={0.5}
      mouseLeaveDelay={0}
    >
      <ResizeHandle
        className={className}
        $visible={visible}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        data-testid={testId}
      />
    </Tooltip>
  )
})

export default SubtitleResizeHandle

// === 样式组件 ===

const ResizeHandle = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;

  /* 使用主题变量支持主题切换 */
  background: var(--ant-color-primary, rgba(102, 126, 234, 0.8));
  border: 2px solid var(--ant-color-white, rgba(255, 255, 255, 0.9));
  border-radius: 50%;
  cursor: nw-resize;

  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: all ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD};

  &:hover {
    background: var(--ant-color-primary-hover, var(--ant-color-primary));
    transform: scale(1.2);

    /* 使用主题变量 */
    box-shadow: var(--ant-box-shadow-secondary, 0 2px 8px rgba(102, 126, 234, 0.4));
  }

  &:active {
    transform: scale(1.1);
  }
`
