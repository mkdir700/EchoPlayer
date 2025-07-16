import React from 'react'

import styles from './SidebarSection.module.css'
import { SubtitleListContent } from './SubtitleListContent/SubtitleListContent'

export function SidebarSection(): React.JSX.Element {
  return (
    <div className={styles.sidebarContainer}>
      <SubtitleListContent />
    </div>
  )
}
