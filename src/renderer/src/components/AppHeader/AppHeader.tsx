import React from 'react'
import { Space, Button } from 'antd'
import { HomeOutlined, SettingOutlined } from '@ant-design/icons'
import { AppHeaderProps, PageType, NavigationItem } from '@renderer/types'
import { COMMON_TEST_IDS, withTestId } from '@renderer/utils/test-utils'
import { useTheme } from '@renderer/hooks/useTheme'

// 导航菜单配置
const navigationItems: NavigationItem[] = [
  { key: 'home', label: '首页', icon: <HomeOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> }
]

// 扩展 CSS 属性类型以支持 WebkitAppRegion
interface ExtendedCSSProperties extends React.CSSProperties {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

export function AppHeader({ currentPage, onPageChange }: AppHeaderProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()

  return (
    <div
      style={
        {
          height: token.controlHeightLG + token.paddingSM, // 使用 token 计算高度
          ...styles.glassEffect,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          zIndex: token.zIndexPopupBase,
          WebkitAppRegion: 'drag'
        } as ExtendedCSSProperties
      }
      {...withTestId(COMMON_TEST_IDS.APP_HEADER)}
    >
      {/* 导航栏区域 */}
      <div
        style={
          {
            height: token.controlHeightLG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `0 ${token.paddingLG}px`,
            WebkitAppRegion: 'no-drag'
          } as ExtendedCSSProperties
        }
      >
        <Space size={token.marginLG}>
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              type={currentPage === item.key ? 'primary' : 'text'}
              icon={item.icon}
              onClick={() => onPageChange(item.key as PageType)}
              style={{
                height: token.controlHeight,
                borderRadius: token.borderRadius,
                fontSize: token.fontSizeSM,
                fontWeight: token.fontWeightStrong,
                display: 'flex',
                alignItems: 'center',
                gap: token.marginXS,
                padding: `0 ${token.paddingSM}px`,
                transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
                ...(currentPage === item.key
                  ? {
                      background: utils.hexToRgba(token.colorPrimary, 0.15),
                      borderColor: 'transparent',
                      color: token.colorPrimary
                    }
                  : {
                      color: token.colorTextSecondary
                    })
              }}
            >
              {item.label}
            </Button>
          ))}
        </Space>
      </div>
    </div>
  )
}
