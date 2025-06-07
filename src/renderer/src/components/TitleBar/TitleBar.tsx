import React, { useEffect, useState, useMemo } from 'react'
import { Button, Tooltip, theme, Space } from 'antd'
import {
  MinusOutlined,
  BorderOutlined,
  CloseOutlined,
  PushpinOutlined,
  PushpinFilled
} from '@ant-design/icons'

import type { TitleBarOverlayOptions } from '@types_/shared'

// 扩展 Navigator 接口以支持 windowControlsOverlay / Extend Navigator interface for windowControlsOverlay
interface ExtendedNavigator extends Navigator {
  windowControlsOverlay?: {
    getTitlebarAreaRect(): { width: number; height: number; x: number; y: number }
  }
}

interface TitleBarProps {
  title?: string // 标题文本 / Title text
  showWindowControls?: boolean // 是否显示窗口控制按钮 / Whether to show window control buttons
  onSettingsClick?: () => void // 设置按钮点击回调 / Settings button click callback
  className?: string // 自定义样式类 / Custom style class
  variant?: 'default' | 'compact' // 标题栏变体 / Title bar variant
}

/**
 * 自定义标题栏组件 / Custom title bar component
 * 支持跨平台窗口控制和主题适配 / Supports cross-platform window control and theme adaptation
 */
