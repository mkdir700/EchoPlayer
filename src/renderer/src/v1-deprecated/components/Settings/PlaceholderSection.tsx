import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { Card, Typography } from 'antd'
import React from 'react'

const { Text } = Typography

interface PlaceholderSectionProps {
  title: string
  description: string
  className?: string
}

export function PlaceholderSection({
  title,
  description,
  className
}: PlaceholderSectionProps): React.JSX.Element {
  const { token, styles } = useTheme()

  return (
    <Card
      title={title}
      className={`settings-section-card ${className || ''}`}
      style={styles.cardContainer}
    >
      <div
        style={{
          textAlign: 'center',
          padding: `${token.paddingXL}px 0`
        }}
      >
        <Text style={{ color: token.colorTextSecondary }}>{description}</Text>
      </div>
    </Card>
  )
}
