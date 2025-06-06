import React, { useState, useEffect } from 'react'
import { Card, Typography, Space, Button, Alert, Divider, Tag } from 'antd'
import {
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { VideoConversionGuide } from '../VideoConversionGuide/VideoConversionGuide'
import {
  generateCompatibilityReport,
  type VideoCompatibilityReport
} from '@renderer/utils/videoCompatibility'
import { useTheme } from '@renderer/hooks/useTheme'

const { Title, Text, Paragraph } = Typography

export function VideoConversionSection(): React.JSX.Element {
  const { token } = useTheme()
  const [showGuide, setShowGuide] = useState(false)
  const [compatibilityReport, setCompatibilityReport] = useState<VideoCompatibilityReport | null>(
    null
  )

  useEffect(() => {
    // 生成兼容性报告
    const report = generateCompatibilityReport()
    setCompatibilityReport(report)
  }, [])

  const renderCodecSupport = (codec: {
    name: string
    supported: boolean
    supportLevel: string
  }): React.JSX.Element => {
    const getStatusColor = (supported: boolean, level: string): string => {
      if (!supported) return 'error'
      if (level === 'probably') return 'success'
      if (level === 'maybe') return 'warning'
      return 'default'
    }

    const getStatusText = (supported: boolean, level: string): string => {
      if (!supported) return '不支持'
      if (level === 'probably') return '完全支持'
      if (level === 'maybe') return '部分支持'
      return '未知'
    }

    return (
      <div
        key={codec.name}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <Text code style={{ fontSize: 12 }}>
          {codec.name}
        </Text>
        <Tag
          color={getStatusColor(codec.supported, codec.supportLevel)}
          icon={codec.supported ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {getStatusText(codec.supported, codec.supportLevel)}
        </Tag>
      </div>
    )
  }

  return (
    <div className="video-conversion-section">
      <Title level={3} style={{ color: token.colorText, marginBottom: token.marginLG }}>
        <VideoCameraOutlined style={{ marginRight: token.marginXS }} />
        视频格式转换
      </Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 兼容性检测 */}
        <Card title="视频格式兼容性检测" size="small">
          {compatibilityReport && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>环境信息：</Text>
                <div style={{ marginTop: 8, marginLeft: 16 }}>
                  <Text>平台: {compatibilityReport.platform}</Text>
                  <br />
                  <Text>Electron 环境: {compatibilityReport.isElectron ? '是' : '否'}</Text>
                </div>
              </div>

              <Divider />

              <div>
                <Text strong>基础视频格式支持：</Text>
                <div style={{ marginTop: 8, marginLeft: 16 }}>
                  {compatibilityReport.basicFormats.map(renderCodecSupport)}
                </div>
              </div>

              <div>
                <Text strong>高级编解码器支持：</Text>
                <div style={{ marginTop: 8, marginLeft: 16 }}>
                  {compatibilityReport.advancedCodecs.map(renderCodecSupport)}
                </div>
              </div>

              {compatibilityReport.recommendations.length > 0 && (
                <>
                  <Divider />
                  <Alert
                    message="兼容性建议"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {compatibilityReport.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    }
                    type="info"
                    showIcon
                  />
                </>
              )}
            </Space>
          )}
        </Card>

        {/* H.265 支持说明 */}
        <Card title="H.265/HEVC 支持说明" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message="H.265/HEVC 兼容性限制"
              description="H.265/HEVC 编解码器需要付费许可证，因此大多数开源软件和浏览器默认不支持。如果您的视频使用 H.265 编码，可能无法正常播放。"
              type="warning"
              showIcon
            />

            <div>
              <Text strong>hev1.1.6.L93.B0 含义解析：</Text>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>
                  <Text code>hev1</Text>: H.265/HEVC 编解码器标识符
                </li>
                <li>
                  <Text code>1</Text>: Profile (配置文件) - Main Profile
                </li>
                <li>
                  <Text code>6</Text>: Tier (层级) - Main Tier
                </li>
                <li>
                  <Text code>L93</Text>: Level (级别) - Level 3.1
                </li>
                <li>
                  <Text code>B0</Text>: 其他约束和兼容性标志
                </li>
              </ul>
            </div>

            <Paragraph>
              如果您遇到 H.265 视频播放问题，建议将视频转换为 H.264
              格式，这是目前兼容性最好的视频编码格式。
            </Paragraph>
          </Space>
        </Card>

        {/* 转换工具推荐 */}
        <Card title="推荐转换工具" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Space>
                <Title level={5} style={{ margin: 0 }}>
                  FFmpeg
                </Title>
                <Tag color="blue">命令行工具</Tag>
                <Tag color="green">免费</Tag>
              </Space>
              <Paragraph style={{ marginTop: 8 }}>
                强大的开源视频处理工具，支持几乎所有视频格式的转换。适合有技术背景的用户。
              </Paragraph>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href="https://ffmpeg.org/download.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                下载 FFmpeg
              </Button>
            </div>

            <Divider />

            <div>
              <Space>
                <Title level={5} style={{ margin: 0 }}>
                  HandBrake
                </Title>
                <Tag color="blue">图形界面</Tag>
                <Tag color="green">免费</Tag>
              </Space>
              <Paragraph style={{ marginTop: 8 }}>
                免费的开源视频转换器，提供友好的图形界面。适合普通用户使用。
              </Paragraph>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                href="https://handbrake.fr/downloads.php"
                target="_blank"
                rel="noopener noreferrer"
              >
                下载 HandBrake
              </Button>
            </div>
          </Space>
        </Card>

        {/* 转换指南 */}
        <Card title="详细转换指南" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Paragraph>
              如果您需要详细的视频格式转换指导，包括具体的转换命令和参数说明，请点击下方按钮查看完整指南。
            </Paragraph>

            <Button type="primary" icon={<InfoCircleOutlined />} onClick={() => setShowGuide(true)}>
              查看详细转换指南
            </Button>
          </Space>
        </Card>
      </Space>

      {/* 转换指南弹窗 */}
      <VideoConversionGuide visible={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  )
}
