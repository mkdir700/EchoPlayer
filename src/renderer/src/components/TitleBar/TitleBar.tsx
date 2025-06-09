import React, { useEffect, useState, useMemo } from 'react'
import { Button, Tooltip, theme, Space } from 'antd'
import {
  MinusOutlined,
  BorderOutlined,
  CloseOutlined,
  PushpinOutlined,
  PushpinFilled
} from '@ant-design/icons'

// 由于完全禁用了系统标题栏覆盖，不再需要 TitleBarOverlayOptions 类型
// Since system title bar overlay is completely disabled, TitleBarOverlayOptions type is no longer needed

// 由于完全禁用了系统标题栏覆盖，不再需要 ExtendedNavigator 接口
// Since system title bar overlay is completely disabled, ExtendedNavigator interface is no longer needed

interface TitleBarProps {
  title?: string // 标题文本 / Title text
  onSettingsClick?: () => void // 设置按钮点击回调 / Settings button click callback
}

/**
 * 自定义标题栏组件 / Custom title bar component
 * 支持跨平台窗口控制和主题适配 / Supports cross-platform window control and theme adaptation
 */
export const TitleBar: React.FC<TitleBarProps> = () => {
  const { token } = theme.useToken()
  const [platform, setPlatform] = useState<string | null>(null) // 初始值设为 null，避免在平台信息未确定时显示按钮 / Set initial value to null to avoid showing buttons before platform info is determined
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
  // 由于完全禁用了系统标题栏覆盖，不再需要 windowControlsOverlayWidth 状态
  // Since system title bar overlay is completely disabled, windowControlsOverlayWidth state is no longer needed

  // 获取平台信息和窗口状态 / Get platform information and window state
  useEffect(() => {
    const initializeTitleBar = async (): Promise<void> => {
      try {
        const platformInfo = await window.api.window.getPlatform()
        setPlatform(platformInfo)

        const alwaysOnTop = await window.api.window.isAlwaysOnTop()
        setIsAlwaysOnTop(alwaysOnTop)

        // 由于完全禁用了系统标题栏覆盖，不需要计算系统窗口控件空间
        // Since system title bar overlay is completely disabled, no need to calculate system window controls space
      } catch (error) {
        console.error('初始化标题栏失败:', error)
      }
    }

    initializeTitleBar()
  }, [])

  // 由于完全禁用了系统标题栏覆盖，不再需要动态设置标题栏主题
  // Since system title bar overlay is completely disabled, no need to dynamically set title bar theme

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
    // 统一所有平台高度为 32px，避免任何高度变化导致的抖动 / Unify height to 32px for all platforms to avoid any height-related jitter
    const getHeight = (): number => {
      return 32 // 所有平台统一使用 32px 高度 / Use 32px height for all platforms
    }

    const getPaddingLeft = (): number => {
      if (platform === null) {
        // 默认预留 macOS 红绿灯按钮空间，避免布局跳动 / Default to reserve macOS traffic light space to avoid layout jumps
        return 80
      }
      return platform === 'darwin' ? 80 : token.paddingSM
    }

    const getPaddingRight = (): number => {
      // 由于完全禁用了系统标题栏覆盖，所有平台都使用统一的右边距
      // Since system title bar overlay is completely disabled, use unified right padding for all platforms
      return token.paddingSM
    }

    const style = {
      height: getHeight(),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end', // 改为右对齐，因为只有右侧的窗口控制按钮
      padding: `0 ${token.paddingSM}px`,
      background: token.colorBgContainer, // 使用主题容器背景色，在暗黑主题下是正确的深色背景 / Use theme container background color, correct dark background in dark theme
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      position: 'fixed' as const, // 固定定位让标题栏始终在顶部 / Fixed positioning to keep title bar always at top
      top: 0,
      left: 0,
      right: 0,
      zIndex: token.zIndexPopupBase + 100, // 使用标准化的 zIndex 值 / Use standardized zIndex value
      userSelect: 'none' as const,
      // macOS 红绿灯按钮区域预留 / Reserve space for macOS traffic light buttons
      paddingLeft: getPaddingLeft(),
      // Windows 系统窗口控件区域预留 / Reserve space for Windows system window controls
      paddingRight: getPaddingRight()
    }

    // 调试信息 / Debug info
    if (platform === 'darwin') {
      console.log('🚦 TitleBar样式配置 / TitleBar Style Config:')
      console.log('  - height:', style.height)
      console.log('  - paddingLeft (为交通灯预留):', style.paddingLeft)
    }

    return style
  }, [token, platform])

  const controlButtonStyle = useMemo(
    () => ({
      width: 28,
      height: 28,
      border: 'none',
      borderRadius: token.borderRadiusSM,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: token.fontSizeSM,
      transition: `all ${token.motionDurationMid}`
    }),
    [token]
  )

  return (
    <div className={`app-drag`} style={titleBarStyle}>
      {/* macOS 上不显示自定义窗口控制按钮，因为系统会提供原生的交通灯按钮 */}
      {/* Don't show custom window controls on macOS, as the system provides native traffic light buttons */}
      {/* 只有在平台信息已确定且不是 macOS 时才显示控制按钮 / Only show control buttons when platform info is determined and not macOS */}
      {platform !== null && platform !== 'darwin' && (
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
