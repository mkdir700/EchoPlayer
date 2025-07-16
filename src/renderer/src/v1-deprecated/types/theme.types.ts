export interface ThemeColors {
  background: string
  backgroundAlt: string
  backgroundHover: string
  primary: string
  primaryHover: string
  text: string
  textInverse: string
  border: string
}

export interface ThemeBorderRadius {
  sm: string
  md: string
  lg: string
}

export interface Theme {
  colors: ThemeColors
  borderRadius: ThemeBorderRadius
}
