import { DEFAULT_SHORTCUTS } from '../hooks/useShortcutManager'

/**
 * 快捷键冲突检测结果
 */
export interface ShortcutConflict {
  key1: string
  key2: string
  shortcut: string
  name1: string
  name2: string
}

/**
 * 快捷键验证结果
 */
export interface ShortcutValidationResult {
  isValid: boolean
  conflicts: ShortcutConflict[]
  fixedShortcuts?: Record<string, string>
}

/**
 * 检测快捷键配置中的冲突
 * @param shortcuts 用户自定义的快捷键配置
 * @returns 验证结果
 */
export function validateShortcuts(shortcuts: Record<string, string>): ShortcutValidationResult {
  const conflicts: ShortcutConflict[] = []
  const currentShortcuts: Record<string, string> = {}

  // 构建当前有效的快捷键映射（用户自定义 + 默认）
  for (const [key, config] of Object.entries(DEFAULT_SHORTCUTS)) {
    currentShortcuts[key] = shortcuts[key] || config.defaultKey
  }

  // 检测冲突
  const shortcutToKeys: Record<string, string[]> = {}
  for (const [key, shortcut] of Object.entries(currentShortcuts)) {
    if (!shortcutToKeys[shortcut]) {
      shortcutToKeys[shortcut] = []
    }
    shortcutToKeys[shortcut].push(key)
  }

  // 找出冲突的快捷键
  for (const [shortcut, keys] of Object.entries(shortcutToKeys)) {
    if (keys.length > 1) {
      // 有冲突，记录所有冲突对
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const key1 = keys[i]
          const key2 = keys[j]
          conflicts.push({
            key1,
            key2,
            shortcut,
            name1: DEFAULT_SHORTCUTS[key1]?.name || key1,
            name2: DEFAULT_SHORTCUTS[key2]?.name || key2
          })
        }
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts
  }
}

/**
 * 自动修复快捷键冲突
 * @param shortcuts 用户自定义的快捷键配置
 * @returns 修复后的配置和验证结果
 */
export function fixShortcutConflicts(shortcuts: Record<string, string>): ShortcutValidationResult {
  const validation = validateShortcuts(shortcuts)

  if (validation.isValid) {
    return validation
  }

  const fixedShortcuts = { ...shortcuts }
  const processedKeys = new Set<string>()

  // 处理每个冲突
  for (const conflict of validation.conflicts) {
    const { key1, key2, shortcut } = conflict

    // 如果已经处理过这些键，跳过
    if (processedKeys.has(key1) || processedKeys.has(key2)) {
      continue
    }

    // 优先保留默认配置中使用该快捷键的功能
    const key1DefaultShortcut = DEFAULT_SHORTCUTS[key1]?.defaultKey
    const key2DefaultShortcut = DEFAULT_SHORTCUTS[key2]?.defaultKey

    if (key1DefaultShortcut === shortcut) {
      // key1 应该保留这个快捷键，重置 key2 为默认值
      if (key2DefaultShortcut && key2DefaultShortcut !== shortcut) {
        fixedShortcuts[key2] = key2DefaultShortcut
      } else {
        // 如果 key2 的默认值也冲突，则删除 key2 的自定义配置
        delete fixedShortcuts[key2]
      }
      processedKeys.add(key2)
    } else if (key2DefaultShortcut === shortcut) {
      // key2 应该保留这个快捷键，重置 key1 为默认值
      if (key1DefaultShortcut && key1DefaultShortcut !== shortcut) {
        fixedShortcuts[key1] = key1DefaultShortcut
      } else {
        // 如果 key1 的默认值也冲突，则删除 key1 的自定义配置
        delete fixedShortcuts[key1]
      }
      processedKeys.add(key1)
    } else {
      // 两个都不是默认配置，重置两个为默认值
      if (key1DefaultShortcut) {
        fixedShortcuts[key1] = key1DefaultShortcut
      } else {
        delete fixedShortcuts[key1]
      }
      if (key2DefaultShortcut) {
        fixedShortcuts[key2] = key2DefaultShortcut
      } else {
        delete fixedShortcuts[key2]
      }
      processedKeys.add(key1)
      processedKeys.add(key2)
    }
  }

  // 验证修复后的配置
  const finalValidation = validateShortcuts(fixedShortcuts)

  return {
    ...finalValidation,
    fixedShortcuts
  }
}

/**
 * 获取快捷键冲突的描述信息
 * @param conflicts 冲突列表
 * @returns 格式化的冲突描述
 */
export function getConflictDescription(conflicts: ShortcutConflict[]): string[] {
  return conflicts.map(
    (conflict) =>
      `快捷键 "${conflict.shortcut}" 被 "${conflict.name1}" 和 "${conflict.name2}" 同时使用`
  )
}

/**
 * 检查单个快捷键是否与现有配置冲突
 * @param newShortcut 新的快捷键
 * @param excludeKey 要排除的键（通常是正在编辑的键）
 * @param shortcuts 当前快捷键配置
 * @returns 冲突的功能名称，如果没有冲突则返回 null
 */
export function checkSingleShortcutConflict(
  newShortcut: string,
  excludeKey: string,
  shortcuts: Record<string, string>
): string | null {
  for (const [key, config] of Object.entries(DEFAULT_SHORTCUTS)) {
    if (key === excludeKey) continue

    const currentShortcut = shortcuts[key] || config.defaultKey
    if (currentShortcut === newShortcut) {
      return config.name
    }
  }
  return null
}
