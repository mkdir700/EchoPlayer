/**
 * 智能文本内容组件
 * Smart text content component with adaptive segmentation and rendering
 */

import React, { useState, useEffect, useRef } from 'react'
import { Typography } from 'antd'
import { segmentText } from '@renderer/utils/subtitleTextSegmentation'
import { TextRenderer } from './TextRenderer'

const { Text } = Typography

export interface SmartTextContentProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

/**
 * 智能文本组件 - 自动处理文本分段和溢出检测
 * Smart text component - Automatically handles text segmentation and overflow detection
 */
export const SmartTextContent: React.FC<SmartTextContentProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [needsSegmentation, setNeedsSegmentation] = useState(false)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Use ResizeObserver to monitor container size changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerDimensions((prev) => {
          // Only update if dimensions actually changed to avoid unnecessary re-renders
          if (prev.width !== width || prev.height !== height) {
            return { width, height }
          }
          return prev
        })
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      // 检查文本是否超出容器 / Check if text overflows container
      const isOverflowing =
        textRef.current.scrollWidth > containerRef.current.clientWidth ||
        textRef.current.scrollHeight > containerRef.current.clientHeight

      // 如果文本长度超过阈值或者溢出，则需要分段 / Need segmentation if text length exceeds threshold or overflows
      setNeedsSegmentation(isOverflowing || text.length > 50)
    }
  }, [text, containerDimensions, style.fontSize])

  if (!needsSegmentation) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Text ref={textRef} style={style}>
          <TextRenderer
            text={text}
            onWordHover={onWordHover}
            onWordClick={onWordClick}
            enableTextSelection={enableTextSelection}
            onSelectionChange={onSelectionChange}
          />
        </Text>
      </div>
    )
  }

  // 如果需要分段，使用智能分段逻辑 / If segmentation is needed, use smart segmentation logic
  const segments = segmentText(text)

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            ...style,
            fontSize:
              segments.length > 1
                ? `calc(${parseFloat(style.fontSize as string) * (1 - 0.1 * Math.min(segments.length - 1, 2))}rem)`
                : style.fontSize,
            marginBottom: index < segments.length - 1 ? '4px' : 0,
            lineHeight: segments.length > 1 ? 1.3 : style.lineHeight || 'inherit',
            textAlign: 'center',
            width: '100%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          <TextRenderer
            text={segment}
            onWordHover={onWordHover}
            onWordClick={onWordClick}
            enableTextSelection={enableTextSelection}
            onSelectionChange={onSelectionChange}
          />
        </div>
      ))}
    </div>
  )
}

SmartTextContent.displayName = 'SmartTextContent'
