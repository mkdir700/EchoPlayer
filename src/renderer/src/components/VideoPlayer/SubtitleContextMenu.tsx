import React, { memo, useState } from 'react'
import { Dropdown, Button, Tooltip, Slider, Switch } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons'
import { BACKGROUND_TYPES } from '@renderer/hooks/features/subtitle/useSubtitleState'
import { useUIStore } from '@renderer/stores/slices/uiStore'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'

interface SubtitleContextMenuProps {
  visible: boolean
  position: { x: number; y: number }
  isMaskMode: boolean
  backgroundType: string
  onClose: () => void
  onMaskModeToggle: () => void
  onBackgroundTypeToggle: () => void
  onReset: () => void
  onExpand: () => void
}

/**
 * Subtitle context menu component
 * 字幕右键菜单组件
 */
const SubtitleContextMenu = memo(
  ({
    visible,
    position,
    isMaskMode,
    backgroundType,
    onClose,
    onMaskModeToggle,
    onBackgroundTypeToggle,
    onReset,
    onExpand
  }: SubtitleContextMenuProps): React.JSX.Element => {
    // Mock settings state for context menu - 右键菜单的模拟设置状态
    const [mockFontScale, setMockFontScale] = useState(1.0)

    // Get UI store state and actions - 获取UI状态和操作
    const { autoResumeAfterWordCard, setAutoResumeAfterWordCard } = useUIStore()
    const { isSubtitleLayoutLocked, setSubtitleLayoutLocked } = useVideoConfig()

    // Get current background config - 获取当前背景配置
    const currentBackgroundConfig =
      BACKGROUND_TYPES.find((bg) => bg.type === backgroundType) || BACKGROUND_TYPES[0]

    const handleMaskModeClick = (): void => {
      onMaskModeToggle()
      onClose()
    }

    const handleBackgroundTypeClick = (e: React.MouseEvent): void => {
      e.stopPropagation()
      onBackgroundTypeToggle()
      // Don't close menu to allow multiple background type switches
      // 不关闭菜单以允许多次切换背景类型
    }

    const handleResetClick = (): void => {
      onReset()
      onClose()
    }

    const handleExpandClick = (): void => {
      onExpand()
      onClose()
    }

    return (
      <Dropdown
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            onClose()
          }
        }}
        popupRender={() => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Main menu container - 主菜单容器 */}
            <div
              style={{
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                borderRadius: '8px',
                padding: '12px',
                minWidth: '200px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Settings section - 设置区域 */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    marginBottom: '8px',
                    fontWeight: 500
                  }}
                >
                  字幕设置
                </div>

                {/* Font scale slider - 字体大小滑块 */}
                <div style={{ marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    字体大小: {Math.round(mockFontScale * 100)}%
                  </div>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={mockFontScale}
                    onChange={setMockFontScale}
                    trackStyle={{ backgroundColor: '#1890ff' }}
                    handleStyle={{ borderColor: '#1890ff' }}
                    railStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  />
                </div>

                {/* Subtitle layout lock switch - 锁定字幕布局开关 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    锁定布局
                  </span>
                  <Switch
                    size="small"
                    checked={isSubtitleLayoutLocked}
                    onChange={setSubtitleLayoutLocked}
                  />
                </div>

                {/* Auto resume after word card switch - 查词后自动恢复播放开关 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px'
                    }}
                  >
                    自动恢复播放
                  </span>
                  <Switch
                    size="small"
                    checked={autoResumeAfterWordCard}
                    onChange={setAutoResumeAfterWordCard}
                  />
                </div>
              </div>

              {/* Divider - 分隔线 */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  margin: '8px 0'
                }}
              />

              {/* Action buttons - 操作按钮 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}
              >
                <Tooltip title={`遮罩模式: ${isMaskMode ? '开启' : '关闭'}`}>
                  <Button
                    type={isMaskMode ? 'primary' : 'text'}
                    size="small"
                    onClick={handleMaskModeClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: isMaskMode ? undefined : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isMaskMode ? undefined : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {isMaskMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </Button>
                </Tooltip>

                <Tooltip title={`背景类型: ${currentBackgroundConfig.label}`}>
                  <Button
                    type="text"
                    size="small"
                    onClick={handleBackgroundTypeClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>{currentBackgroundConfig.icon}</span>
                  </Button>
                </Tooltip>

                <Tooltip title={isSubtitleLayoutLocked ? '布局已锁定，无法重置' : '重置位置和大小'}>
                  <Button
                    type="text"
                    size="small"
                    onClick={handleResetClick}
                    disabled={isSubtitleLayoutLocked}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: isSubtitleLayoutLocked
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isSubtitleLayoutLocked
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.2)',
                      cursor: isSubtitleLayoutLocked ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span>↺</span>
                  </Button>
                </Tooltip>

                <Tooltip title="铺满左右区域">
                  <Button
                    type="text"
                    size="small"
                    onClick={handleExpandClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>↔</span>
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Close button outside menu - 菜单外部的关闭按钮 */}
            <div style={{ marginTop: '8px' }}>
              <Tooltip>
                <Button
                  type="text"
                  size="small"
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <CloseOutlined />
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
        trigger={[]}
      >
        <div
          style={{
            position: 'fixed',
            // Center the close button at the cursor position - 让关闭按钮居中对齐到光标位置
            // Menu width is ~200px, close button is 28px, so offset by ~100px to center horizontally
            // Menu height is ~180px, close button is 28px and 8px margin, so offset by ~180px to center vertically
            left: position.x - 100, // Offset to center horizontally - 水平居中偏移
            top: position.y - 194, // Offset to position close button at cursor - 垂直偏移让关闭按钮对齐光标
            width: 1,
            height: 1,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      </Dropdown>
    )
  }
)

SubtitleContextMenu.displayName = 'SubtitleContextMenu'

export { SubtitleContextMenu }
