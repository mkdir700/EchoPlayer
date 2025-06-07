import React, { useMemo, useState, useEffect } from 'react'
import { Button, Tooltip, Space } from 'antd'
import { HomeOutlined, SettingOutlined, HeartOutlined } from '@ant-design/icons'
import { AppHeaderProps, PageType, NavigationItem } from '@renderer/types'
import { COMMON_TEST_IDS, withTestId } from '@renderer/utils/test-utils'
import { useTheme } from '@renderer/hooks/useTheme'
import { useAppConfig } from '@renderer/hooks/useAppConfig'

// 导航菜单配置 - 主要功能页面
const navigationItems: NavigationItem[] = [
  { key: 'home', label: '首页', icon: <HomeOutlined /> },
  { key: 'favorites', label: '收藏夹', icon: <HeartOutlined /> }
]

// 底部功能按钮配置 - 设置和辅助功能
const bottomItems: NavigationItem[] = [
  { key: 'settings', label: '设置', icon: <SettingOutlined /> }
]

// 扩展 CSS 属性类型以支持 WebkitAppRegion
interface ExtendedCSSProperties extends React.CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

/**
 * App Sidebar Component - 应用侧边栏组件
 *
 * 为桌面应用提供侧边栏导航，符合桌面软件的交互模式。
 * 采用图标为主的设计，配合 tooltip 提示，节省空间的同时保持清晰的导航。
 *
 * Features:
 * - 毛玻璃效果的现代化设计
 * - 图标驱动的导航菜单
 * - 品牌标识位于顶部
 * - 辅助功能按钮位于底部
 * - 完整的主题系统集成
 *
 * @param currentPage - 当前活跃的页面标识
 * @param onPageChange - 页面切换回调函数
 */
export function AppSidebar({ currentPage, onPageChange }: AppHeaderProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()
  const { useWindowFrame } = useAppConfig()
  const [platform, setPlatform] = useState<string>('')

  // 获取平台信息 / Get platform information
  useEffect(() => {
    const initializePlatform = async (): Promise<void> => {
      try {
        const platformInfo = await window.api.window.getPlatform()
        setPlatform(platformInfo)
      } catch (error) {
        console.error('获取平台信息失败:', error)
      }
    }

    initializePlatform()
  }, [])

  // 计算主题色的 RGBA 变体
  const primaryRGBA15 = useMemo(
    () => utils.hexToRgba(token.colorPrimary, 0.15),
    [utils, token.colorPrimary]
  )

  const primaryRGBA20 = useMemo(
    () => utils.hexToRgba(token.colorPrimary, 0.2),
    [utils, token.colorPrimary]
  )

  // 侧边栏容器样式
  const sidebarStyle = useMemo(
    () =>
      ({
        width: 80, // 紧凑的侧边栏宽度
        height: '100vh',
        ...styles.glassEffect,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: token.zIndexPopupBase,
        WebkitAppRegion: 'no-drag',
        boxShadow: styles.cardContainer.boxShadow
      }) as ExtendedCSSProperties,
    [
      styles.glassEffect,
      styles.cardContainer.boxShadow,
      token.colorBorderSecondary,
      token.zIndexPopupBase
    ]
  )

  // 导航区域样式
  const navigationSectionStyle = useMemo(() => {
    // 判断是否为 Mac 并且启用了沉浸式标题栏 / Check if it's Mac and immersive title bar is enabled
    const isMacWithImmersiveTitleBar = platform === 'darwin' && !useWindowFrame

    return {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      // 在 macOS 沉浸式标题栏模式下，调整 padding 配置
      // Adjust padding configuration in macOS immersive title bar mode
      padding: isMacWithImmersiveTitleBar
        ? `60px ${token.paddingLG}px ${token.paddingMD}px`
        : `60px ${token.paddingMD}px ${token.paddingLG}px`,
      gap: token.marginMD
    }
  }, [platform, useWindowFrame, token.paddingLG, token.paddingMD, token.marginMD])

  // 底部辅助功能区域样式
  const auxiliarySectionStyle = useMemo(
    () => ({
      padding: `${token.paddingMD}px`,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginMD,
      borderTop: `1px solid ${token.colorBorderSecondary}`
    }),
    [token.paddingMD, token.marginMD, token.colorBorderSecondary]
  )

  // 导航按钮样式 - 基于主题系统的预定义样式
  const getNavigationButtonStyle = useMemo(
    () => (isActive: boolean) => ({
      ...styles.sidebarIcon,
      width: 48,
      height: 48,
      borderRadius: token.borderRadiusLG,
      border: 'none',
      ...(isActive
        ? {
            background: primaryRGBA15,
            color: token.colorPrimary,
            boxShadow: `0 2px 8px ${primaryRGBA20}`
          }
        : {
            background: 'transparent',
            color: token.colorTextSecondary
          })
    }),
    [
      styles.sidebarIcon,
      token.borderRadiusLG,
      token.colorPrimary,
      token.colorTextSecondary,
      primaryRGBA15,
      primaryRGBA20
    ]
  )

  return (
    <div style={sidebarStyle} {...withTestId(COMMON_TEST_IDS.APP_HEADER)}>
      {/* 导航菜单区域 */}
      <div style={navigationSectionStyle}>
        <Space direction="vertical" size={token.marginMD}>
          {navigationItems.map((item) => {
            // 收藏夹功能正在开发中 - Favorites feature is under development
            const isDisabled = item.key === 'favorites'
            const tooltipTitle = isDisabled ? '积极开发中^_^' : item.label

            return (
              <Tooltip key={item.key} title={tooltipTitle} placement="right" mouseEnterDelay={0.5}>
                <Button
                  type="text"
                  icon={item.icon}
                  disabled={isDisabled}
                  onClick={isDisabled ? undefined : () => onPageChange(item.key as PageType)}
                  style={{
                    ...getNavigationButtonStyle(currentPage === item.key),
                    ...(isDisabled && {
                      opacity: 0.5,
                      cursor: 'not-allowed'
                    })
                  }}
                />
              </Tooltip>
            )
          })}
        </Space>
      </div>

      {/* 底部辅助功能区域 */}
      <div style={auxiliarySectionStyle}>
        {/* 设置按钮 */}
        {bottomItems.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.5}>
            <Button
              type="text"
              icon={item.icon}
              onClick={() => onPageChange(item.key as PageType)}
              style={getNavigationButtonStyle(currentPage === item.key)}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
