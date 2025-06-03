import React from 'react'
import { Layout, Menu, Typography } from 'antd'
import { HomeOutlined, SettingOutlined } from '@ant-design/icons'
import { AppHeaderProps, PageType, NavigationItem } from '@renderer/types'
import styles from './AppHeader.module.css'
import { COMMON_TEST_IDS, withTestId } from '@renderer/utils/test-utils'

const { Header } = Layout
const { Title } = Typography

// 导航菜单配置
const navigationItems: NavigationItem[] = [
  { key: 'home', label: '首页', icon: <HomeOutlined /> },
  // { key: 'favorites', label: '收藏', icon: <HeartOutlined /> },
  // { key: 'about', label: '关于', icon: <InfoCircleOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> }
]

export function AppHeader({ currentPage, onPageChange }: AppHeaderProps): React.JSX.Element {
  return (
    <Header className={styles.header}>
      <div className={styles.headerLeft} {...withTestId(COMMON_TEST_IDS.APP_HEADER)}>
        <Title level={4} style={{ color: '#ffffff', margin: 0, flexShrink: 0 }}>
          🎬 EchoLab
        </Title>
      </div>

      {/* 导航菜单 */}
      <div className={styles.headerCenter}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          onClick={({ key }) => onPageChange(key as PageType)}
          style={{
            backgroundColor: 'transparent',
            borderBottom: 'none'
          }}
          items={navigationItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label
          }))}
        />
      </div>

      <div className={styles.headerRight}>{/* 右侧预留空间，可以放置其他功能按钮 */}</div>
    </Header>
  )
}
