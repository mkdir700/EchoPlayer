import { useCallback } from 'react'
import { COMPONENT_TOKENS } from '@renderer/styles/theme'

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
  // Calculate dynamic font size based on container size and screen size with proportional scaling
  const getDynamicFontSize = useCallback(() => {
    const screenWidth = window.innerWidth

    // Adjust base font size based on screen width
    let baseSize: number
    if (screenWidth >= 2560) {
      baseSize = 1.8 // 4K screen
    } else if (screenWidth >= 1440) {
      baseSize = 1.5 // Large screen
    } else if (screenWidth >= 1024) {
      baseSize = 1.2 // Medium screen
    } else if (screenWidth >= 768) {
      baseSize = 0.9 // Small screen
    } else {
      baseSize = 0.7 // Smaller screen
    }

    const baseSizeWidth = 60 // Base container width (%)
    const baseSizeHeight = 20 // Base container height (%)

    // Calculate scaling ratio based on container size
    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight

    // Use the smaller scaling ratio to ensure text doesn't exceed container
    const scale = Math.min(widthScale, heightScale)

    // Set different font size limits based on screen size
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

  // Calculate dynamic English font size
  const getDynamicEnglishFontSize = useCallback(() => {
    const baseFontSize = getDynamicFontSize()
    const baseValue = parseFloat(baseFontSize)
    const englishSize =
      (baseValue * COMPONENT_TOKENS.SUBTITLE.ENGLISH_FONT_SCALE) /
      COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_SCALE
    return `${englishSize}rem`
  }, [getDynamicFontSize])

  // Calculate dynamic Chinese font size
  const getDynamicChineseFontSize = useCallback(() => {
    const baseFontSize = getDynamicFontSize()
    const baseValue = parseFloat(baseFontSize)
    const chineseSize =
      (baseValue * COMPONENT_TOKENS.SUBTITLE.CHINESE_FONT_SCALE) /
      COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_SCALE
    return `${chineseSize}rem`
  }, [getDynamicFontSize])

  // Calculate dynamic control button size
  const getDynamicControlButtonSize = useCallback(() => {
    const screenWidth = window.innerWidth

    // Adjust base button size based on screen width
    let baseButtonSize: number
    if (screenWidth >= 2560) {
      baseButtonSize = 48 // 4K screen
    } else if (screenWidth >= 1440) {
      baseButtonSize = 40 // Large screen
    } else if (screenWidth >= 1024) {
      baseButtonSize = 36 // Medium screen
    } else if (screenWidth >= 768) {
      baseButtonSize = 32 // Small screen
    } else {
      baseButtonSize = 28 // Smaller screen
    }

    const baseSizeWidth = 60 // Base container width (%)
    const baseSizeHeight = 20 // Base container height (%)

    // Calculate scaling ratio based on container size
    const widthScale = currentLayout.width / baseSizeWidth
    const heightScale = currentLayout.height / baseSizeHeight

    // Use the smaller scaling ratio to ensure buttons don't exceed container
    const scale = Math.min(widthScale, heightScale)

    // Set button size limits based on screen size
    let minButtonSize: number, maxButtonSize: number
    if (screenWidth >= 2560) {
      minButtonSize = 40
      maxButtonSize = 60
    } else if (screenWidth >= 1440) {
      minButtonSize = 32
      maxButtonSize = 48
    } else if (screenWidth >= 1024) {
      minButtonSize = 28
      maxButtonSize = 40
    } else if (screenWidth >= 768) {
      minButtonSize = 24
      maxButtonSize = 36
    } else {
      minButtonSize = 20
      maxButtonSize = 32
    }

    const dynamicButtonSize = Math.max(
      minButtonSize,
      Math.min(maxButtonSize, baseButtonSize * scale)
    )

    const dynamicIconSize = dynamicButtonSize * COMPONENT_TOKENS.SUBTITLE.CONTROL_ICON_SIZE_RATIO

    return {
      buttonSize: Math.round(dynamicButtonSize),
      iconSize: Math.round(dynamicIconSize)
    }
  }, [currentLayout])

  // Dynamic text style
  const dynamicTextStyle: React.CSSProperties = {
    fontSize: getDynamicFontSize()
  }

  const dynamicEnglishTextStyle: React.CSSProperties = {
    fontSize: getDynamicEnglishFontSize()
  }

  const dynamicChineseTextStyle: React.CSSProperties = {
    fontSize: getDynamicChineseFontSize()
  }

  // Dynamic control button style
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
