import { HeartOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { Empty, Typography } from 'antd'
import React from 'react'

const { Title, Text } = Typography

export function FavoritesPage(): React.JSX.Element {
  const { token } = useTheme()

  return (
    <div style={{ padding: token.paddingXL, textAlign: 'center' }}>
      <Empty
        image={
          <HeartOutlined
            style={{
              fontSize: 64,
              color: token.colorError
            }}
          />
        }
        description={
          <div>
            <Title level={3} style={{ color: token.colorText }}>
              收藏夹
            </Title>
            <Text style={{ color: token.colorTextSecondary }}>
              这里将显示您收藏的视频和字幕片段
            </Text>
          </div>
        }
      />
    </div>
  )
}
