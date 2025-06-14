import React, { useState, useCallback } from 'react'
import { SETTINGS_SECTIONS } from '@renderer/constants/settings'
import { useTheme } from '@renderer/hooks/useTheme'
import { UpdateNotificationBadge } from '@renderer/components/UpdateNotificationBadge/UpdateNotificationBadge'
import { useIsShowRedDot } from '@renderer/stores/slices/updateNotificationStore'

interface SettingsNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

/**
 * Renders a horizontal themed navigation menu for selecting settings sections.
 *
 * Displays a horizontal list of settings sections with icons and labels, with interactive highlighting for the active and hovered items. Invokes a callback when a section is selected.
 *
 * @param activeSection - The key of the currently active settings section.
 * @param onSectionChange - Callback invoked with the key of the selected section when a navigation item is clicked.
 * @param className - Optional additional CSS class for the root navigation element.
 * @returns The rendered horizontal navigation menu as a React element.
 */
export function SettingsNavigation({
  activeSection,
  onSectionChange,
  className
}: SettingsNavigationProps): React.JSX.Element {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { styles } = useTheme()

  // 使用红点可见性而不是 hasNewVersion / Use red dot visibility instead of hasNewVersion
  const isShowUpdateRedDot = useIsShowRedDot('update_available')

  // 优化事件处理函数，避免重新创建
  const handleMouseEnter = useCallback((key: string) => {
    setHoveredItem(key)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null)
  }, [])

  const handleClick = useCallback(
    (key: string) => {
      onSectionChange(key)
    },
    [onSectionChange]
  )

  return (
    <nav className={className} style={styles.horizontalNavContainer}>
      {SETTINGS_SECTIONS.map((item) => {
        const isActive = activeSection === item.key
        const isHovered = hoveredItem === item.key && !isActive

        // 预计算样式，避免在每次渲染时重新计算
        const itemStyle = {
          ...styles.horizontalNavItem,
          ...(isActive ? styles.horizontalNavItemActive : {}),
          ...(isHovered ? styles.horizontalNavItemHover : {})
        }

        const iconStyle = styles.horizontalNavIcon
        const labelStyle = styles.horizontalNavLabel

        return (
          <UpdateNotificationBadge
            key={item.key}
            showDot={item.key === 'about' && isShowUpdateRedDot}
            offset={[8, 0]}
          >
            <div
              className="settings-nav-item"
              style={itemStyle}
              onClick={() => handleClick(item.key)}
              onMouseEnter={() => handleMouseEnter(item.key)}
              onMouseLeave={handleMouseLeave}
            >
              <div style={iconStyle}>{item.icon}</div>
              <span style={labelStyle}>{item.label}</span>
            </div>
          </UpdateNotificationBadge>
        )
      })}
    </nav>
  )
}
