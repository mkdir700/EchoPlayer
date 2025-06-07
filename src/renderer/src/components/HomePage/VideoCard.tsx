import React from 'react'
import { Card, Tooltip, Button, Col, Typography } from 'antd'
import { VideoCameraOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'
import { formatTime } from '@renderer/utils/helpers'
import { FONT_WEIGHTS } from '@renderer/styles/theme'
import type { RecentPlayItem } from '@renderer/types'

const { Text } = Typography

interface VideoCardProps {
  item: RecentPlayItem
  isCompactMode: boolean
  onOpen: (item: RecentPlayItem) => void
  onDelete: (id: string, fileName: string) => void
  colProps: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}

/**
 * VideoCard component for displaying individual video items
 * 用于显示单个视频项目的卡片组件
 */
export function VideoCard({
  item,
  isCompactMode,
  onOpen,
  onDelete,
  colProps
}: VideoCardProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()

  return (
    <Col {...colProps}>
      <div
        onClick={() => {
          console.log('卡片被点击了！', item.fileName)
          onOpen(item)
        }}
        style={{
          cursor: 'pointer',
          transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
          transformOrigin: 'center bottom'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = styles.cardHover.boxShadow as string
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = styles.cardContainer.boxShadow as string
        }}
      >
        <Card
          size="small"
          style={{
            ...styles.cardContainer,
            border: 'none',
            overflow: 'hidden',
            height: isCompactMode ? 'auto' : '100%',
            minHeight: isCompactMode ? 200 : 280,
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{
            padding: isCompactMode ? token.paddingXS : token.paddingSM,
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          cover={
            <div
              style={{
                ...styles.videoPoster,
                height: isCompactMode ? 120 : 180, // 紧凑模式120px，默认模式180px
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: utils.generatePosterBackground(item.fileName),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <VideoCameraOutlined
                  style={{
                    fontSize: isCompactMode ? 32 : 48,
                    color: utils.hexToRgba('#fff', 0.8)
                  }}
                />

                {/* 播放覆盖层 / Play overlay */}
                <div style={styles.playOverlay} className="play-overlay">
                  <PlayCircleOutlined
                    style={{
                      fontSize: isCompactMode ? 40 : 56,
                      color: '#fff'
                    }}
                  />
                </div>

                {/* 删除按钮 / Delete button */}
                <div
                  style={{
                    position: 'absolute',
                    top: token.paddingXS,
                    right: token.paddingXS,
                    opacity: 0,
                    transition: `opacity ${token.motionDurationMid} ease`
                  }}
                  className="delete-button"
                >
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.fileId, item.fileName)
                      }}
                      style={{
                        ...styles.deleteButton,
                        width: isCompactMode ? 24 : 32,
                        height: isCompactMode ? 24 : 32,
                        fontSize: isCompactMode ? 12 : 14
                      }}
                    />
                  </Tooltip>
                </div>

                {/* 时长标签 / Duration badge */}
                {item.duration && (
                  <div
                    style={{
                      ...styles.durationBadge,
                      fontSize: isCompactMode ? token.fontSizeSM : token.fontSize,
                      padding: isCompactMode
                        ? `${token.paddingXXS}px ${token.paddingXS}px`
                        : `${token.paddingXS}px ${token.paddingSM}px`
                    }}
                  >
                    {formatTime(item.duration)}
                  </div>
                )}

                {/* 进度条 / Progress bar */}
                {item.duration && item.duration > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: isCompactMode ? 2 : 3,
                      background: utils.hexToRgba('#fff', 0.2)
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, ((item.currentTime || 0) / item.duration) * 100))}%`,
                        background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorSuccess})`,
                        borderRadius: `0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          }
        >
          <div
            style={{
              padding: isCompactMode ? 0 : `${token.paddingXS}px 0`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <Tooltip title={item.fileName}>
                <Text
                  strong
                  ellipsis
                  style={{
                    display: 'block',
                    fontSize: isCompactMode ? token.fontSizeSM : token.fontSize,
                    fontWeight: FONT_WEIGHTS.SEMIBOLD,
                    color: token.colorText,
                    marginBottom: isCompactMode ? token.marginXXS : token.marginXS,
                    lineHeight: 1.3
                  }}
                >
                  {item.fileName.replace(/\.[^/.]+$/, '')}
                </Text>
              </Tooltip>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: token.fontSizeSM,
                  marginBottom: isCompactMode ? token.marginXS : token.marginSM
                }}
              >
                <Text
                  style={{
                    fontSize: token.fontSizeSM,
                    color: token.colorTextDescription
                  }}
                >
                  {utils.formatTimeAgo(item.lastOpenedAt)}
                </Text>
                {item.duration && item.duration > 0 && (
                  <Text
                    style={{
                      fontSize: token.fontSizeSM,
                      color: token.colorPrimary,
                      fontWeight: FONT_WEIGHTS.MEDIUM,
                      background: isCompactMode
                        ? 'transparent'
                        : utils.hexToRgba(token.colorPrimary, 0.1),
                      padding: isCompactMode ? 0 : `${token.paddingXXS}px ${token.paddingXS}px`,
                      borderRadius: isCompactMode ? 0 : token.borderRadius
                    }}
                  >
                    {Math.round(((item.currentTime || 0) / item.duration) * 100)}%
                  </Text>
                )}
              </div>
            </div>

            {/* 默认模式显示操作区域 / Action area for default mode */}
            {!isCompactMode && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  {item.duration && item.duration > 0 ? (
                    <Text
                      style={{
                        fontSize: token.fontSizeSM,
                        color: token.colorTextSecondary
                      }}
                    >
                      {formatTime(item.currentTime || 0)} / {formatTime(item.duration)}
                    </Text>
                  ) : (
                    <Text
                      style={{
                        fontSize: token.fontSizeSM,
                        color: token.colorTextTertiary
                      }}
                    >
                      未知时长
                    </Text>
                  )}
                </div>
                <Button
                  type="text"
                  size="small"
                  style={{
                    color: token.colorPrimary,
                    fontWeight: FONT_WEIGHTS.MEDIUM,
                    height: 24,
                    fontSize: token.fontSizeSM
                  }}
                >
                  继续观看
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Col>
  )
}
