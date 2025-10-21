/**
 * SubtitleToast Component
 *
 * 独立的 Toast 通知组件：
 * - 接收 visible 和 message props
 * - 包含样式组件定义
 * - 支持自动隐藏逻辑
 * - 使用主题变量适配深色/浅色模式
 */

import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  EASING,
  FONT_SIZES,
  FONT_WEIGHTS,
  GLASS_EFFECT,
  SHADOWS,
  SPACING,
  Z_INDEX
} from '@renderer/infrastructure/styles/theme'
import { memo } from 'react'
import styled from 'styled-components'

export interface SubtitleToastProps {
  /** Toast 是否可见 */
  visible: boolean
  /** Toast 消息内容 */
  message: string
  /** 自动隐藏延迟时间（毫秒），0 表示不自动隐藏 */
  autoHideDelay?: number
  /** onAutoHide?: () => void - 可选的自动隐藏回调 */
}

/**
 * Toast 通知组件
 */
export const SubtitleToast = memo(function SubtitleToast({ visible, message }: SubtitleToastProps) {
  if (!visible || !message) {
    return null
  }

  return (
    <ToastContainer $visible={visible} role="status" aria-live="polite" aria-atomic="true">
      <ToastContent>{message}</ToastContent>
    </ToastContainer>
  )
})

export default SubtitleToast

// === 样式组件 ===

const ToastContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
  transition: opacity ${ANIMATION_DURATION.SLOW} ${EASING.APPLE};
  z-index: ${Z_INDEX.MODAL};
  pointer-events: none;
`

const ToastContent = styled.div`
  /* 使用 CSS 变量支持主题切换 */
  background: var(--ant-color-bg-elevated, rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}));
  color: var(--ant-color-text, #ffffff);
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  white-space: nowrap;
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.SUBTLE}px);
  border: 1px solid
    var(--ant-color-border, rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE}));
  box-shadow: var(--ant-box-shadow-secondary, ${SHADOWS.SM});
`
