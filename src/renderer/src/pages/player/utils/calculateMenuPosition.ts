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
  const SAFE_MARGIN = 8
  const FIRST_ITEM_OFFSET_X = 4 // 第一个菜单项中心偏移量（预设值）
  const FIRST_ITEM_OFFSET_Y = 8 // 第一个菜单项垂直中心偏移量（预设值）

  // 计算初始位置（光标对准第一个菜单项中心）
  let x = clickPosition.x - FIRST_ITEM_OFFSET_X
  let y = clickPosition.y - SPACING.XS - FIRST_ITEM_OFFSET_Y

  // 边界检查和调整
  if (menuElement) {
    const { width: menuWidth, height: menuHeight } = menuElement.getBoundingClientRect()

    // 确保菜单不超出视窗边界
    x = Math.max(SAFE_MARGIN, Math.min(x, innerWidth - menuWidth - SAFE_MARGIN))
    y = Math.max(SAFE_MARGIN, Math.min(y, innerHeight - menuHeight - SAFE_MARGIN))
  } else {
    // 没有菜单元素时只检查最小边界
    y = Math.max(SAFE_MARGIN, y)
  }

  return { x, y }
}
