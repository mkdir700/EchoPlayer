import React, { useCallback } from 'react'
import { Typography } from 'antd'
import { SubtitleListItemProps } from '@renderer/types'
import { useTheme } from '@renderer/hooks/useTheme'
import { COMPONENT_TOKENS } from '@renderer/styles/theme'

const { Text } = Typography

// 自定义比较函数，确保 isActive 变化时重新渲染
const arePropsEqual = (
  prevProps: SubtitleListItemProps,
  nextProps: SubtitleListItemProps
): boolean => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.item.startTime === nextProps.item.startTime &&
    prevProps.item.endTime === nextProps.item.endTime &&
    prevProps.item.text === nextProps.item.text &&
    prevProps.index === nextProps.index
  )
}

// 字幕项组件 - 适配 react-virtualized，使用React.memo避免不必要的重渲染
export const SubtitleListItem = React.memo<SubtitleListItemProps>(
  ({ item, index, isActive, onClick, formatTime }) => {
    const { token, styles } = useTheme()
    const [isHovered, setIsHovered] = React.useState(false)

    const handleClick = useCallback((): void => {
      onClick(item.startTime, index)
    }, [item.startTime, index, onClick])

    // 使用主题预定义样式
    const itemStyle = {
      ...styles.subtitleListItem,
      ...(isActive ? styles.subtitleListItemActive : {}),
      ...(!isActive && isHovered ? styles.subtitleListItemHover : {})
    }

    // 时间文字样式
    const timeTextStyle = {
      ...styles.subtitleListItemTime,
      color: isActive ? token.colorPrimary : token.colorTextTertiary,
      fontWeight: isActive ? COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_WEIGHT : 'normal'
    }

    // 字幕文本样式
    const subtitleTextStyle = {
      ...styles.subtitleListItemText,
      color: isActive ? token.colorText : token.colorTextSecondary,
      fontWeight: isActive ? COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_WEIGHT : 'normal'
    }

    return (
      <div
        key={index}
        className="subtitle-list-item"
        style={{
          ...itemStyle,
          // 额外的focus禁用样式，覆盖任何可能的默认样式 / Additional focus-disable styles
          outline: 'none !important',
          boxShadow: itemStyle.boxShadow // 保持原有的阴影效果
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={(e) => e.target.blur()} // 立即移除焦点 / Immediately remove focus
        role="button"
        tabIndex={-1} // 禁用键盘焦点 / Disable keyboard focus
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* 激活状态的左侧指示条 */}
        {isActive && <div style={styles.subtitleListItemIndicator} />}

        <div style={{ width: '100%' }}>
          {/* 时间显示行 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}
          >
            <Text style={timeTextStyle}>{formatTime(item.startTime)}</Text>
            <Text style={timeTextStyle}>{formatTime(item.endTime)}</Text>
          </div>

          {/* 字幕文本 */}
          <div style={subtitleTextStyle}>{item.text}</div>

          {/* NOTE: 仅展示要学习的语言，不展示母语 */}
          {/* 显示中文字幕（如果有双语字幕） */}
          {/* {item.chineseText && item.englishText && (
            <Text
              style={{
                fontSize: FONT_SIZES.XS,
                color: isActive ? token.colorTextSecondary : token.colorTextTertiary,
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
  },
  arePropsEqual // 使用自定义比较函数
)

SubtitleListItem.displayName = 'SubtitleListItem'
