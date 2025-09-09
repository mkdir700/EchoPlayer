import Selector from '@renderer/components/Selector'
import { useTheme } from '@renderer/contexts'
import { useSettings } from '@renderer/infrastructure/hooks/useSettings'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SettingContainer,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '.'
import SubtitlePreview from './SubtitlePreview'

const PlaybackSettings: FC = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const {
    playback: { defaultSubtitleDisplayMode, defaultSubtitleBackgroundType, defaultFavoriteRates },
    setDefaultVolume,
    setDefaultPlaybackSpeed,
    setDefaultSubtitleBackgroundType,
    setDefaultSubtitleDisplayMode,
    setDefaultFavoriteRates
  } = useSettings()

  const volumeOptions = [
    { label: '10%', value: 0.1 },
    { label: '20%', value: 0.2 },
    { label: '30%', value: 0.3 },
    { label: '40%', value: 0.4 },
    { label: '50%', value: 0.5 },
    { label: '60%', value: 0.6 },
    { label: '70%', value: 0.7 },
    { label: '80%', value: 0.8 },
    { label: '90%', value: 0.9 },
    { label: '100%', value: 1 }
  ]

  const playbackSpeedOptions = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1.0x', value: 1.0 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '1.75x', value: 1.75 },
    { label: '2.0x', value: 2.0 }
  ]

  // 常用速度选项（用于多选）
  const favoriteRateOptions = playbackSpeedOptions

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.playback.title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.playback.defaultVolume')}</SettingRowTitle>
          <Selector
            size={14}
            value={1}
            onChange={(value) => {
              setDefaultVolume(value as number)
            }}
            options={volumeOptions.map((volume) => ({
              label: volume.label,
              value: volume.value
            }))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.playback.defaultPlaybackSpeed')}</SettingRowTitle>
          <Selector
            size={14}
            value={1.0}
            onChange={(value) => {
              setDefaultPlaybackSpeed(value as number)
            }}
            options={playbackSpeedOptions.map((speed) => ({
              label: speed.label,
              value: speed.value
            }))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.playback.favoriteRates.label')}</SettingRowTitle>
          <Selector
            size={14}
            multiple
            value={defaultFavoriteRates}
            onChange={(value) => {
              setDefaultFavoriteRates(value as number[])
            }}
            options={favoriteRateOptions}
            placeholder={t('settings.playback.favoriteRates.placeholder')}
          />
        </SettingRow>
      </SettingGroup>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.playback.subtitle.title')}</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.playback.subtitle.defaultDisplayMode')}</SettingRowTitle>
          <Selector
            size={14}
            value={defaultSubtitleDisplayMode}
            onChange={(value) => {
              setDefaultSubtitleDisplayMode(value as SubtitleDisplayMode)
            }}
            options={[
              {
                label: t('settings.playback.subtitle.displayMode.none'),
                value: SubtitleDisplayMode.NONE
              },
              {
                label: t('settings.playback.subtitle.displayMode.bilingual'),
                value: SubtitleDisplayMode.BILINGUAL
              },
              {
                label: t('settings.playback.subtitle.displayMode.original'),
                value: SubtitleDisplayMode.ORIGINAL
              },
              {
                label: t('settings.playback.subtitle.displayMode.translation'),
                value: SubtitleDisplayMode.TRANSLATED
              }
            ]}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>{t('settings.playback.subtitle.defaultBackgroundType')}</SettingRowTitle>
          <Selector
            size={14}
            value={defaultSubtitleBackgroundType}
            onChange={(value) => {
              setDefaultSubtitleBackgroundType(value as SubtitleBackgroundType)
            }}
            options={[
              {
                label: t('settings.playback.subtitle.backgroundType.blur'),
                value: SubtitleBackgroundType.BLUR
              },
              {
                label: t('settings.playback.subtitle.backgroundType.solid'),
                value: SubtitleBackgroundType.SOLID_BLACK
              },
              {
                label: t('settings.playback.subtitle.backgroundType.transparent'),
                value: SubtitleBackgroundType.TRANSPARENT
              }
            ]}
          />
        </SettingRow>
        <SettingDivider />
        <SubtitlePreview
          displayMode={defaultSubtitleDisplayMode}
          backgroundType={defaultSubtitleBackgroundType}
          theme={theme}
        />
      </SettingGroup>
    </SettingContainer>
  )
}

export default PlaybackSettings
