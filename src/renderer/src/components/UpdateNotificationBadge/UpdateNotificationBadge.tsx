import React from 'react'
import { Badge } from 'antd'

interface UpdateNotificationBadgeProps {
  /**
   * 是否显示红点通知 / Whether to show the red dot notification
   */
  showDot: boolean
  /**
   * 子组件 / Child component to wrap with the badge
   */
  children: React.ReactNode
  /**
   * 自定义样式 / Custom styles
   */
  style?: React.CSSProperties
  /**
   * Badge的偏移量 / Badge offset
   */
  offset?: [number, number]
}

/**
 * 更新通知红点组件 / Update Notification Badge Component
 *
 * 基于Ant Design的Badge组件实现的可复用红点通知组件。
 * 用于在UI元素上显示新版本可用的红点提示。
 *
 * A reusable red dot notification component based on Ant Design's Badge component.
 * Used to display red dot hints for new version availability on UI elements.
 *
 * Features:
 * - 使用Ant Design Badge组件，确保主题一致性 / Uses Ant Design Badge for theme consistency
 * - 支持自定义偏移量和样式 / Supports custom offset and styles
 * - 自动适配明暗主题 / Automatically adapts to light/dark themes
 * - 轻量级且易于集成 / Lightweight and easy to integrate
 *
 * @param showDot - 控制红点显示的布尔值 / Boolean to control red dot visibility
 * @param children - 要包装的子组件 / Child component to wrap
 * @param style - 自定义样式 / Custom styles
 * @param offset - Badge偏移量 / Badge offset
 */
export function UpdateNotificationBadge({
  showDot,
  children,
  style,
  offset
}: UpdateNotificationBadgeProps): React.JSX.Element {
  return (
    <Badge
      dot={showDot}
      offset={offset}
      style={{
        ...style,
        // 确保红点可见的调试样式 / Debug styles to ensure red dot visibility
        ...(showDot &&
          ({
            '--ant-badge-dot-size': '8px',
            '--ant-badge-color': '#ff4d4f'
          } as React.CSSProperties))
      }}
    >
      {children}
    </Badge>
  )
}

export default UpdateNotificationBadge
