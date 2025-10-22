import { SPACING } from '@renderer/infrastructure/styles/theme'

/**
 * 计算菜单位置，确保光标对准第一个菜单项的中心
 * @param clickPosition 点击位置（鼠标位置或按钮位置）
 * @param menuElement 菜单元素（用于边界检查）
 * @returns 计算后的菜单位置
 */
export function calculateMenuPosition(
  clickPosition: { x: number; y: number },
  menuElement?: HTMLElement | null
): { x: number; y: number } {
  const { innerWidth, innerHeight } = window
  const menuTopPadding = SPACING.XS // 菜单顶部内边距 8px
  const menuItemPaddingX = SPACING.SM // 菜单项水平内边距 12px
  const menuItemPaddingY = SPACING.XS // 菜单项垂直内边距 8px
  const iconSize = 16 // 图标尺寸 16px
  const iconGap = SPACING.SM // 图标与文字间距 12px
  const fontSize = 13 // 字体大小 13px
  const lineHeight = 13 // 字体大小 13px，行高约 1.5 = 19.5px
  const firstMenuItemHeight = Math.max(iconSize, lineHeight) + menuItemPaddingY * 2 // 第一个菜单项高度约 32px

  // 计算第一个菜单项'向 AI 询问'的文本宽度 (估算)
  const textWidth = '向 AI 询问'.length * fontSize * 0.8 // 估算文本宽度（中文字符约为字体大小的0.8倍）

  // 计算第一个菜单项的中心位置
  const offsetToCenterX = menuItemPaddingX + iconSize / 2 + iconGap / 2 + textWidth / 2 // 菜单项中心相对于左边缘的偏移

  const offsetToCenterY = firstMenuItemHeight / 2 // 垂直偏移量，让光标对准第一个菜单项中心

  let x = clickPosition.x - offsetToCenterX // 调整 X 坐标，让光标对准第一个菜单项水平中心
  let y = clickPosition.y - menuTopPadding - offsetToCenterY // 调整 Y 坐标，让光标对准第一个菜单项中心

  // 获取菜单实际尺寸进行边界检查
  if (menuElement) {
    const { width: menuWidth, height: menuHeight } = menuElement.getBoundingClientRect()

    // 水平位置调整
    if (x + menuWidth > innerWidth) {
      x = innerWidth - menuWidth - 8
    }
    if (x < 8) {
      x = 8
    }

    // 垂直位置调整
    if (y + menuHeight > innerHeight) {
      y = innerHeight - menuHeight - 8
    }
  }
  if (y < 8) {
    y = 8
  }

  return { x, y }
}
