import React from 'react'
import {
  KeyOutlined,
  EyeOutlined,
  CloudOutlined,
  InfoCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

export interface SettingsSection {
  key: string
  label: string
  icon: React.ReactNode
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { key: 'shortcuts', label: '快捷键', icon: React.createElement(KeyOutlined) },
  { key: 'appearance', label: '外观', icon: React.createElement(EyeOutlined) },
  // { key: 'video', label: '视频转换', icon: React.createElement(VideoCameraOutlined) },
  { key: 'third-party', label: '第三方服务', icon: React.createElement(CloudOutlined) },
  { key: 'storage', label: '存储', icon: React.createElement(DatabaseOutlined) },
  { key: 'about', label: '关于', icon: React.createElement(InfoCircleOutlined) }
]
