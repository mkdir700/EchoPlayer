import React, { useState } from 'react'
import { ShortcutsSection } from '@renderer/components/Settings/ShortcutsSection'
import { DataManagementSection } from '@renderer/components/Settings/DataManagementSection'
import { SettingsNavigation } from '@renderer/components/Settings/SettingsNavigation'
import { AppearanceSection } from '@renderer/components/Settings/AppearanceSection'
import { ThirdPartyServicesSection } from '@renderer/components/Settings/ThirdPartyServicesSection'
import { UpdateSection } from '@renderer/components/Settings/UpdateSection'
import { useTheme } from '@renderer/hooks/useTheme'

/**
 * Renders the main settings page with navigation and content sections.
 *
 * Displays a sidebar for navigating between different settings categories and a main content area that shows the selected settings section. Styling is applied using theme tokens for a consistent appearance.
 *
 * @returns The settings page React element.
 */
export function SettingsPage(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState('shortcuts')
  const { styles } = useTheme()

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
      // case 'video':
      //   return <VideoConversionSection />
      case 'third-party':
        return <ThirdPartyServicesSection />
      case 'about':
        return <UpdateSection />
      default:
        return <ShortcutsSection />
    }
  }

  return (
    <div style={styles.settingsContainer}>
      {/* Horizontal Navigation */}
      <SettingsNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />

      {/* Main Content */}
      <div style={styles.settingsMainContent}>{renderMainContent()}</div>
    </div>
  )
}
