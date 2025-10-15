import { SPACING } from '@renderer/infrastructure/styles/theme'
import { FC, memo } from 'react'
import styled from 'styled-components'

interface HighlightedTextProps {
  text: string
  query: string
}

/**
 * 高亮显示文本中匹配的关键词
 * @param text 原始文本
 * @param query 搜索关键词
 */
const HighlightedText: FC<HighlightedTextProps> = memo(({ text, query }) => {
  if (!query.trim()) {
    return <>{text}</>
  }

  try {
    // 创建正则表达式，匹配所有关键词（不区分大小写）
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, index) => {
          // 检查是否为匹配的关键词
          if (part.toLowerCase() === query.toLowerCase()) {
            return <Highlight key={index}>{part}</Highlight>
          }
          return <span key={index}>{part}</span>
        })}
      </>
    )
  } catch (error) {
    // 如果正则表达式出错，返回原始文本
    return <>{text}</>
  }
})

HighlightedText.displayName = 'HighlightedText'

export default HighlightedText

const Highlight = styled.mark`
  background-color: var(--ant-color-warning-bg, #fffbe6);
  color: var(--ant-color-text, #000000);
  padding: ${SPACING.XXS / 2}px 0;
  border-radius: ${SPACING.XXS / 2}px;
  font-weight: 500;

  /* 深色主题下的高亮样式 */
  [theme-mode='dark'] & {
    background-color: rgba(250, 173, 20, 0.25);
    color: var(--ant-color-warning, #faad14);
  }
`
