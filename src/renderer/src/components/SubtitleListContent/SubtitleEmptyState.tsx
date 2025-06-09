import React, { useState, useCallback } from 'react'
import { Typography, Button, Divider, message } from 'antd'
import { CloudUploadOutlined, GlobalOutlined, InboxOutlined } from '@ant-design/icons'

import { useTheme } from '@renderer/hooks/useTheme'
import { SPACING, FONT_SIZES } from '@renderer/styles/theme'

const { Text } = Typography

// 字幕网站配置 / Subtitle websites configuration
const SUBTITLE_WEBSITES = [
  {
    name: '字幕库',
    nameEn: 'SubHD',
    url: 'https://subhd.tv/',
    icon: '🎬',
    description: '综合字幕下载站'
  },
  {
    name: 'OpenSubtitles',
    nameEn: 'OpenSubtitles',
    url: 'https://www.opensubtitles.org/',
    icon: '🌐',
    description: '国际字幕资源库'
  }
] as const
/**
 * Subtitle Empty State Component / 字幕空状态组件
 *
 * Renders the empty state interface when no subtitles are found, providing options to import or search online
 * Uses theme system for consistent styling and better maintainability
 * Supports drag and drop file import
 */
export const SubtitleEmptyState: React.FC<{
  onImport: () => Promise<void>
  onFilesDrop: (file: File) => Promise<void>
  onWebsiteClick: (url: string, name: string) => void
}> = ({ onImport, onFilesDrop, onWebsiteClick }) => {
  const { token, styles } = useTheme()
  // 导入按钮加载状态 / Import button loading state
  const [isImporting, setIsImporting] = useState(false)
  // 拖拽状态 / Drag state
  const [isDragging, setIsDragging] = useState(false)

  // 处理导入按钮点击 / Handle import button click
  const handleImportClick = useCallback(async () => {
    setIsImporting(true)
    try {
      await onImport()
    } finally {
      setIsImporting(false)
    }
  }, [onImport])

  // 验证文件类型 / Validate file type
  const isValidSubtitleFile = useCallback((file: File): boolean => {
    const validExtensions = ['.srt', '.vtt', '.json', '.ass', '.ssa']
    const fileName = file.name.toLowerCase()
    return validExtensions.some((ext) => fileName.endsWith(ext))
  }, [])

  // 拖拽事件处理 / Drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 只有当拖拽离开整个容器时才设置为 false
    // Only set to false when dragging leaves the entire container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const subtitleFile = files.find((file) => isValidSubtitleFile(file))

      if (!subtitleFile) {
        message.error('请拖拽有效的字幕文件（支持 .srt, .vtt, .json, .ass, .ssa 格式）')
        return
      }

      setIsImporting(true)
      try {
        await onFilesDrop(subtitleFile)
      } finally {
        setIsImporting(false)
      }
    },
    [isValidSubtitleFile, onFilesDrop]
  )

  // 拖拽区域样式 / Drag area styles
  const dragAreaStyle: React.CSSProperties = {
    ...styles.subtitleSearchContainer,
    backgroundColor: isDragging ? token.colorPrimaryBg : 'transparent',
    transition: 'all 0.2s ease',
    position: 'relative'
  }

  return (
    <div
      style={dragAreaStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 拖拽提示覆盖层 / Drag overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `${token.colorPrimary}10`,
            border: `2px dashed ${token.colorPrimary}`,
            borderRadius: token.borderRadiusLG,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <InboxOutlined
            style={{
              fontSize: '48px',
              color: token.colorPrimary,
              marginBottom: SPACING.SM
            }}
          />
          <Text
            style={{
              fontSize: FONT_SIZES.LG,
              color: token.colorPrimary,
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            释放以导入字幕文件
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZES.SM,
              color: token.colorTextSecondary,
              marginTop: SPACING.XS,
              textAlign: 'center'
            }}
          >
            支持 .srt, .vtt, .json, .ass, .ssa 格式
          </Text>
        </div>
      )}

      {/* 提示文本 / Prompt text */}
      <div style={{ textAlign: 'center' }}>
        <Text style={styles.subtitleSearchSubtitle}>在视频文件同目录下未找到匹配的字幕文件</Text>
        <Text
          style={{
            display: 'block',
            fontSize: FONT_SIZES.SM,
            color: token.colorTextTertiary,
            marginTop: SPACING.XS
          }}
        >
          您可以点击按钮选择文件，或直接拖拽字幕文件到此区域
        </Text>
      </div>

      {/* 操作区域 / Action area */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.MD
        }}
      >
        {/* 导入字幕按钮 / Import subtitle button */}
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleImportClick}
          loading={isImporting}
          size="large"
          style={{
            height: '44px',
            fontSize: FONT_SIZES.BASE,
            fontWeight: 500,
            borderRadius: token.borderRadius
          }}
        >
          {isImporting ? '选择字幕文件中...' : '导入字幕文件'}
        </Button>

        {/* 分割线 / Divider */}
        <Divider
          style={{
            margin: `${SPACING.XS}px 0`,
            borderColor: token.colorBorderSecondary
          }}
        >
          <Text
            style={{
              fontSize: FONT_SIZES.XS,
              color: token.colorTextTertiary,
              fontWeight: 'normal'
            }}
          >
            或者在线搜索
          </Text>
        </Divider>

        {/* 在线搜索区域 / Online search area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.SM
          }}
        >
          {/* 字幕网站按钮列表 / Subtitle website button list */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: SPACING.XS,
              width: '100%'
            }}
          >
            {SUBTITLE_WEBSITES.map((website, index) => (
              <Button
                key={index}
                type="default"
                size="small"
                icon={<GlobalOutlined />}
                onClick={() => onWebsiteClick(website.url, website.name)}
                title={website.description}
                style={{
                  height: '36px',
                  fontSize: FONT_SIZES.XS,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: `0 ${SPACING.SM}px`,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadiusSM,
                  backgroundColor: token.colorFillQuaternary,
                  color: token.colorTextSecondary,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget
                  target.style.backgroundColor = token.colorFillTertiary
                  target.style.color = token.colorText
                  target.style.borderColor = token.colorBorder
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget
                  target.style.backgroundColor = token.colorFillQuaternary
                  target.style.color = token.colorTextSecondary
                  target.style.borderColor = token.colorBorderSecondary
                }}
              >
                <span style={{ marginLeft: SPACING.XS }}>
                  {website.icon} {website.name}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 支持格式提示 / Supported format hint */}
      <Text style={styles.subtitlePromptSupportText}>支持格式：.srt, .vtt, .json, .ass, .ssa</Text>
    </div>
  )
}
