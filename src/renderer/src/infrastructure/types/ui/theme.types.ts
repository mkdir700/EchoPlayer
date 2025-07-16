/**
 * 主题相关类型定义
 * Theme Related Type Definitions
 */

import { GlobalToken } from 'antd'

/**
 * 主题算法类型 / Theme Algorithm Type
 */
export type ThemeAlgorithm = 'default' | 'dark' | 'compact' | 'darkCompact'

/**
 * 主题模式类型 / Theme Mode Type
 */
export enum ThemeMode {
  light = 'light',
  dark = 'dark',
  system = 'system'
}

export interface ThemeProps {
  theme: GlobalToken // 定义主题的类型
}
