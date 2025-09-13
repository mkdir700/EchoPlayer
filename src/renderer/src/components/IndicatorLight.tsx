import React from 'react'
import styled, { css, keyframes } from 'styled-components'

interface IndicatorLightProps {
  /**
   * Color of the indicator light
   * 指示灯的颜色
   */
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'gray' | string

  /**
   * Size of the indicator light
   * 指示灯的大小
   */
  size?: number

  /**
   * Whether the light should pulse/animate
   * 是否显示脉动动画
   */
  pulsing?: boolean

  /**
   * Additional className for styling
   * 额外的样式类名
   */
  className?: string
}

const pulse = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

const IndicatorLightContainer = styled.div<{
  $color: string
  $size: number
  $pulsing: boolean
}>`
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  display: inline-block;
  margin-left: 8px;
  box-shadow: 0 0 4px ${(props) => props.$color}33;

  ${(props) =>
    props.$pulsing &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`

const colorMap = {
  red: '#ff4757',
  green: '#2ed573',
  yellow: '#ffa502',
  blue: '#3742fa',
  gray: '#747d8c'
}

/**
 * IndicatorLight Component
 * 状态指示灯组件
 *
 * Used to display status indicators with different colors
 * 用于显示不同颜色的状态指示器
 */
const IndicatorLight: React.FC<IndicatorLightProps> = ({
  color = 'gray',
  size = 8,
  pulsing = false,
  className
}) => {
  const resolvedColor = color in colorMap ? colorMap[color as keyof typeof colorMap] : color

  return (
    <IndicatorLightContainer
      $color={resolvedColor}
      $size={size}
      $pulsing={pulsing}
      className={className}
    />
  )
}

export default IndicatorLight
