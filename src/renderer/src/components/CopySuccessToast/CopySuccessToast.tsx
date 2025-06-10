import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@renderer/hooks/useTheme'

interface CopySuccessToastProps {
  /** 是否显示提示 */
  visible: boolean
  /** 鼠标位置 */
  position: { x: number; y: number }
  /** 复制的文本内容（用于显示预览） */
  copiedText?: string
  /** 显示完成后的回调 */
  onComplete?: () => void
}

/**
 * 复制成功提示组件 / Copy success toast component
 *
 * 在光标位置显示复制成功的动画提示
 * Shows animated copy success feedback at cursor position
 */
export const CopySuccessToast: React.FC<CopySuccessToastProps> = ({
  visible,
  position,
  copiedText,
  onComplete
}) => {
  const { token } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // 动画持续时间 / Animation duration
  const ANIMATION_DURATION = 2000 // 2秒

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      // 延迟一帧开始动画，确保DOM已渲染 / Delay animation by one frame to ensure DOM is rendered
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })

      // 动画结束后清理 / Cleanup after animation ends
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setShouldRender(false)
          onComplete?.()
        }, 300) // 等待淡出动画完成 / Wait for fade out animation to complete
      }, ANIMATION_DURATION)

      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      setShouldRender(false)
    }
  }, [visible, onComplete])

  if (!shouldRender) {
    return null
  }

  // 计算提示框位置，避免超出屏幕边界 / Calculate toast position, avoid screen boundaries
  const adjustedPosition = {
    x: Math.min(Math.max(position.x, 20), window.innerWidth - 200),
    y: Math.max(position.y - 60, 20) // 在光标上方显示 / Show above cursor
  }

  // 截取文本预览 / Truncate text preview
  const textPreview = copiedText
    ? copiedText.length > 20
      ? `${copiedText.substring(0, 20)}...`
      : copiedText
    : ''

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    left: adjustedPosition.x,
    top: adjustedPosition.y,
    zIndex: 9999,
    background: `linear-gradient(135deg, ${token.colorSuccess} 0%, ${token.colorSuccessHover} 100%)`,
    color: token.colorWhite,
    padding: '8px 16px',
    borderRadius: token.borderRadiusLG,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    boxShadow: `0 8px 32px ${token.colorSuccess}40, 0 4px 16px rgba(0, 0, 0, 0.2)`,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${token.colorSuccess}60`,
    pointerEvents: 'none',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '300px',
    wordBreak: 'break-word',
    // 动画属性 / Animation properties
    transform: isAnimating ? 'translateY(-10px) scale(1)' : 'translateY(0px) scale(0.8)',
    opacity: isAnimating ? 1 : 0,
    transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
    // 向上浮动动画 / Floating up animation
    animation: isAnimating
      ? `copySuccessFloat ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
      : undefined
  }

  const iconStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: 1
  }

  const textStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  }

  const previewStyle: React.CSSProperties = {
    fontSize: token.fontSize * 0.85, // 使用相对大小替代不存在的 fontSizeXS
    opacity: 0.9,
    fontWeight: 400,
    fontStyle: 'italic'
  }

  // 动画关键帧样式 / Animation keyframes styles
  const keyframesStyle = `
    @keyframes copySuccessFloat {
      0% {
        transform: translateY(-10px) scale(1);
        opacity: 1;
      }
      20% {
        transform: translateY(-20px) scale(1.05);
        opacity: 1;
      }
      80% {
        transform: translateY(-30px) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(-40px) scale(0.9);
        opacity: 0;
      }
    }
  `

  const toastElement = (
    <>
      <style>{keyframesStyle}</style>
      <div style={toastStyle}>
        <span style={iconStyle}>✓</span>
        <div style={textStyle}>
          <span>复制成功</span>
          {textPreview && <span style={previewStyle}>&ldquo;{textPreview}&rdquo;</span>}
        </div>
      </div>
    </>
  )

  // 使用 Portal 渲染到 body，确保在最顶层显示 / Use Portal to render to body for top-level display
  return createPortal(toastElement, document.body)
}
