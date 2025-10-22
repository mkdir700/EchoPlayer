import { loggerService } from '@logger'
import { HStack } from '@renderer/components/Layout'
import Selector from '@renderer/components/Selector'
import { useTheme } from '@renderer/contexts'
import { Button, Flex, Input, message } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SettingContainer,
  SettingDescription,
  SettingDivider,
  SettingGroup,
  SettingHelpLink,
  SettingHelpTextRow,
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

  // Translation settings state
  const [zhipuApiKey, setZhipuApiKey] = useState<string>('')
  const [validatingZhipuApiKey, setValidatingZhipuApiKey] = useState(false)
  const [zhipuApiKeyValid, setZhipuApiKeyValid] = useState<boolean | null>(null)

  // ASR language options
  const asrLanguageOptions = [
    { value: 'auto', label: t('settings.subtitleGeneration.speechRecognition.languages.auto') },
    { value: 'en', label: t('settings.subtitleGeneration.speechRecognition.languages.en') },
    { value: 'zh', label: t('settings.subtitleGeneration.speechRecognition.languages.zh') },
    { value: 'ja', label: t('settings.subtitleGeneration.speechRecognition.languages.ja') },
    { value: 'es', label: t('settings.subtitleGeneration.speechRecognition.languages.es') },
    { value: 'fr', label: t('settings.subtitleGeneration.speechRecognition.languages.fr') },
    { value: 'de', label: t('settings.subtitleGeneration.speechRecognition.languages.de') },
    { value: 'ko', label: t('settings.subtitleGeneration.speechRecognition.languages.ko') },
    { value: 'ru', label: t('settings.subtitleGeneration.speechRecognition.languages.ru') }
  ]

  // ASR model options
  const asrModelOptions = [
    { value: 'nova-3', label: t('settings.subtitleGeneration.speechRecognition.model.nova3') }
  ]

  // Load ASR settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const apiKey = await window.api.config.get('deepgramApiKey')
        const lang = await window.api.config.get('asrDefaultLanguage')
        const model = await window.api.config.get('asrModel')
        const zhipuKey = await window.api.config.get('zhipuApiKey')

        setDeepgramApiKey(apiKey || '')
        setAsrDefaultLanguage(lang || 'en')
        setAsrModel(model || 'nova-3')
        setZhipuApiKey(zhipuKey || '')
      } catch (error) {
        logger.error('加载字幕生成设置失败', { error })
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
      message.success(t('common.apiKey.saved'))
    } catch (error) {
      message.error(t('common.apiKey.saveFailed') || '保存失败')
    }
  }

  const handleValidateApiKey = async () => {
    if (!deepgramApiKey.trim()) {
      message.warning(t('common.apiKey.invalid') || 'API Key 无效')
      return
    }

    setValidatingApiKey(true)
    try {
      const isValid = await window.api.asr.validateApiKey(deepgramApiKey)
      setApiKeyValid(isValid)
      if (isValid) {
        message.success(t('common.apiKey.valid') || 'API Key 有效')
        // Save the validated key
        await window.api.config.set('deepgramApiKey', deepgramApiKey)
      } else {
        message.error(t('common.apiKey.invalid') || 'API Key 无效')
      }
    } catch (error) {
      setApiKeyValid(false)
      message.error(t('common.apiKey.invalid') || 'API Key 无效')
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

  const handleZhipuApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZhipuApiKey(e.target.value)
    setZhipuApiKeyValid(null) // Reset validation state
  }

  const handleZhipuApiKeySave = async () => {
    try {
      await window.api.config.set('zhipuApiKey', zhipuApiKey)
      message.success(t('common.apiKey.saved') || '保存成功')
    } catch (error) {
      message.error(t('common.apiKey.saveFailed') || '保存失败')
    }
  }

  const handleValidateZhipuApiKey = async () => {
    if (!zhipuApiKey.trim()) {
      message.warning(t('common.apiKey.invalid') || 'API Key 无效')
      return
    }

    setValidatingZhipuApiKey(true)
    try {
      const isValid = await window.api.translation.validateApiKey(zhipuApiKey)
      setZhipuApiKeyValid(isValid)
      if (isValid) {
        message.success(t('common.apiKey.valid') || 'API Key 有效')
        // Save the validated key
        await window.api.config.set('zhipuApiKey', zhipuApiKey)
      } else {
        message.error(t('common.apiKey.invalid') || 'API Key 无效')
      }
    } catch (error) {
      setZhipuApiKeyValid(false)
      message.error(t('common.apiKey.invalid') || 'API Key 无效')
    } finally {
      setValidatingZhipuApiKey(false)
    }
  }

  const openDeepgramWebsite = () => {
    window.api.openWebsite('https://console.deepgram.com/signup')
  }

  const openZhipuWebsite = () => {
    window.api.openWebsite('https://open.bigmodel.cn')
  }

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.subtitleGeneration.title')}</SettingTitle>
        <SettingDescription>{t('settings.subtitleGeneration.description')}</SettingDescription>
        <SettingDivider />

        {/* 语音识别分组 */}
        <SettingRow>
          <SettingRowTitle>
            <Flex vertical style={{ flex: 1 }}>
              <span>{t('settings.subtitleGeneration.speechRecognition.apiKey.label')}</span>
            </Flex>
          </SettingRowTitle>
          <Flex vertical gap={8} style={{ flex: 1, maxWidth: '400px' }}>
            <Flex gap={8}>
              <Input.Password
                value={deepgramApiKey}
                onChange={handleApiKeyChange}
                placeholder={t('settings.subtitleGeneration.speechRecognition.apiKey.placeholder')}
                onBlur={handleApiKeySave}
                status={apiKeyValid === false ? 'error' : undefined}
              />
              <Button onClick={handleValidateApiKey} loading={validatingApiKey}>
                {t('common.apiKey.validate')}
              </Button>
            </Flex>
          </Flex>
        </SettingRow>

        <SettingHelpTextRow style={{ justifyContent: 'space-between' }}>
          <HStack></HStack>
          <SettingHelpLink onClick={openDeepgramWebsite} style={{ alignSelf: 'flex-start' }}>
            {t('settings.subtitleGeneration.speechRecognition.apiKey.getKey')}
          </SettingHelpLink>
        </SettingHelpTextRow>

        <SettingDivider />

        <SettingRow>
          <SettingRowTitle>
            <Flex vertical>
              {t('settings.subtitleGeneration.speechRecognition.defaultLanguage.label')}
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
            <Flex vertical>{t('settings.subtitleGeneration.speechRecognition.model.label')}</Flex>
          </SettingRowTitle>
          <Selector
            size={14}
            value={asrModel}
            onChange={handleAsrModelChange}
            options={asrModelOptions}
          />
        </SettingRow>
      </SettingGroup>

      <SettingGroup>
        {/* 字幕翻译分组 */}
        <SettingRow>
          <SettingRowTitle>{t('settings.subtitleGeneration.translation.title')}</SettingRowTitle>
        </SettingRow>
        <SettingDescription>
          {t('settings.subtitleGeneration.translation.description')}
        </SettingDescription>
        <SettingDivider />

        <SettingRow>
          <SettingRowTitle>
            {t('settings.subtitleGeneration.translation.apiKey.label')}
          </SettingRowTitle>
          <Flex vertical gap={8} style={{ flex: 1, maxWidth: '400px' }}>
            <Flex gap={8}>
              <Input.Password
                value={zhipuApiKey}
                onChange={handleZhipuApiKeyChange}
                placeholder={t('settings.subtitleGeneration.translation.apiKey.placeholder')}
                onBlur={handleZhipuApiKeySave}
                status={zhipuApiKeyValid === false ? 'error' : undefined}
              />
              <Button onClick={handleValidateZhipuApiKey} loading={validatingZhipuApiKey}>
                {t('common.apiKey.validate')}
              </Button>
            </Flex>
          </Flex>
        </SettingRow>
        <SettingHelpTextRow style={{ justifyContent: 'space-between' }}>
          <HStack></HStack>
          <SettingHelpLink onClick={openZhipuWebsite}>
            {t('settings.subtitleGeneration.speechRecognition.apiKey.getKey')}
          </SettingHelpLink>
        </SettingHelpTextRow>
      </SettingGroup>
    </SettingContainer>
  )
}

export default ASRSettings
