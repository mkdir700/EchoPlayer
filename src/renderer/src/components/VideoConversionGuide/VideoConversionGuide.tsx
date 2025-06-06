import React from 'react'
import { Modal, Typography, Space, Button, Divider, Alert } from 'antd'
import { CopyOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { useTheme } from '@renderer/hooks/useTheme'

const { Title, Text, Paragraph } = Typography

interface VideoConversionGuideProps {
  visible: boolean
  onClose: () => void
  videoFileName?: string
}

export function VideoConversionGuide({
  visible,
  onClose,
  videoFileName
}: VideoConversionGuideProps): React.JSX.Element {
  const { token } = useTheme()
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      message.success('命令已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      message.error('复制失败，请手动复制')
    }
  }

  const ffmpegCommand = `ffmpeg -i "${videoFileName || 'input.mp4'}" -c:v libx264 -crf 23 -c:a aac "${videoFileName?.replace(/\.[^/.]+$/, '_h264.mp4') || 'output_h264.mp4'}"`

  const handbrakeSettings = {
    preset: 'Fast 1080p30',
    videoCodec: 'H.264 (x264)',
    quality: 'RF 23',
    audioCodec: 'AAC (avcodec)'
  }

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined style={{ color: '#667eea' }} />
          <span>视频格式转换指南</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={700}
      className="conversion-guide-modal"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="H.265/HEVC 兼容性问题"
          description="您的视频使用了 H.265/HEVC 编码，当前环境不支持此编解码器。建议转换为 H.264 格式以获得最佳兼容性。"
          type="warning"
          showIcon
        />

        <div>
          <Title level={4}>🎯 推荐解决方案</Title>
          <Paragraph>将视频转换为 H.264 编码的 MP4 格式，这是目前兼容性最好的视频格式。</Paragraph>
        </div>

        <Divider />

        <div>
          <Title level={4}>🛠️ 方法一：使用 FFmpeg（推荐）</Title>
          <Paragraph>FFmpeg 是一个强大的开源视频处理工具，支持几乎所有视频格式的转换。</Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Text strong>转换命令：</Text>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: token.paddingSM,
                borderRadius: token.borderRadius,
                marginTop: token.marginXS,
                fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
                fontSize: token.fontSizeSM,
                border: `1px solid rgba(255, 255, 255, 0.12)`,
                position: 'relative',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Text copyable={{ text: ffmpegCommand }} style={{ fontSize: 13 }}>
                {ffmpegCommand}
              </Text>
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(ffmpegCommand)}
                style={{ position: 'absolute', right: 8, top: 8 }}
              >
                复制
              </Button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>参数说明：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>
                <Text code>-c:v libx264</Text>：使用 H.264 视频编码器
              </li>
              <li>
                <Text code>-crf 23</Text>：设置视频质量（18-28，数值越小质量越高）
              </li>
              <li>
                <Text code>-c:a aac</Text>：使用 AAC 音频编码器
              </li>
            </ul>
          </div>

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
          <Title level={4}>🎬 方法二：使用 HandBrake（图形界面）</Title>
          <Paragraph>HandBrake 是一个免费的开源视频转换器，提供友好的图形界面。</Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Text strong>推荐设置：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>
                预设：<Text code>{handbrakeSettings.preset}</Text>
              </li>
              <li>
                视频编码器：<Text code>{handbrakeSettings.videoCodec}</Text>
              </li>
              <li>
                质量：<Text code>{handbrakeSettings.quality}</Text>
              </li>
              <li>
                音频编码器：<Text code>{handbrakeSettings.audioCodec}</Text>
              </li>
            </ul>
          </div>

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

        <Divider />

        <div>
          <Title level={4}>💡 其他建议</Title>
          <ul style={{ paddingLeft: 20 }}>
            <li>转换后的文件大小可能会增加，但兼容性更好</li>
            <li>如果原视频质量很高，可以尝试降低 CRF 值（如 20）</li>
            <li>转换过程可能需要一些时间，取决于视频长度和电脑性能</li>
            <li>建议保留原始文件作为备份</li>
          </ul>
        </div>

        <Alert
          message="技术说明"
          description="H.265/HEVC 需要付费许可证，因此许多开源软件和浏览器默认不支持。H.264 是目前最广泛支持的视频编码格式。"
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  )
}
