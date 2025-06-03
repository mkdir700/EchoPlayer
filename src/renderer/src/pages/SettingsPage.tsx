import React, { useState } from 'react'
import { Typography, Row, Col } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { ShortcutsSection } from '@renderer/components/Settings/ShortcutsSection'
import { DataManagementSection } from '@renderer/components/Settings/DataManagementSection'
import { SettingsNavigation } from '@renderer/components/Settings/SettingsNavigation'
// 移除未使用的导入
import { AppearanceSection } from '@renderer/components/Settings/AppearanceSection'
import { ThirdPartyServicesSection } from '@renderer/components/Settings/ThirdPartyServicesSection'
import { VideoConversionSection } from '@renderer/components/Settings/VideoConversionSection'
import { UpdateSection } from '@renderer/components/Settings/UpdateSection'

const { Title } = Typography

export function SettingsPage(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState('about')

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
    <div className="settings-page">
      <div className="settings-header">
        <SettingOutlined className="settings-icon" />
        <Title level={2} style={{ color: 'var(--text-primary)', margin: 0 }}>
          设置
        </Title>
      </div>

      <div className="settings-content">
        <Row gutter={24}>
          <Col span={6}>
            <SettingsNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
          </Col>

          <Col span={18}>
            <div className="settings-main">{renderMainContent()}</div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
