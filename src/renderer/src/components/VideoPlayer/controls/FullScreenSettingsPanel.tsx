import React from 'react'
import { Typography } from 'antd'
import styles from '../VideoControlsFullScreen.module.css'

const { Text } = Typography

interface FullScreenSettingsPanelProps {
  visible: boolean
}

export function FullScreenSettingsPanel({
  visible
}: FullScreenSettingsPanelProps): React.JSX.Element | null {
  if (!visible) {
    return null
  }

  return (
    <div className={styles.settingsPopup}>
      <div className={styles.settingsContent}>
        <Text className={styles.settingsTitle}>播放设置</Text>
        <div className={styles.settingsItem}>
          <Text className={styles.settingsLabel}>更多功能即将推出...</Text>
        </div>
      </div>
    </div>
  )
}
