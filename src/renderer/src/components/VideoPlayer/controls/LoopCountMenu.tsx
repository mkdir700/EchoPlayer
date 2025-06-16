import React from 'react'
import { Menu, InputNumber, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { LoopSettings } from '@types_/shared'

const { Text } = Typography

interface LoopCountMenuProps {
  loopSettings: LoopSettings
  onCountChange: (count: number) => void
  onClose: () => void
}

/**
 * 循环次数设置菜单组件
 * Loop count settings menu component
 */
export function LoopCountMenu({
  loopSettings,
  onCountChange,
  onClose
}: LoopCountMenuProps): React.JSX.Element {
  // 预设的循环次数选项 / Preset loop count options
  const presetCounts = [2, 3, 5, 10, 20]

  const handlePresetClick = (count: number): void => {
    onCountChange(count)
    onClose()
  }

  const handleCustomChange = (value: number | null): void => {
    if (value && value > 0 && value <= 100) {
      onCountChange(value)
    }
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'title',
      label: (
        <Text strong style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.65)' }}>
          设置循环次数 / Set Loop Count
        </Text>
      ),
      disabled: true
    },
    {
      type: 'divider'
    },
    ...presetCounts.map((count) => ({
      key: `preset-${count}`,
      label: (
        <Space>
          <span>{count} 次</span>
          {loopSettings.count === count && (
            <span style={{ color: '#1890ff', fontSize: '12px' }}>✓</span>
          )}
        </Space>
      ),
      onClick: () => handlePresetClick(count)
    })),
    {
      type: 'divider'
    },
    {
      key: 'custom',
      label: (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text style={{ fontSize: '12px' }}>自定义次数 / Custom Count:</Text>
          <InputNumber
            size="small"
            min={1}
            max={100}
            value={loopSettings.count}
            onChange={handleCustomChange}
            style={{ width: '100%' }}
            placeholder="输入次数"
            onPressEnter={onClose}
            onClick={(e) => e.stopPropagation()}
          />
        </Space>
      ),
      onClick: (e) => e.domEvent.stopPropagation()
    }
  ]

  return (
    <Menu
      items={menuItems}
      style={{
        minWidth: 180,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    />
  )
}
