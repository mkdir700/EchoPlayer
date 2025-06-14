/**
 * Version parsing and channel mapping utilities
 * 版本解析和渠道映射工具
 */

/**
 * Supported update channels
 * 支持的更新渠道
 */
export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'dev'

/**
 * Version suffix patterns and their corresponding channels
 * 版本后缀模式及其对应的渠道
 */
export interface VersionSuffixPattern {
  /** Pattern name for identification / 模式名称用于识别 */
  name: string
  /** Regular expression to match the suffix / 匹配后缀的正则表达式 */
  pattern: RegExp
  /** Corresponding update channel / 对应的更新渠道 */
  channel: UpdateChannel
  /** Priority for pattern matching (higher = checked first) / 模式匹配优先级（越高越先检查） */
  priority: number
  /** Description of the pattern / 模式描述 */
  description: string
  /** Example version strings / 示例版本字符串 */
  examples: string[]
}

/**
 * Predefined version suffix patterns
 * 预定义的版本后缀模式
 *
 * Priority order (highest to lowest):
 * 优先级顺序（从高到低）：
 * 1. dev/test patterns (most specific)
 * 2. alpha patterns (pre-release)
 * 3. beta patterns (pre-release)
 * 4. stable (default, no suffix)
 */
export const VERSION_SUFFIX_PATTERNS: VersionSuffixPattern[] = [
  {
    name: 'dev',
    pattern: /^(\d+\.\d+\.\d+)-dev(\.\d+)?$/,
    channel: 'dev',
    priority: 100,
    description: 'Development versions with -dev suffix / 带有 -dev 后缀的开发版本',
    examples: ['0.2.0-dev', '0.2.0-dev.1', '1.0.0-dev.5']
  },
  {
    name: 'test',
    pattern: /^(\d+\.\d+\.\d+)-test(\.\d+)?$/,
    channel: 'dev',
    priority: 99,
    description: 'Test versions with -test suffix / 带有 -test 后缀的测试版本',
    examples: ['0.2.0-test', '0.2.0-test.1', '1.0.0-test.3']
  },
  {
    name: 'alpha',
    pattern: /^(\d+\.\d+\.\d+)-alpha(\.\d+)?$/,
    channel: 'alpha',
    priority: 80,
    description: 'Alpha pre-release versions / Alpha 预发布版本',
    examples: ['0.2.0-alpha', '0.2.0-alpha.1', '1.0.0-alpha.5']
  },
  {
    name: 'beta',
    pattern: /^(\d+\.\d+\.\d+)-beta(\.\d+)?$/,
    channel: 'beta',
    priority: 70,
    description: 'Beta pre-release versions / Beta 预发布版本',
    examples: ['0.2.0-beta', '0.2.0-beta.1', '1.0.0-beta.3']
  },
  {
    name: 'stable',
    pattern: /^(\d+\.\d+\.\d+)$/,
    channel: 'stable',
    priority: 10,
    description: 'Stable release versions (no suffix) / 稳定发布版本（无后缀）',
    examples: ['0.2.0', '1.0.0', '2.1.5']
  }
]

/**
 * Parse version string and determine the appropriate update channel
 * 解析版本字符串并确定适当的更新渠道
 *
 * @param version - Version string to parse (e.g., "0.2.0-alpha.3")
 * @returns The determined update channel
 *
 * @example
 * ```typescript
 * getUpdateChannel('0.2.0-alpha.3') // returns 'alpha'
 * getUpdateChannel('0.2.0-beta.1')  // returns 'beta'
 * getUpdateChannel('0.2.0-dev.0')   // returns 'dev'
 * getUpdateChannel('0.2.0')         // returns 'stable'
 * ```
 */
export function getUpdateChannel(version: string): UpdateChannel {
  if (!version || typeof version !== 'string') {
    console.warn(`[Version Parser] Invalid version string: ${version}, defaulting to 'stable'`)
    return 'stable'
  }

  // Trim whitespace and normalize
  const normalizedVersion = version.trim()

  // Sort patterns by priority (highest first) and test each one
  const sortedPatterns = [...VERSION_SUFFIX_PATTERNS].sort((a, b) => b.priority - a.priority)

  for (const pattern of sortedPatterns) {
    if (pattern.pattern.test(normalizedVersion)) {
      console.log(
        `[Version Parser] Matched pattern '${pattern.name}' for version '${normalizedVersion}' -> channel '${pattern.channel}'`
      )
      return pattern.channel
    }
  }

  // Fallback to stable if no pattern matches
  console.warn(
    `[Version Parser] No pattern matched for version '${normalizedVersion}', defaulting to 'stable'`
  )
  return 'stable'
}

/**
 * Validate if a version string matches any known pattern
 * 验证版本字符串是否匹配任何已知模式
 *
 * @param version - Version string to validate
 * @returns True if version matches a known pattern, false otherwise
 */
export function isValidVersionFormat(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false
  }

  const normalizedVersion = version.trim()
  return VERSION_SUFFIX_PATTERNS.some((pattern) => pattern.pattern.test(normalizedVersion))
}

/**
 * Get detailed information about a version string
 * 获取版本字符串的详细信息
 *
 * @param version - Version string to analyze
 * @returns Detailed version information
 */
export interface VersionInfo {
  /** Original version string / 原始版本字符串 */
  version: string
  /** Determined update channel / 确定的更新渠道 */
  channel: UpdateChannel
  /** Matched pattern information / 匹配的模式信息 */
  pattern: VersionSuffixPattern | null
  /** Whether the version format is valid / 版本格式是否有效 */
  isValid: boolean
}

export function getVersionInfo(version: string): VersionInfo {
  const channel = getUpdateChannel(version)
  const isValid = isValidVersionFormat(version)

  // Find the matched pattern
  const sortedPatterns = [...VERSION_SUFFIX_PATTERNS].sort((a, b) => b.priority - a.priority)
  const matchedPattern =
    sortedPatterns.find((pattern) => pattern.pattern.test(version.trim())) || null

  return {
    version,
    channel,
    pattern: matchedPattern,
    isValid
  }
}
