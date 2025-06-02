import React, { useState, useEffect } from 'react'
import { Card, Select, Input, Typography, Alert, Button, InputNumber, Slider, App } from 'antd'
import {
  CloudOutlined,
  LinkOutlined,
  ExperimentOutlined,
  KeyOutlined,
  RobotOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import type {
  DictionaryEngine,
  DictionaryEngineOption,
  OpenAIModel,
  OpenAIModelOption,
  ThirdPartyServicesSettings
} from '@renderer/types'
import { DictionaryServiceFactory } from '@renderer/utils/dictionaryServices'
import styles from './Settings.module.css'

const { Text, Link } = Typography

interface ThirdPartyServicesSectionProps {
  className?: string
}

const DICTIONARY_ENGINES: DictionaryEngineOption[] = [
  {
    key: 'eudic',
    label: '欧陆词典',
    description: '专业的英语词典，支持详细释义和例句',
    requiresAuth: true
  },
  {
    key: 'youdao',
    label: '有道词典',
    description: '网易有道在线词典服务',
    requiresAuth: true
  },
  {
    key: 'eudic-html',
    label: '欧陆词典 (网页版)',
    description: '通过解析欧陆词典网页获取词典数据，无需API密钥',
    requiresAuth: false
  }
]

const OPENAI_MODELS: OpenAIModelOption[] = [
  {
    key: 'gpt-4o-mini',
    label: 'GPT-4o Mini'
  },
  {
    key: 'gpt-4o',
    label: 'GPT-4o'
  },
  {
    key: 'gpt-4-turbo',
    label: 'GPT-4 Turbo'
  },
  {
    key: 'gpt-4',
    label: 'GPT-4'
  },
  {
    key: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo'
  }
]

export function ThirdPartyServicesSection({
  className
}: ThirdPartyServicesSectionProps): React.JSX.Element {
  // FIXME: 需要提前在 App.tsx 中引入 antd 的 APP，否则 message 会报错
  // 但是引入了 antd 的 APP 后，会导致卡顿，操作延迟变高
  const { message } = App.useApp()

  const [settings, setSettings] = useState<ThirdPartyServicesSettings>({
    openai: {
      apiKey: '',
      selectedModel: null,
      baseUrl: 'https://api.openai.com/v1',
      maxTokens: 1000,
      temperature: 0.2
    },
    dictionary: {
      selectedEngine: 'eudic-html',
      eudicApiToken: '',
      youdaoApiKey: '',
      youdaoApiSecret: ''
    }
  })

  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false)
  const [isTestingDictionary, setIsTestingDictionary] = useState(false)

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('thirdPartyServicesSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error('Failed to parse third party services settings:', error)
      }
    }
  }, [])

  // 自动保存设置到本地存储
  useEffect(() => {
    const saveSettings = (): void => {
      try {
        localStorage.setItem('thirdPartyServicesSettings', JSON.stringify(settings))
      } catch (error) {
        console.error('Failed to save third party services settings:', error)
      }
    }

    // 延迟保存，避免频繁写入
    const timeoutId = setTimeout(saveSettings, 500)
    return () => clearTimeout(timeoutId)
  }, [settings])

  // 测试 OpenAI API 连接
  const testOpenAIConnection = async (): Promise<void> => {
    if (!settings.openai.apiKey || !settings.openai.selectedModel) {
      message.warning('请先配置 API Key 和选择模型')
      return
    }

    setIsTestingOpenAI(true)
    try {
      const response = await fetch(`${settings.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.openai.apiKey}`
        },
        body: JSON.stringify({
          model: settings.openai.selectedModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
          temperature: settings.openai.temperature
        })
      })

      if (response.ok) {
        message.success('OpenAI API 连接测试成功！')
      } else {
        const errorData = await response.json()
        message.error(`API 连接失败: ${errorData.error?.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('OpenAI API test failed:', error)
      message.error('API 连接测试失败，请检查网络连接和配置')
    } finally {
      setIsTestingOpenAI(false)
    }
  }

  // 测试词典 API 连接
  const testDictionaryConnection = async (): Promise<void> => {
    if (!settings.dictionary.selectedEngine) {
      message.warning('请先选择词典引擎')
      return
    }

    setIsTestingDictionary(true)
    try {
      const result = await DictionaryServiceFactory.testService(
        settings.dictionary.selectedEngine,
        settings.dictionary
      )

      if (result.success) {
        console.log('result', result)
        message.success(result.message)
      } else {
        console.log('result', result)
        message.error(result.message)
      }
    } catch (error) {
      console.error('Dictionary API test failed:', error)
      message.error('词典 API 连接测试失败')
    } finally {
      setIsTestingDictionary(false)
    }
  }

  // 处理 OpenAI 设置变化
  const handleOpenAIChange = (
    field: keyof typeof settings.openai,
    value: string | number | OpenAIModel
  ): void => {
    setSettings((prev) => ({
      ...prev,
      openai: {
        ...prev.openai,
        [field]: value
      }
    }))
  }

  // 处理词典设置变化
  const handleDictionaryChange = (
    field: keyof typeof settings.dictionary,
    value: string | DictionaryEngine
  ): void => {
    setSettings((prev) => ({
      ...prev,
      dictionary: {
        ...prev.dictionary,
        [field]: value
      }
    }))
  }

  // 检查 OpenAI 配置是否完整
  const isOpenAIConfigComplete = (): boolean => {
    return !!(settings.openai.apiKey && settings.openai.selectedModel)
  }

  // 检查词典配置是否完整
  const isDictionaryConfigComplete = (): boolean => {
    if (!settings.dictionary.selectedEngine) return false

    if (settings.dictionary.selectedEngine === 'eudic') {
      return !!settings.dictionary.eudicApiToken
    }

    if (settings.dictionary.selectedEngine === 'youdao') {
      return !!(settings.dictionary.youdaoApiKey && settings.dictionary.youdaoApiSecret)
    }

    if (settings.dictionary.selectedEngine === 'eudic-html') {
      // HTML解析服务不需要API密钥，总是可用
      return true
    }

    return false
  }

  // 渲染 OpenAI 配置
  const renderOpenAIConfig = (): React.JSX.Element => {
    return (
      <div className={styles.configSection}>
        <div className={styles.inputGroup}>
          <Text className={styles.inputLabel}>API Key</Text>
          <Input.Password
            placeholder="请输入 OpenAI API Key (sk-...)"
            value={settings.openai.apiKey}
            onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
            size="large"
          />
        </div>

        <div className={styles.inputGroup}>
          <Text className={styles.inputLabel}>API 基础地址</Text>
          <Input
            placeholder="https://api.openai.com/v1"
            value={settings.openai.baseUrl}
            onChange={(e) => handleOpenAIChange('baseUrl', e.target.value)}
            size="large"
          />
        </div>

        <div className={styles.inputGroup}>
          <Text className={styles.inputLabel}>选择模型</Text>
          <Select
            placeholder="请选择 OpenAI 模型"
            value={settings.openai.selectedModel}
            onChange={(value) => handleOpenAIChange('selectedModel', value)}
            size="large"
            options={OPENAI_MODELS.map((model) => ({
              value: model.key,
              label: (
                <div className={styles.engineOption}>
                  <div className={styles.engineName}>{model.label}</div>
                </div>
              )
            }))}
          />
        </div>

        <div className={styles.inputGroup}>
          <Text className={styles.inputLabel}>最大 Token 数量</Text>
          <InputNumber
            min={100}
            max={settings.openai.maxTokens}
            value={settings.openai.maxTokens}
            onChange={(value) => handleOpenAIChange('maxTokens', value || 1000)}
            size="large"
            style={{ width: '100%' }}
          />
        </div>

        <div className={styles.inputGroup}>
          <Text className={styles.inputLabel}>
            温度参数 (Temperature): {settings.openai.temperature}
          </Text>
          <div>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={settings.openai.temperature}
              onChange={(value) => handleOpenAIChange('temperature', value)}
              marks={{
                0: '精确',
                1: '平衡',
                2: '创意'
              }}
            />
          </div>
        </div>

        <Alert
          message={
            <span className={styles.alertContent}>
              如需获取 API Key，请访问{' '}
              <Link
                href="https://platform.openai.com/api-keys"
                target="_blank"
                className={styles.alertLink}
              >
                <LinkOutlined /> OpenAI 平台
              </Link>{' '}
              创建 API 密钥
            </span>
          }
          type="info"
          showIcon
        />
      </div>
    )
  }

  // 渲染词典配置
  const renderDictionaryConfig = (): React.JSX.Element | null => {
    if (!settings.dictionary.selectedEngine) return null

    const selectedEngineOption = DICTIONARY_ENGINES.find(
      (engine) => engine.key === settings.dictionary.selectedEngine
    )
    if (!selectedEngineOption || !selectedEngineOption.requiresAuth) return null

    return (
      <div className={styles.engineConfigContainer}>
        {settings.dictionary.selectedEngine === 'eudic' && (
          <div className={styles.configSection}>
            <div className={styles.configHeader}>
              <KeyOutlined className={styles.configIcon} />
              <Text className={styles.configTitle}>欧陆词典 API 配置</Text>
            </div>

            <div className={styles.inputGroup}>
              <Text className={styles.inputLabel}>API Token</Text>
              <Input.Password
                placeholder="请输入欧陆词典 API Token"
                value={settings.dictionary.eudicApiToken}
                onChange={(e) => handleDictionaryChange('eudicApiToken', e.target.value)}
                size="large"
              />
            </div>

            <Alert
              message={
                <span className={styles.alertContent}>
                  如需获取 API Token，请访问{' '}
                  <Link
                    href="https://my.eudic.net/OpenAPI/Authorization"
                    target="_blank"
                    className={styles.alertLink}
                  >
                    <LinkOutlined /> 欧陆词典开放平台
                  </Link>
                </span>
              }
              type="info"
              showIcon
            />
          </div>
        )}

        {settings.dictionary.selectedEngine === 'youdao' && (
          <div className={styles.configSection}>
            <div className={styles.configHeader}>
              <KeyOutlined className={styles.configIcon} />
              <Text className={styles.configTitle}>有道词典 API 配置</Text>
            </div>

            <div className={styles.inputGroup}>
              <Text className={styles.inputLabel}>应用ID</Text>
              <Input.Password
                placeholder="请输入应用ID"
                value={settings.dictionary.youdaoApiKey}
                onChange={(e) => handleDictionaryChange('youdaoApiKey', e.target.value)}
                size="large"
              />
            </div>

            <div className={styles.inputGroup}>
              <Text className={styles.inputLabel}>密钥</Text>
              <Input.Password
                placeholder="请输入密钥"
                value={settings.dictionary.youdaoApiSecret}
                onChange={(e) => handleDictionaryChange('youdaoApiSecret', e.target.value)}
                size="large"
              />
            </div>
            <Alert
              message={
                <span className={styles.alertContent}>
                  申请应用ID和密钥，请访问{' '}
                  <Link
                    href="https://ai.youdao.com/console/#/app-overview/create-application"
                    target="_blank"
                    className={styles.alertLink}
                  >
                    <LinkOutlined /> 有道智云开放平台
                  </Link>
                </span>
              }
              type="info"
              showIcon
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${className || ''} ${styles.servicesContainer}`}>
      {/* OpenAI 配置卡片 */}
      <Card
        title={
          <div className={styles.cardTitle}>
            <RobotOutlined className={styles.titleIcon} />
            <span className={styles.titleText}>OpenAI 模型配置</span>
          </div>
        }
        className={styles.modernCard}
        extra={
          <Button
            type="primary"
            icon={isTestingOpenAI ? <LoadingOutlined /> : <ExperimentOutlined />}
            className={styles.saveButton}
            onClick={testOpenAIConnection}
            disabled={!isOpenAIConfigComplete() || isTestingOpenAI}
            loading={isTestingOpenAI}
          >
            {isTestingOpenAI ? '测试中...' : '测试连接'}
          </Button>
        }
      >
        <div className={styles.cardContent}>
          <div className={styles.engineSelection}>
            <div className={styles.selectionHeader}>
              <Text className={styles.sectionDescription}>
                配置 OpenAI API 以启用 AI 功能，如智能翻译、语法分析等。配置会自动保存。
              </Text>
            </div>
          </div>
          {renderOpenAIConfig()}
        </div>
      </Card>

      {/* 词典配置卡片 */}
      <Card
        title={
          <div className={styles.cardTitle}>
            <CloudOutlined className={styles.titleIcon} />
            <span className={styles.titleText}>词典服务配置</span>
          </div>
        }
        className={styles.modernCard}
        extra={
          <Button
            type="primary"
            icon={isTestingDictionary ? <LoadingOutlined /> : <ExperimentOutlined />}
            className={styles.saveButton}
            onClick={testDictionaryConnection}
            disabled={!isDictionaryConfigComplete() || isTestingDictionary}
            loading={isTestingDictionary}
          >
            {isTestingDictionary ? '测试中...' : '测试连接'}
          </Button>
        }
      >
        <div className={styles.cardContent}>
          <div className={styles.engineSelection}>
            <div className={styles.selectionHeader}>
              <Text className={styles.sectionDescription}>
                配置词典服务以启用查词功能。配置会自动保存。
              </Text>
            </div>
          </div>

          <div className={styles.engineSelection}>
            <div className={styles.selectionHeader}>
              <Text className={styles.sectionLabel}>选择查词引擎</Text>
              <Text className={styles.sectionDescription}>选择您偏好的词典服务提供商</Text>
            </div>

            <Select
              placeholder="请选择查词引擎"
              value={settings.dictionary.selectedEngine}
              onChange={(value) => handleDictionaryChange('selectedEngine', value)}
              className={styles.modernSelect}
              size="large"
              options={DICTIONARY_ENGINES.map((engine) => ({
                value: engine.key,
                label: (
                  <div className={styles.engineOption}>
                    <div className={styles.engineName}>{engine.label}</div>
                    <div className={styles.engineDescription}>{engine.description}</div>
                  </div>
                )
              }))}
            />
          </div>

          {renderDictionaryConfig()}

          {!settings.dictionary.selectedEngine && (
            <Alert
              message="请选择一个查词引擎以继续配置"
              type="warning"
              showIcon
              className={styles.warningAlert}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