export const TitleBar: React.FC<TitleBarProps> = ({
  showWindowControls = true,
  className = '',
  variant = 'default'
}) => {
  const { token } = theme.useToken()
  const [platform, setPlatform] = useState<string>('')
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
  const [windowControlsOverlayWidth, setWindowControlsOverlayWidth] = useState(0)

  // 获取平台信息和窗口状态 / Get platform information and window state
  useEffect(() => {
    const initializeTitleBar = async (): Promise<void> => {
      try {
        const platformInfo = await window.api.window.getPlatform()
        setPlatform(platformInfo)

        const alwaysOnTop = await window.api.window.isAlwaysOnTop()
        setIsAlwaysOnTop(alwaysOnTop)

        // 计算 Windows 系统窗口控件占用的空间 / Calculate Windows system window controls space
        if (platformInfo === 'win32') {
          try {
            // 类型断言处理 windowControlsOverlay / Type assertion for windowControlsOverlay
            const navigator = window.navigator as ExtendedNavigator
            if (navigator.windowControlsOverlay) {
              const rect = navigator.windowControlsOverlay.getTitlebarAreaRect()
              setWindowControlsOverlayWidth(window.innerWidth - rect.width)
            }
          } catch (error) {
            console.warn('无法获取窗口控件覆盖信息:', error)
          }
        }
      } catch (error) {
        console.error('初始化标题栏失败:', error)
      }
    }

    initializeTitleBar()
  }, [])

  // 动态设置标题栏主题 / Dynamically set title bar theme
  useEffect(() => {
    const updateTitleBarTheme = async (): Promise<void> => {
      if (platform !== 'darwin' && platform !== '') {
        try {
          const options: TitleBarOverlayOptions = {
            height: variant === 'compact' ? 40 : 49
          }

          // 获取当前主题的背景色和前景色 / Get current theme background and foreground colors
          const computedStyle = window.getComputedStyle(document.documentElement)
          options.color = computedStyle.backgroundColor || token.colorBgContainer
          options.symbolColor = computedStyle.color || token.colorText

          await window.api.window.setTitleBarOverlay(options)
        } catch (error) {
          console.debug('设置标题栏主题失败 (可能不支持):', error)
        }
      }
    }

    updateTitleBarTheme()
  }, [token.colorBgContainer, token.colorText, platform, variant])

  // 窗口控制处理器 / Window control handlers
  const handleMinimize = async (): Promise<void> => {
    try {
      await window.api.window.minimize()
    } catch (error) {
      console.error('最小化窗口失败:', error)
    }
  }

  const handleMaximize = async (): Promise<void> => {
    try {
      // macOS 上使用全屏模式，其他平台使用最大化 / Use fullscreen on macOS, maximize on other platforms
      if (platform === 'darwin') {
        await window.api.window.toggleFullScreen()
      } else {
        await window.api.window.maximize()
      }
    } catch (error) {
      console.error('最大化/全屏失败:', error)
    }
  }

  const handleClose = async (): Promise<void> => {
    try {
      await window.api.window.close()
    } catch (error) {
      console.error('关闭窗口失败:', error)
    }
  }

  const handleToggleAlwaysOnTop = async (): Promise<void> => {
    try {
      const newState = !isAlwaysOnTop
      await window.api.window.setAlwaysOnTop(newState)
      setIsAlwaysOnTop(newState)
    } catch (error) {
      console.error('切换窗口置顶失败:', error)
    }
  }

  // 计算样式 / Calculate styles
  const titleBarStyle = useMemo(() => {
    const style = {
      height: platform === 'darwin' ? 32 : variant === 'compact' ? 40 : 49,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end', // 改为右对齐，因为只有右侧的窗口控制按钮
      padding: `0 ${token.paddingSM}px`,
      background: token.colorBgContainer, // 使用主题容器背景色，在暗黑主题下是正确的深色背景 / Use theme container background color, correct dark background in dark theme
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      position: 'relative' as const,
      zIndex: 1000,
      userSelect: 'none' as const,
      // macOS 红绿灯按钮区域预留 / Reserve space for macOS traffic light buttons
      paddingLeft: platform === 'darwin' ? 80 : token.paddingSM,
      // Windows 系统窗口控件区域预留 / Reserve space for Windows system window controls
      paddingRight:
        platform === 'win32' && windowControlsOverlayWidth > 0
          ? windowControlsOverlayWidth + token.paddingSM
          : token.paddingSM
    }

    // 调试信息 / Debug info
    if (platform === 'darwin') {
      console.log('🚦 TitleBar样式配置 / TitleBar Style Config:')
      console.log('  - height:', style.height)
      console.log('  - paddingLeft (为交通灯预留):', style.paddingLeft)
    }

    return style
  }, [token, platform, windowControlsOverlayWidth, variant])

  const controlButtonStyle = useMemo(
    () => ({
      width: variant === 'compact' ? 28 : 32,
      height: variant === 'compact' ? 28 : 32,
      border: 'none',
      borderRadius: token.borderRadiusSM,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: variant === 'compact' ? token.fontSizeSM : token.fontSize,
      transition: `all ${token.motionDurationMid}`
    }),
    [token, variant]
  )

  return (
    <div className={`app-drag ${className}`} style={titleBarStyle}>
      {/* macOS 上不显示自定义窗口控制按钮，因为系统会提供原生的交通灯按钮 */}
      {/* Don't show custom window controls on macOS, as the system provides native traffic light buttons */}
      {showWindowControls && platform !== 'darwin' && (
        <Space size={token.marginXXS}>
          <Tooltip title={isAlwaysOnTop ? '取消置顶' : '窗口置顶'}>
            <Button
              type="text"
              icon={isAlwaysOnTop ? <PushpinFilled /> : <PushpinOutlined />}
              className="app-nodrag"
              style={{
                ...controlButtonStyle,
                color: isAlwaysOnTop ? token.colorPrimary : token.colorTextSecondary
              }}
              onClick={handleToggleAlwaysOnTop}
            />
          </Tooltip>

          <Tooltip title="最小化">
            <Button
              type="text"
              icon={<MinusOutlined />}
              className="app-nodrag"
              style={controlButtonStyle}
              onClick={handleMinimize}
            />
          </Tooltip>

          <Tooltip title="最大化">
            <Button
              type="text"
              icon={<BorderOutlined />}
              className="app-nodrag"
              style={controlButtonStyle}
              onClick={handleMaximize}
            />
          </Tooltip>

          <Tooltip title="关闭">
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="app-nodrag"
              style={{
                ...controlButtonStyle,
                color: token.colorError
              }}
              onClick={handleClose}
            />
          </Tooltip>
        </Space>
      )}
    </div>
  )
}
