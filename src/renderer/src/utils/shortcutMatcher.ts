import { DEFAULT_SHORTCUTS } from '../hooks/useShortcutManager'

/**
 * 检查按键事件是否匹配指定的快捷键
 * @param event 键盘事件
 * @param shortcutKey 快捷键标识符
 * @param shortcuts 用户自定义的快捷键配置
 * @returns 是否匹配
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcutKey: string,
  shortcuts: Record<string, string>
): boolean {
  const currentKey = shortcuts[shortcutKey] || DEFAULT_SHORTCUTS[shortcutKey]?.defaultKey || ''
  if (!currentKey) return false

  // 解析快捷键字符串
  const parts = currentKey.split('+')
  const key = parts[parts.length - 1]
  const hasCtrl = parts.includes('Ctrl')
  const hasAlt = parts.includes('Alt')
  const hasShift = parts.includes('Shift')

  // 检查修饰键
  if (hasCtrl !== (event.ctrlKey || event.metaKey)) return false
  if (hasAlt !== event.altKey) return false
  if (hasShift !== event.shiftKey) return false

  // 检查主键
  if (key === 'Space') {
    return event.code === 'Space'
  } else if (key === '←') {
    return event.code === 'ArrowLeft'
  } else if (key === '→') {
    return event.code === 'ArrowRight'
  } else if (key === '↑') {
    return event.code === 'ArrowUp'
  } else if (key === '↓') {
    return event.code === 'ArrowDown'
  } else if (key === '[') {
    return event.code === 'BracketLeft'
  } else if (key === ']') {
    return event.code === 'BracketRight'
  } else if (key === '\\') {
    return event.code === 'Backslash'
  } else if (key.startsWith('Arrow')) {
    return event.code === key
  } else if (key.length === 1) {
    return event.code === `Key${key.toUpperCase()}`
  } else {
    return event.code === key
  }
}
