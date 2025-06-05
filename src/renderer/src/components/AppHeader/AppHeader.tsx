import React from 'react'
import { Space, Button, Typography, Tooltip } from 'antd'
import {
  HomeOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  GithubOutlined
} from '@ant-design/icons'
import { AppHeaderProps, PageType, NavigationItem } from '@renderer/types'
import { COMMON_TEST_IDS, withTestId } from '@renderer/utils/test-utils'
import { useTheme } from '@renderer/hooks/useTheme'

const { Text } = Typography

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
          height: 64, // 更高的 header 高度
          ...styles.glassEffect,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          position: 'sticky',
          top: 0,
          zIndex: token.zIndexPopupBase,
          WebkitAppRegion: 'drag',
          boxShadow: styles.cardContainer.boxShadow
        } as ExtendedCSSProperties
      }
      {...withTestId(COMMON_TEST_IDS.APP_HEADER)}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(
            90deg,
            rgba(${token.colorPrimary
              .slice(1)
              .match(/.{2}/g)
              ?.map((hex) => parseInt(hex, 16))
              .join(', ')}, 0.02) 0%,
            transparent 20%,
            transparent 80%,
            rgba(${token.colorPrimary
              .slice(1)
              .match(/.{2}/g)
              ?.map((hex) => parseInt(hex, 16))
              .join(', ')}, 0.02) 100%
          )`,
          pointerEvents: 'none'
        }}
      />

      {/* 左侧：应用图标和名称 */}
      <div
        style={
          {
            display: 'flex',
            alignItems: 'center',
            paddingLeft: token.paddingLG,
            flex: '0 0 240px',
            WebkitAppRegion: 'no-drag',
            zIndex: 1
          } as ExtendedCSSProperties
        }
      >
        <Text
          style={{
            fontSize: token.fontSizeLG,
            fontWeight: 700,
            background: styles.gradientText.background,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          EchoLab
        </Text>
      </div>

      {/* 中间：导航按钮 */}
      <div
        style={
          {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitAppRegion: 'no-drag',
            zIndex: 1
          } as ExtendedCSSProperties
        }
      >
        <Space size={token.marginLG}>
          {navigationItems.map((item) => (
            <Button
              key={item.key}
              type="text"
              icon={item.icon}
              onClick={() => onPageChange(item.key as PageType)}
              style={{
                height: 40,
                borderRadius: token.borderRadiusLG,
                fontSize: token.fontSize,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: token.marginXS,
                padding: `0 ${token.paddingMD}px`,
                transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
                ...(currentPage === item.key
                  ? {
                      background: utils.hexToRgba(token.colorPrimary, 0.15),
                      color: token.colorPrimary,
                      boxShadow: `0 2px 8px ${utils.hexToRgba(token.colorPrimary, 0.2)}`
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

      {/* 右侧：辅助功能按钮 */}
      <div
        style={
          {
            display: 'flex',
            alignItems: 'center',
            paddingRight: token.paddingLG,
            gap: token.marginSM,
            flex: '0 0 240px',
            justifyContent: 'flex-end',
            WebkitAppRegion: 'no-drag',
            zIndex: 1
          } as ExtendedCSSProperties
        }
      >
        <Tooltip title="帮助文档">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            shape="circle"
            style={{
              color: token.colorTextSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
        <Tooltip title="GitHub 仓库">
          <Button
            type="text"
            icon={<GithubOutlined />}
            shape="circle"
            style={{
              color: token.colorTextSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
      </div>
    </div>
  )
}
