import React, { useCallback } from 'react'
import { Typography } from 'antd'
import { SubtitleListItemProps } from '@renderer/types'
import styles from './SubtitleListItem.module.css'

const { Text } = Typography

// 字幕项组件 - 适配 react-virtualized，使用React.memo避免不必要的重渲染
export const SubtitleListItem = React.memo<SubtitleListItemProps>(
  ({ item, index, isActive, onClick, formatTime }) => {
    const handleClick = useCallback((): void => {
      onClick(item.startTime)
    }, [item.startTime, onClick])

    return (
      <div
        key={index}
        className={`${styles.subtitleItem} ${isActive ? styles.subtitleItemActive : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        style={{
          cursor: 'pointer'
        }}
      >
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {formatTime(item.startTime)}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: isActive ? 'var(--accent-color)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              {formatTime(item.endTime)}
            </Text>
          </div>
          <div
            className={styles.subtitleText}
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 'bold' : 'normal'
            }}
          >
            {item.text}
          </div>
          {/* NOTE: 仅展示要学习的语言，不展示母语 */}
          {/* 显示中文字幕（如果有双语字幕） */}
          {/* {item.chineseText && item.englishText && (
            <Text
              style={{
                fontSize: 12,
                color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontStyle: 'italic',
                lineHeight: '1.3',
                marginTop: '2px',
                display: 'block'
              }}
            >
              {item.chineseText}
            </Text>
          )} */}
        </div>
      </div>
    )
  }
)

SubtitleListItem.displayName = 'SubtitleListItem'
