import React from 'react'
import { SidebarSection } from '../SidebarSection'
import { useUIStore } from '@renderer/stores'

export function SidebarSectionContainer(): React.JSX.Element {
  // 获取字幕列表显示状态
  const showSubtitleList = useUIStore((state) => state.showSubtitleList)

  // 简化内部动画，主要的动画由父容器控制
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: showSubtitleList ? 1 : 0,
    pointerEvents: showSubtitleList ? 'auto' : 'none',
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  return (
    <div style={containerStyle}>
      <SidebarSection />
    </div>
  )
}
