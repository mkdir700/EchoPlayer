import { loggerService } from '@logger'
import Selector from '@renderer/components/Selector'
import { useTheme } from '@renderer/contexts'
import { Button, Flex, Input, message } from 'antd'
import { ExternalLink } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  HelpText,
  SettingContainer,
  SettingDescription,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '.'

const logger = loggerService.withContext('ASRSettings')

const ASRSettings: FC = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  // ASR settings state
  const [deepgramApiKey, setDeepgramApiKey] = useState<string>('')
  const [asrDefaultLanguage, setAsrDefaultLanguage] = useState<string>('en')
  const [asrModel, setAsrModel] = useState<string>('nova-3')
  const [validatingApiKey, setValidatingApiKey] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)

  // ASR language options
  const asrLanguageOptions = [
    { value: 'auto', label: t('settings.asr.languages.auto') },
    { value: 'en', label: t('settings.asr.languages.en') },
    { value: 'zh', label: t('settings.asr.languages.zh') },
    { value: 'ja', label: t('settings.asr.languages.ja') },
    { value: 'es', label: t('settings.asr.languages.es') },
    { value: 'fr', label: t('settings.asr.languages.fr') },
    { value: 'de', label: t('settings.asr.languages.de') },
    { value: 'ko', label: t('settings.asr.languages.ko') },
    { value: 'ru', label: t('settings.asr.languages.ru') }
  ]

  // ASR model options
  const asrModelOptions = [{ value: 'nova-3', label: t('settings.asr.model.nova3') }]

  // Load ASR settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiKey = await window.api.config.get('deepgramApiKey')
        const lang = await window.api.config.get('asrDefaultLanguage')
        const model = await window.api.config.get('asrModel')

        setDeepgramApiKey(apiKey || '')
        setAsrDefaultLanguage(lang || 'en')
        setAsrModel(model || 'nova-3')
      } catch (error) {
        logger.error('加载 ASR 设置失败', { error })
      }
    }

    loadSettings()
  }, [])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeepgramApiKey(e.target.value)
    setApiKeyValid(null) // Reset validation state
  }

  const handleApiKeySave = async () => {
    try {
      await window.api.config.set('deepgramApiKey', deepgramApiKey)
      message.success(t('settings.asr.apiKey.saved') || '保存成功')
    } catch (error) {
      message.error(t('settings.asr.apiKey.saveFailed') || '保存失败')
    }
  }

  const handleValidateApiKey = async () => {
    if (!deepgramApiKey.trim()) {
      message.warning(t('settings.asr.apiKey.invalid') || 'API Key 无效')
      return
    }

    setValidatingApiKey(true)
    try {
      const isValid = await window.api.asr.validateApiKey(deepgramApiKey)
      setApiKeyValid(isValid)
      if (isValid) {
        message.success(t('settings.asr.apiKey.valid') || 'API Key 有效')
        // Save the validated key
        await window.api.config.set('deepgramApiKey', deepgramApiKey)
      } else {
        message.error(t('settings.asr.apiKey.invalid') || 'API Key 无效')
      }
    } catch (error) {
      setApiKeyValid(false)
      message.error(t('settings.asr.apiKey.invalid') || 'API Key 无效')
    } finally {
      setValidatingApiKey(false)
    }
  }

  const handleAsrLanguageChange = async (value: string) => {
    setAsrDefaultLanguage(value)
    try {
      await window.api.config.set('asrDefaultLanguage', value)
    } catch (error) {
      logger.error('保存 ASR 语言失败', { error })
    }
  }

  const handleAsrModelChange = async (value: string) => {
    setAsrModel(value)
    try {
      await window.api.config.set('asrModel', value)
    } catch (error) {
      logger.error('保存 ASR 模型失败', { error })
    }
  }

  const openDeepgramWebsite = () => {
    window.api.openWebsite('https://console.deepgram.com/signup')
  }

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.asr.title')}</SettingTitle>
        <SettingDescription>{t('settings.asr.description')}</SettingDescription>
        <SettingDivider />

        <SettingRow>
          <SettingRowTitle>
            <Flex vertical style={{ flex: 1 }}>
              <span>{t('settings.asr.apiKey.label')}</span>
              <HelpText>{t('settings.asr.apiKey.description')}</HelpText>
            </Flex>
          </SettingRowTitle>
          <Flex vertical gap={8} style={{ flex: 1, maxWidth: '400px' }}>
            <Flex gap={8}>
              <Input.Password
                value={deepgramApiKey}
                onChange={handleApiKeyChange}
                placeholder={t('settings.asr.apiKey.placeholder')}
                onBlur={handleApiKeySave}
                status={apiKeyValid === false ? 'error' : undefined}
              />
              <Button onClick={handleValidateApiKey} loading={validatingApiKey}>
                {t('settings.asr.apiKey.validate')}
              </Button>
            </Flex>
            <Button
              type="link"
              onClick={openDeepgramWebsite}
              style={{ alignSelf: 'flex-start', padding: 0 }}
            >
              {t('settings.asr.apiKey.getKey')} <ExternalLink size={14} style={{ marginLeft: 4 }} />
            </Button>
          </Flex>
        </SettingRow>

        <SettingDivider />

        <SettingRow>
          <SettingRowTitle>
            <Flex vertical>
              <span>{t('settings.asr.defaultLanguage.label')}</span>
              <HelpText>{t('settings.asr.defaultLanguage.description')}</HelpText>
            </Flex>
          </SettingRowTitle>
          <Selector
            size={14}
            value={asrDefaultLanguage}
            onChange={handleAsrLanguageChange}
            options={asrLanguageOptions}
          />
        </SettingRow>

        <SettingDivider />

        <SettingRow>
          <SettingRowTitle>
            <Flex vertical>
              <span>{t('settings.asr.model.label')}</span>
              <HelpText>{t('settings.asr.model.description')}</HelpText>
            </Flex>
          </SettingRowTitle>
          <Selector
            size={14}
            value={asrModel}
            onChange={handleAsrModelChange}
            options={asrModelOptions}
          />
        </SettingRow>
      </SettingGroup>
    </SettingContainer>
  )
}

export default ASRSettings
