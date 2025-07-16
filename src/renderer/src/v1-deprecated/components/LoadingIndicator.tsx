import { Space, Typography } from 'antd'
import React from 'react'

const { Text } = Typography

export function LoadingIndicator(): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#ffffff',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '16px 24px',
        borderRadius: '8px',
        zIndex: 10
      }}
    >
      <Space>
        <div className="loading-spinner" />
        <Text style={{ color: '#ffffff' }}>正在加载视频...</Text>
      </Space>
    </div>
  )
}
