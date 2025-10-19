import { useTheme } from '@renderer/contexts'
import { Button, Flex, Modal, Select } from 'antd'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ASRSubtitlePromptProps {
  open: boolean
  onGenerate: (language: string) => void
  onLater: () => void
  estimatedMinutes?: number
}

const ASRSubtitlePrompt: FC<ASRSubtitlePromptProps> = ({
  open,
  onGenerate,
  onLater,
  estimatedMinutes = 5
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto')

  const languageOptions = [
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

  const handleGenerate = () => {
    onGenerate(selectedLanguage)
  }

  return (
    <Modal
      open={open}
      title={t('player.asr.prompt.title')}
      onCancel={onLater}
      footer={null}
      width={500}
      centered
    >
      <Flex vertical gap={20}>
        <div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>{t('player.asr.prompt.message')}</p>
          <p style={{ fontSize: '14px', color: theme === 'dark' ? '#999' : '#666' }}>
            {t('player.asr.prompt.description')}
          </p>
        </div>

        <Flex vertical gap={8}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            {t('player.asr.prompt.language')}
          </label>
          <Select
            value={selectedLanguage}
            onChange={setSelectedLanguage}
            options={languageOptions}
            style={{ width: '100%' }}
            size="large"
            placement="bottomLeft"
          />
        </Flex>

        <div style={{ fontSize: '13px', color: theme === 'dark' ? '#999' : '#666' }}>
          {t('player.asr.prompt.estimatedTime', { minutes: estimatedMinutes })}
        </div>

        <Flex gap={12} justify="flex-end">
          <Button onClick={onLater}>{t('player.asr.prompt.later')}</Button>
          <Button type="primary" onClick={handleGenerate}>
            {t('player.asr.prompt.generate')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ASRSubtitlePrompt
