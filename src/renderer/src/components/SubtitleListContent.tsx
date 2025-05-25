import React from 'react'
import { Button, List, Space, Typography } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import { SubtitleListItem } from './SubtitleListItem'
import { formatTime } from '../utils/helpers'
import type { SubtitleItem } from '../types/shared'

const { Text } = Typography

interface SubtitleListContentProps {
  subtitles: SubtitleItem[]
  isAutoScrollEnabled: boolean
  currentSubtitleIndex: number
  currentTime: number
  subtitleListRef: React.RefObject<HTMLDivElement | null>
  onSeek: (time: number) => void
  onCenterCurrentSubtitle: () => void
}

export function SubtitleListContent({
  subtitles,
  isAutoScrollEnabled,
  currentSubtitleIndex,
  currentTime,
  subtitleListRef,
  onSeek,
  onCenterCurrentSubtitle
}: SubtitleListContentProps): React.JSX.Element {
  return (
    <div className="subtitle-list-container-no-header">
      {subtitles.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            字幕列表 ({subtitles.length})
          </Text>
          <Space>
            {/* 滚动模式状态指示器 */}
            <Text
              style={{
                fontSize: 11,
                color: isAutoScrollEnabled ? '#52c41a' : '#ff7a00',
                background: isAutoScrollEnabled ? '#f6ffed' : '#fff7e6',
                padding: '1px 6px',
                borderRadius: '4px',
                border: isAutoScrollEnabled ? '1px solid #b7eb8f' : '1px solid #ffd591'
              }}
            >
              {isAutoScrollEnabled ? '🤖 自动跟随' : '👆 手动浏览'}
            </Text>

            {currentSubtitleIndex >= 0 && (
              <Button
                size="small"
                type="text"
                onClick={onCenterCurrentSubtitle}
                title={isAutoScrollEnabled ? '定位当前字幕' : '定位当前字幕并启用自动跟随'}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  color: isAutoScrollEnabled ? '#52c41a' : '#ff7a00'
                }}
              >
                {isAutoScrollEnabled ? '🎯 定位' : '🔓 定位'}
              </Button>
            )}
          </Space>
        </div>
      )}
      <div className="subtitle-list-content" ref={subtitleListRef}>
        {subtitles.length > 0 ? (
          <List
            size="small"
            dataSource={subtitles}
            className="subtitle-list"
            renderItem={(item, index) => {
              const isActive = currentTime >= item.startTime && currentTime <= item.endTime
              return (
                <SubtitleListItem
                  key={`subtitle-${item.startTime}-${index}`}
                  item={item}
                  index={index}
                  isActive={isActive}
                  onSeek={onSeek}
                  formatTime={formatTime}
                />
              )
            }}
          />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'var(--text-muted)'
            }}
          >
            <MessageOutlined style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }} />
            <div>暂无字幕文件</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              请点击&ldquo;导入字幕&rdquo;按钮加载字幕文件
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
