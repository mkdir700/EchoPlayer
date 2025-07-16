import React from 'react'
import styled from 'styled-components'
import { DeleteOutlined } from '@ant-design/icons'

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void
  className?: string
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

/**
 * 删除按钮组件
 * 具有悬停显示效果的圆形删除按钮，适用于卡片覆盖层
 */
export function DeleteButton({
  onClick,
  className,
  size = 'medium',
  disabled = false
}: DeleteButtonProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(e)
  }

  return (
    <StyledDeleteButton
      className={className}
      onClick={handleClick}
      size={size}
      disabled={disabled}
      type="button"
    >
      <DeleteOutlined />
    </StyledDeleteButton>
  )
}

const StyledDeleteButton = styled.button<{ size: 'small' | 'medium' | 'large'; disabled: boolean }>`
  --delete-opacity: 0;
  --delete-scale: 0.8;
  --button-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '24px'
      case 'large':
        return '40px'
      default:
        return '32px'
    }
  }};
  --icon-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '12px'
      case 'large':
        return '16px'
      default:
        return '14px'
    }
  }};

  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--button-size);
  height: var(--button-size);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? '0.5' : 'var(--delete-opacity)')};
  transform: scale(var(--delete-scale)) translateZ(0);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  position: relative;
  z-index: 10;

  &:hover:not(:disabled) {
    background: rgba(220, 38, 38, 0.9);
    --delete-scale: 1.05;
  }

  &:active:not(:disabled) {
    --delete-scale: 0.95;
  }

  &:disabled {
    pointer-events: none;
  }

  /* 当父容器悬停时显示按钮 */
  *:hover > & {
    --delete-opacity: 1;
    --delete-scale: 1;
  }

  /* 支持直接在父元素上设置 data-hover 属性来控制显示 */
  [data-hover='true'] & {
    --delete-opacity: 1;
    --delete-scale: 1;
  }

  svg {
    font-size: var(--icon-size);
    transition: transform 0.1s ease;
  }

  /* 深色主题优化 */
  [theme-mode='dark'] & {
    background: rgba(0, 0, 0, 0.8);

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.9);
    }
  }

  /* 浅色主题优化 */
  [theme-mode='light'] & {
    background: rgba(0, 0, 0, 0.6);

    &:hover:not(:disabled) {
      background: rgba(220, 38, 38, 0.8);
    }
  }
`

export default DeleteButton
