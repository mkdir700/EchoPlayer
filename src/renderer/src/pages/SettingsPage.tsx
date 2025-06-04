import React, { useState } from 'react'
import { Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { ShortcutsSection } from '@renderer/components/Settings/ShortcutsSection'
import { DataManagementSection } from '@renderer/components/Settings/DataManagementSection'
import { SettingsNavigation } from '@renderer/components/Settings/SettingsNavigation'
import { AppearanceSection } from '@renderer/components/Settings/AppearanceSection'
import { ThirdPartyServicesSection } from '@renderer/components/Settings/ThirdPartyServicesSection'
import { VideoConversionSection } from '@renderer/components/Settings/VideoConversionSection'
import { UpdateSection } from '@renderer/components/Settings/UpdateSection'
import { useTheme } from '@renderer/hooks/useTheme'

const { Title } = Typography

export function SettingsPage(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState('about')
  const { token, styles } = useTheme()

  const handleSectionChange = (section: string): void => {
    setActiveSection(section)
  }

  const renderMainContent = (): React.JSX.Element => {
    switch (activeSection) {
      case 'shortcuts':
        return <ShortcutsSection />
      case 'storage':
        return <DataManagementSection />
      case 'appearance':
        return <AppearanceSection />
      case 'video':
        return <VideoConversionSection />
      case 'dictionary':
        return <ThirdPartyServicesSection />
      case 'about':
        return <UpdateSection />
      default:
        return <ShortcutsSection />
    }
  }

  return (
    <div style={styles.settingsContainer}>
      <div style={styles.settingsLayout}>
        {/* Left Sidebar */}
        <div style={styles.settingsSidebar}>
          <div
            style={{
              padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingMD}px`,
              borderBottom: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: token.marginSM,
                marginBottom: token.marginXS
              }}
            >
              <SettingOutlined
                style={{
                  fontSize: token.fontSizeHeading3,
                  color: token.colorPrimary
                }}
              />
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: token.colorText,
                  fontWeight: 600
                }}
              >
                设置
              </Title>
            </div>
            <div
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary
              }}
            >
              配置应用偏好设置
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: `${token.paddingMD}px 0`
              // 移除独立滚动，让整个页面统一滚动
            }}
          >
            <SettingsNavigation
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            />
          </div>
        </div>

        {/* Right Content */}
        <div style={styles.settingsContent}>
          <div style={styles.settingsMain}>
            {/* Content Body */}
            <div style={styles.settingsMainContent}>{renderMainContent()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
