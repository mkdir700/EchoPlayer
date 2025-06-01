import { useCallback } from 'react'

export const useSubtitleStyles = (currentLayout: {
  left: number
  top: number
  width: number
  height: number
}): {
  dynamicTextStyle: React.CSSProperties
  dynamicEnglishTextStyle: React.CSSProperties
  dynamicChineseTextStyle: React.CSSProperties
  dynamicControlButtonStyle: React.CSSProperties
  buttonSize: number
  iconSize: number
} => {
  // 计算动态字体大小 - 基于容器尺寸和屏幕尺寸等比缩放
  const getDynamicFontSize = useCallback(() => {
    const screenWidth = window.innerWidth

    // 根据屏幕宽度调整基础字体大小
    let baseSize: number
    if (screenWidth >= 2560) {
      baseSize = 1.8 // 4K 屏幕
    } else if (screenWidth >= 1440) {
      baseSize = 1.5 // 大屏幕
    } else if (screenWidth >= 1024) {
      baseSize = 1.2 // 中等屏幕
    } else if (screenWidth >= 768) {
      baseSize = 0.9 // 小屏幕
    } else {
      baseSize = 0.7 // 更小屏幕
    }

    const baseSizeWidth = 60 // 基础容器宽度 (%)
    const baseSizeHeight = 20 // 基础容器高度 (%)

    // 基于容器尺寸计算缩放比例
    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight

    // 使用较小的缩放比例，确保文字不会超出容器
    const scale = Math.min(widthScale, heightScale)

    // 根据屏幕大小设置不同的字体大小限制
    let minSize: number, maxSize: number
    if (screenWidth >= 2560) {
      minSize = 1.2
      maxSize = 4.0
    } else if (screenWidth >= 1440) {
      minSize = 1.0
      maxSize = 3.0
    } else if (screenWidth >= 1024) {
      minSize = 0.8
      maxSize = 2.5
    } else if (screenWidth >= 768) {
      minSize = 0.6
      maxSize = 1.8
    } else {
      minSize = 0.5
      maxSize = 1.4
    }

    const dynamicSize = Math.max(minSize, Math.min(maxSize, baseSize * scale))
    return `${dynamicSize}rem`
  }, [currentLayout])

  // 计算英文和中文的动态字体大小
  const getDynamicEnglishFontSize = useCallback(() => {
    const baseDynamicSize = parseFloat(getDynamicFontSize())
    return `${baseDynamicSize * 1.17}rem` // 英文字体比基础字体大17%
  }, [getDynamicFontSize])

  const getDynamicChineseFontSize = useCallback(() => {
    const baseDynamicSize = parseFloat(getDynamicFontSize())
    return `${baseDynamicSize * 0.93}rem` // 中文字体比基础字体小7%
  }, [getDynamicFontSize])

  // 计算动态控制按钮大小
  const getDynamicControlButtonSize = useCallback(() => {
    const screenWidth = window.innerWidth

    // 根据屏幕宽度设置基础按钮大小
    let baseButtonSize: number
    let baseIconSize: number

    if (screenWidth >= 2560) {
      baseButtonSize = 40 // 4K 屏幕
      baseIconSize = 18
    } else if (screenWidth >= 1440) {
      baseButtonSize = 36 // 大屏幕
      baseIconSize = 16
    } else if (screenWidth >= 1024) {
      baseButtonSize = 34 // 中等屏幕
      baseIconSize = 15
    } else if (screenWidth >= 768) {
      baseButtonSize = 30 // 小屏幕
      baseIconSize = 13
    } else {
      baseButtonSize = 28 // 更小屏幕
      baseIconSize = 12
    }

    // 基于字幕容器大小计算缩放比例
    const baseSizeWidth = 60 // 基础容器宽度 (%)
    const baseSizeHeight = 20 // 基础容器高度 (%)

    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight
    const scale = Math.min(widthScale, heightScale)

    // 限制按钮大小范围
    const minButtonSize = 24
    const maxButtonSize = 50
    const minIconSize = 10
    const maxIconSize = 24

    const dynamicButtonSize = Math.max(
      minButtonSize,
      Math.min(maxButtonSize, baseButtonSize * scale)
    )
    const dynamicIconSize = Math.max(minIconSize, Math.min(maxIconSize, baseIconSize * scale))

    return {
      buttonSize: Math.round(dynamicButtonSize),
      iconSize: Math.round(dynamicIconSize)
    }
  }, [currentLayout])

  // 动态文本样式
  const dynamicTextStyle: React.CSSProperties = {
    fontSize: getDynamicFontSize()
  }

  const dynamicEnglishTextStyle: React.CSSProperties = {
    fontSize: getDynamicEnglishFontSize()
  }

  const dynamicChineseTextStyle: React.CSSProperties = {
    fontSize: getDynamicChineseFontSize()
  }

  // 动态控制按钮样式
  const { buttonSize, iconSize } = getDynamicControlButtonSize()

  const dynamicControlButtonStyle: React.CSSProperties = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    fontSize: `${iconSize}px`
  }

  return {
    dynamicTextStyle,
    dynamicEnglishTextStyle,
    dynamicChineseTextStyle,
    dynamicControlButtonStyle,
    buttonSize,
    iconSize
  }
}
