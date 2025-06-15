import React from 'react'
import { Button, Tooltip, Dropdown } from 'antd'
import { useTheme } from '@renderer/hooks/useTheme'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { LoopIcon } from './LoopIcon'
import { CustomLoopCountModal } from './CustomLoopCountModal'
import { useLoopToggle } from './hooks/useLoopToggle'
import { loopToggleActions } from './reducers/loopToggleReducer'

interface LoopToggleButtonProps {
  isVideoLoaded: boolean
  variant?: 'compact' | 'fullscreen'
}

/**
 * 循环播放切换按钮组件，支持多种循环模式和循环次数设置
 * Loop toggle button component with support for multiple loop modes and count settings
 *
 * 功能特性 / Features:
 * - 支持关闭、单句循环、指定次数循环三种模式 / Supports off, single loop, and count loop modes
 * - 在图标中央显示循环次数或无限符号 / Displays loop count or infinity symbol in icon center
 * - 实时更新剩余循环次数 / Real-time updates of remaining loop count
 * - 支持紧凑和全屏两种显示变体 / Supports compact and fullscreen display variants
 * - 关注点分离：UI渲染与状态管理分离 / Separation of concerns: UI rendering separated from state management
 *
 * @param isVideoLoaded - 视频是否已加载 / Whether the video is loaded
 * @param variant - 显示变体：'compact' 紧凑模式，'fullscreen' 全屏模式 / Display variant
 * @returns 循环切换按钮组件 / Loop toggle button component
 */
export function LoopToggleButton({
  isVideoLoaded,
  variant = 'compact'
}: LoopToggleButtonProps): React.JSX.Element {
  const { styles } = useTheme()
  const { fileId } = usePlayingVideoContext()

  // 使用简化的统一 hook 管理所有状态和逻辑 / Use simplified unified hook to manage all state and logic
  const {
    // UI 状态 / UI state
    remainingCount,
    isMenuOpen,
    isCustomModalOpen,
    loopSettings,
    isSingleLoop,

    // 事件处理器 / Event handlers
    handleLoopToggle,
    handleCountChange,
    handleContextMenu,
    handleMenuOpenChange,
    handleCustomModalConfirm,
    handleCustomModalCancel,

    // 内部方法 / Internal methods
    dispatch
  } = useLoopToggle(fileId || '')

  // 循环播放逻辑现在由 useLoopToggle hook 内部处理 / Loop playback logic is now handled internally by useLoopToggle hook

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    const isActive = isSingleLoop

    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return {
        ...styles.fullscreenControlBtn,
        ...(isActive ? styles.fullscreenControlBtnActive : {})
      }
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return {
      ...styles.controlBtn,
      ...(isActive ? styles.controlBtnActive : {})
    }
  }

  // 获取提示文本 / Get tooltip text
  const getTooltipTitle = (): string => {
    if (!isSingleLoop) {
      return '开启循环播放'
    } else {
      const loopType = loopSettings.count === -1 ? '无限循环' : `${loopSettings.count}次循环`
      return `关闭循环播放 (当前: ${loopType})`
    }
  }

  // 调试信息已移至内部 hook 中 / Debug info moved to internal hooks

  // 创建菜单项 / Create menu items
  const menuItems = [
    {
      key: 'count-title',
      label: '设置循环次数',
      disabled: true
    },
    {
      key: 'infinite',
      label: `无限循环${loopSettings.count === -1 ? ' ✓' : ''}`,
      onClick: () => {
        handleCountChange(-1)
        dispatch(loopToggleActions.closeMenu())
      }
    },
    { type: 'divider' as const },
    ...[2, 3, 5, 10].map((count) => ({
      key: `preset-${count}`,
      label: `${count} 次${loopSettings.count === count ? ' ✓' : ''}`,
      onClick: () => {
        handleCountChange(count)
        dispatch(loopToggleActions.closeMenu())
      }
    })),
    { type: 'divider' as const },
    {
      key: 'custom',
      label: '自定义次数...',
      onClick: () => {
        dispatch(loopToggleActions.openCustomModal())
      }
    }
  ]

  return (
    <>
      <Dropdown
        open={isMenuOpen}
        onOpenChange={handleMenuOpenChange}
        trigger={['contextMenu']}
        menu={{ items: menuItems }}
        placement="topLeft"
      >
        <Tooltip title={getTooltipTitle()}>
          <Button
            icon={
              <LoopIcon
                remainingCount={remainingCount}
                isActive={isSingleLoop}
                variant={variant}
                isSingleLoop={isSingleLoop}
                count={loopSettings.count}
              />
            }
            onClick={(e) => {
              handleLoopToggle()
              e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
            }}
            onContextMenu={handleContextMenu}
            type="text"
            style={getButtonStyles()}
            disabled={!isVideoLoaded}
            size="small"
          />
        </Tooltip>
      </Dropdown>

      <CustomLoopCountModal
        open={isCustomModalOpen}
        currentCount={loopSettings.count}
        onConfirm={handleCustomModalConfirm}
        onCancel={handleCustomModalCancel}
      />
    </>
  )
}
