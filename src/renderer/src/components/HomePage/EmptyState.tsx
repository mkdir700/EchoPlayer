import React from 'react'
import { Button, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'
import { FONT_WEIGHTS } from '@renderer/styles/theme'
// 导入测试工具 / Import test utilities
import { COMMON_TEST_IDS } from '@renderer/utils/test-utils'

const { Title, Text } = Typography

interface EmptyStateProps {
  onAddVideo: () => void
  isSelectingFile: boolean
}

/**
 * EmptyState component for displaying when no videos are available
 * 用于显示没有视频时的空状态组件
 */
export function EmptyState({ onAddVideo, isSelectingFile }: EmptyStateProps): React.JSX.Element {
  const { token, styles } = useTheme()

  return (
    <div
      style={{
        ...styles.emptyContainer,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: token.paddingXL,
        minHeight: '400px' // 给空状态一个合适的最小高度 / Give empty state appropriate minimum height
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: token.marginLG,
          opacity: 0.6
        }}
      >
        📺
      </div>
      <Title
        level={4}
        style={{
          color: token.colorText,
          fontWeight: FONT_WEIGHTS.SEMIBOLD,
          marginBottom: token.marginSM
        }}
      >
        还没有观看过任何视频
      </Title>
      <Text
        style={{
          color: token.colorTextDescription,
          fontSize: token.fontSize,
          marginBottom: token.marginLG
        }}
      >
        点击下方按钮添加您的第一个视频
      </Text>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAddVideo}
        loading={isSelectingFile}
        disabled={isSelectingFile}
        style={{ borderRadius: token.borderRadiusLG }}
        data-testid={COMMON_TEST_IDS.EMPTY_STATE_ADD_VIDEO_BUTTON}
      >
        {isSelectingFile ? '选择视频中...' : '立即添加'}
      </Button>
    </div>
  )
}
