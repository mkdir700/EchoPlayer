import React from 'react'

interface FullScreenSettingsPanelProps {
  visible: boolean
}

export function FullScreenSettingsPanel({
  visible
}: FullScreenSettingsPanelProps): React.JSX.Element | null {
  if (!visible) {
    return null
  }

  return <></>
}
