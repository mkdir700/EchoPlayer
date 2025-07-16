import { SyncOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import { isMac, THEME_COLOR_PRESETS } from '@renderer/infrastructure'
import { useSettings } from '@renderer/infrastructure/hooks/useSettings'
import useUserTheme from '@renderer/infrastructure/hooks/useUserTheme'
import { ThemeMode } from '@types'
import { ColorPicker, Segmented, Switch } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  SettingContainer,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '.'

const ColorCircleWrapper = styled.div`
  width: 24px;
  height: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ColorCircle = styled.div<{ color: string; isActive?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  cursor: pointer;
  transform: translate(-50%, -50%);
  border: 2px solid ${(props) => (props.isActive ? 'var(--color-border)' : 'transparent')};
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`

export function AppearanceSettings(): React.JSX.Element {
  const { windowStyle, setWindowStyle } = useSettings()
  const { theme, setTheme } = useSettings()
  const { colorPrimary, setUserTheme } = useUserTheme()
  const { t } = useTranslation()

  const handleWindowStyleChange = useCallback(
    (checked: boolean) => {
      setWindowStyle(checked ? 'transparent' : 'opaque')
    },
    [setWindowStyle]
  )

  const handleColorPrimaryChange = useCallback(
    (colorHex: string) => {
      setUserTheme({
        colorPrimary: colorHex
      })
    },
    [setUserTheme]
  )

  // /**
  //  * 转换主题算法为主题设置
  //  * Converts theme algorithm to theme settings
  //  */
  // const convertAlgorithmToSettings = (
  //   algorithm: ThemeAlgorithm
  // ): { mode: ThemeMode; compactMode: boolean } => {
  //   switch (algorithm) {
  //     case 'dark':
  //       return { mode: ThemeMode.dark, compactMode: false }
  //     case 'compact':
  //       return { mode: ThemeMode.light, compactMode: true }
  //     case 'darkCompact':
  //       return { mode: ThemeMode.dark, compactMode: true }
  //     case 'default':
  //     default:
  //       return { mode: ThemeMode.system, compactMode: false }
  //   }
  // }

  // /**
  //  * 根据当前主题设置获取主题算法
  //  * Gets the theme algorithm from the current theme settings
  //  */
  // const getCurrentAlgorithm = (): ThemeAlgorithm => {
  //   if (theme === ThemeMode.dark) {
  //     return compactMode ? 'darkCompact' : 'dark'
  //   }
  //   return compactMode ? 'compact' : 'default'
  // }

  // /**
  //  * 处理主题算法变更 / Handle theme algorithm change
  //  */
  // const handleAlgorithmChange = async (algorithm: ThemeAlgorithm): Promise<void> => {
  //   try {
  //     const { mode, compactMode } = convertAlgorithmToSettings(algorithm)
  //     setTheme(mode)
  //     setCompactMode(compactMode)
  //   } catch (error) {
  //     console.error('更新主题模式失败:', error)
  //     message.error('更新主题模式失败')
  //   }
  // }

  const themeOptions = useMemo(
    () => [
      {
        value: ThemeMode.light,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="iconfont icon-theme icon-theme-light" />
            <span>{t('settings.theme.light')}</span>
          </div>
        )
      },
      {
        value: ThemeMode.dark,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className="iconfont icon-theme icon-dark1" />
            <span>{t('settings.theme.dark')}</span>
          </div>
        )
      },
      {
        value: ThemeMode.system,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <SyncOutlined />
            <span>{t('settings.theme.system')}</span>
          </div>
        )
      }
    ],
    [t]
  )

  /**
   * 处理重置 / Handle reset
   */
  // const handleReset = async (): Promise<void> => {
  //   try {
  //     message.success('主题设置已重置为默认配置')
  //   } catch (error) {
  //     console.error('重置主题设置失败:', error)
  //     message.error('重置主题设置失败')
  //   }
  // }

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.appearance.title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.theme.title')}</SettingRowTitle>
          <Segmented value={theme} shape="round" onChange={setTheme} options={themeOptions} />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.theme.color_primary')}</SettingRowTitle>
          <HStack gap="12px" alignItems="center">
            <HStack gap="12px">
              {THEME_COLOR_PRESETS.map((color) => (
                <ColorCircleWrapper key={color}>
                  <ColorCircle
                    color={color}
                    isActive={colorPrimary === color}
                    onClick={() => handleColorPrimaryChange(color)}
                  />
                </ColorCircleWrapper>
              ))}
            </HStack>
            <ColorPicker
              className="color-picker"
              value={colorPrimary}
              onChange={(color) => handleColorPrimaryChange(color.toHexString())}
              showText
              size="small"
              presets={[
                {
                  label: 'Presets',
                  colors: THEME_COLOR_PRESETS
                }
              ]}
            />
          </HStack>
        </SettingRow>
        {isMac && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitle>{t('settings.theme.window.style.transparent')}</SettingRowTitle>
              <Switch checked={windowStyle === 'transparent'} onChange={handleWindowStyleChange} />
            </SettingRow>
          </>
        )}
      </SettingGroup>
    </SettingContainer>
  )
}

/**
 * 默认导出 / Default export
 */
export default AppearanceSettings
