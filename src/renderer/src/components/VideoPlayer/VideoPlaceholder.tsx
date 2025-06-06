import React from 'react'
import { Space, Typography } from 'antd'
import { VideoCameraOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'
import styles from './VideoPlayer.module.css'

const { Text } = Typography

export function VideoPlaceholder(): React.JSX.Element {
  const { token } = useTheme()

  return (
    <div className={styles.videoPlaceholder}>
      <Space direction="vertical" align="center" size="large">
        <VideoCameraOutlined
          style={{
            fontSize: 48,
            color: token.colorPrimary
          }}
        />
        <Text
          style={{
            color: token.colorTextSecondary,
            fontSize: token.fontSizeLG,
            textAlign: 'center'
          }}
        >
          拖拽视频文件到此处或点击&ldquo;打开视频&rdquo;按钮
        </Text>
        <Text
          style={{
            color: token.colorTextTertiary,
            fontSize: token.fontSize
          }}
        >
          支持 MP4, AVI, MOV, MKV 等格式
        </Text>
      </Space>
    </div>
  )
}
