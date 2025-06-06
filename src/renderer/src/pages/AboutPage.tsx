import React from 'react'
import { Typography, Space, Divider } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'

const { Title, Text, Paragraph } = Typography

export function AboutPage(): React.JSX.Element {
  const { token } = useTheme()

  return (
    <div
      style={{
        padding: token.paddingXL,
        maxWidth: '800px',
        margin: '0 auto'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <InfoCircleOutlined
            style={{
              fontSize: 64,
              color: token.colorPrimary,
              marginBottom: token.marginMD
            }}
          />
          <Title level={2} style={{ color: token.colorText }}>
            关于 EchoLab
          </Title>
        </div>

        <Divider />

        <div>
          <Title level={4} style={{ color: token.colorText }}>
            产品介绍
          </Title>
          <Paragraph
            style={{
              color: token.colorTextSecondary,
              fontSize: token.fontSizeLG
            }}
          >
            EchoLab 是一款专业的视频字幕学习工具，旨在帮助用户通过视频内容进行语言学习和字幕制作。
          </Paragraph>
        </div>

        <div>
          <Title level={4} style={{ color: token.colorText }}>
            主要功能
          </Title>
          <Paragraph
            style={{
              color: token.colorTextSecondary,
              fontSize: token.fontSizeLG
            }}
          >
            • 视频播放与字幕同步显示
            <br />
            • 单句循环播放功能
            <br />
            • 自动暂停与手动控制
            <br />
            • 多种字幕显示模式
            <br />• 快捷键操作支持
          </Paragraph>
        </div>

        <div>
          <Title level={4} style={{ color: token.colorText }}>
            版本信息
          </Title>
          <Text style={{ color: token.colorTextSecondary }}>
            版本: 1.0.0
            <br />
            构建时间: 2024-01-01
          </Text>
        </div>
      </Space>
    </div>
  )
}
