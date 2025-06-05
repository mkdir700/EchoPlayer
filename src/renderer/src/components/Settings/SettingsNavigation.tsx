import React, { useState, useCallback } from 'react'
import { SETTINGS_SECTIONS } from '@renderer/constants/settings'
import { useTheme } from '@renderer/hooks/useTheme'

interface SettingsNavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

/**
 * Renders a themed navigation menu for selecting settings sections.
 *
 * Displays a list of settings sections with interactive highlighting for the active and hovered items. Invokes a callback when a section is selected.
 *
 * @param activeSection - The key of the currently active settings section.
 * @param onSectionChange - Callback invoked with the key of the selected section when a navigation item is clicked.
 * @param className - Optional additional CSS class for the root navigation element.
 * @returns The rendered navigation menu as a React element.
 */
export function SettingsNavigation({
  activeSection,
  onSectionChange,
  className
}: SettingsNavigationProps): React.JSX.Element {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { token, styles } = useTheme()

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
    <nav className={className}>
      {SETTINGS_SECTIONS.map((item) => {
        const isActive = activeSection === item.key
        const isHovered = hoveredItem === item.key && !isActive

        // 预计算样式，避免在每次渲染时重新计算
        const itemStyle = {
          ...styles.sidebarItem,
          ...(isActive ? styles.sidebarItemActive : {}),
          ...(isHovered
            ? {
                backgroundColor: token.colorFillQuaternary
              }
            : {})
        }

        const iconStyle = {
          ...styles.sidebarIcon,
          color: isActive ? token.colorWhite : token.colorTextSecondary
        }

        const labelStyle = {
          ...styles.sidebarLabel,
          color: isActive ? token.colorWhite : token.colorText,
          fontWeight: isActive ? 600 : 500
        }

        return (
          <div
            key={item.key}
            className="settings-nav-item"
            style={itemStyle}
            onClick={() => handleClick(item.key)}
            onMouseEnter={() => handleMouseEnter(item.key)}
            onMouseLeave={handleMouseLeave}
          >
            <div style={iconStyle}>{item.icon}</div>
            <span style={labelStyle}>{item.label}</span>
          </div>
        )
      })}
    </nav>
  )
}
