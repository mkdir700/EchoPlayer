import { Typography } from 'antd'
import React from 'react'

const { Text } = Typography

interface ErrorIndicatorProps {
  error: string
}

export function ErrorIndicator({ error }: ErrorIndicatorProps): React.JSX.Element {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#ff4d4f',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '16px 24px',
        borderRadius: '8px',
        textAlign: 'center',
        zIndex: 10
      }}
    >
      <Text style={{ color: '#ff4d4f' }}>{error}</Text>
    </div>
  )
}
