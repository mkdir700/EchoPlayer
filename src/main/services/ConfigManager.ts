import { locales } from '@main/utils/locales'
import { defaultLanguage, UpgradeChannel } from '@shared/config/constant'
import type { LanguageVarious, Shortcut } from '@types'
import { ThemeMode } from '@types'
import { app } from 'electron'
import { Conf } from 'electron-conf/main'

// 根据应用版本动态设置测试相关的默认值
function getVersionBasedDefaults() {
  const version = app.getVersion()

  // 检查版本是否包含 alpha, beta 等标识
  if (version.includes('alpha')) {
    return {
      testChannel: UpgradeChannel.ALPHA,
      testPlan: true
    }
  } else if (version.includes('beta')) {
    return {
      testChannel: UpgradeChannel.BETA,
      testPlan: true
    }
  } else {
    return {
      testChannel: UpgradeChannel.LATEST,
      testPlan: false
    }
  }
}

export enum ConfigKeys {
  Language = 'language',
  Theme = 'theme',
  LaunchToTray = 'launchToTray',
  Tray = 'tray',
  TrayOnClose = 'trayOnClose',
  Shortcuts = 'shortcuts',
  AutoUpdate = 'autoUpdate',
  TestChannel = 'testChannel',
  TestPlan = 'testPlan',
  SpellCheckLanguages = 'spellCheckLanguages',
  DisableHardwareAcceleration = 'disableHardwareAcceleration',
  // ASR 相关配置
  DeepgramApiKey = 'deepgramApiKey',
  ASRDefaultLanguage = 'asrDefaultLanguage',
  ASRModel = 'asrModel'
}

// 获取基于版本的动态默认值
const versionBasedDefaults = getVersionBasedDefaults()

const defaultValues: Record<ConfigKeys, any> = {
  [ConfigKeys.Language]: defaultLanguage,
  [ConfigKeys.Theme]: ThemeMode.system,
  [ConfigKeys.LaunchToTray]: false,
  [ConfigKeys.Tray]: true,
  [ConfigKeys.TrayOnClose]: true,
  [ConfigKeys.Shortcuts]: [],
  [ConfigKeys.AutoUpdate]: true,
  [ConfigKeys.TestChannel]: versionBasedDefaults.testChannel,
  [ConfigKeys.TestPlan]: versionBasedDefaults.testPlan,
  [ConfigKeys.SpellCheckLanguages]: [] as string[],
  [ConfigKeys.DisableHardwareAcceleration]: false,
  // ASR 默认配置
  [ConfigKeys.DeepgramApiKey]: '',
  [ConfigKeys.ASRDefaultLanguage]: 'en',
  [ConfigKeys.ASRModel]: 'nova-3'
}

export class ConfigManager {
  private store: Conf
  private subscribers: Map<string, Array<(newValue: any) => void>> = new Map()

  constructor() {
    this.store = new Conf()
  }

  getTheme(): ThemeMode {
    return this.get(ConfigKeys.Theme, defaultValues[ConfigKeys.Theme])
  }

  setTheme(theme: ThemeMode) {
    this.set(ConfigKeys.Theme, theme)
  }

  getLanguage(): LanguageVarious {
    const locale = Object.keys(locales).includes(app.getLocale())
      ? app.getLocale()
      : defaultValues[ConfigKeys.Language]
    return this.get(ConfigKeys.Language, locale) as LanguageVarious
  }

  setLanguage(lang: LanguageVarious) {
    this.setAndNotify(ConfigKeys.Language, lang)
  }

  getShortcuts() {
    return this.get(ConfigKeys.Shortcuts) as Shortcut[] | []
  }

  setShortcuts(shortcuts: Shortcut[]) {
    this.setAndNotify(
      ConfigKeys.Shortcuts,
      shortcuts.filter((shortcut) => shortcut.system)
    )
  }

  getAutoUpdate(): boolean {
    return this.get<boolean>(ConfigKeys.AutoUpdate, defaultValues[ConfigKeys.AutoUpdate])
  }

  setAutoUpdate(value: boolean) {
    this.set(ConfigKeys.AutoUpdate, value)
  }

  getTestChannel(): UpgradeChannel {
    return this.get<UpgradeChannel>(ConfigKeys.TestChannel, defaultValues[ConfigKeys.TestChannel])
  }

  setTestChannel(value: UpgradeChannel) {
    this.set(ConfigKeys.TestChannel, value)
  }

  getTestPlan(): boolean {
    return this.get<boolean>(ConfigKeys.TestPlan, defaultValues[ConfigKeys.TestPlan])
  }

  setTestPlan(value: boolean) {
    this.set(ConfigKeys.TestPlan, value)
  }

  getLaunchToTray(): boolean {
    return !!this.get(ConfigKeys.LaunchToTray, defaultValues[ConfigKeys.LaunchToTray])
  }

  setLaunchToTray(value: boolean) {
    this.set(ConfigKeys.LaunchToTray, value)
  }

  getTray(): boolean {
    return !!this.get(ConfigKeys.Tray, defaultValues[ConfigKeys.Tray])
  }

  setTray(value: boolean) {
    this.setAndNotify(ConfigKeys.Tray, value)
  }

  getTrayOnClose(): boolean {
    return !!this.get(ConfigKeys.TrayOnClose, defaultValues[ConfigKeys.TrayOnClose])
  }

  setTrayOnClose(value: boolean) {
    this.set(ConfigKeys.TrayOnClose, value)
  }

  getDisableHardwareAcceleration(): boolean {
    return this.get<boolean>(
      ConfigKeys.DisableHardwareAcceleration,
      defaultValues[ConfigKeys.DisableHardwareAcceleration]
    )
  }

  setDisableHardwareAcceleration(value: boolean) {
    this.set(ConfigKeys.DisableHardwareAcceleration, value)
  }

  subscribe<T>(key: string, callback: (newValue: T) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, [])
    }
    this.subscribers.get(key)!.push(callback)
  }

  unsubscribe<T>(key: string, callback: (newValue: T) => void) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      this.subscribers.set(
        key,
        subscribers.filter((subscriber) => subscriber !== callback)
      )
    }
  }

  private notifySubscribers<T>(key: string, newValue: T) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((subscriber) => subscriber(newValue))
    }
  }

  /**
   * 设置配置项并通知订阅者
   * @param key 配置项键
   * @param value 配置项值
   */
  setAndNotify(key: string, value: unknown) {
    this.set(key, value, true)
  }

  /**
   * 设置配置项
   * @param key 配置项键
   * @param value 配置项值
   * @param isNotify 是否通知订阅者
   */
  set(key: string, value: unknown, isNotify: boolean = false) {
    this.store.set(key, value)
    isNotify && this.notifySubscribers(key, value)
  }

  /**
   * 获取配置项
   * @param key 配置项键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T) {
    return this.store.get(key, defaultValue ? defaultValue : defaultValues[key]) as T
  }

  // ASR 相关配置方法
  getDeepgramApiKey(): string {
    return this.get(ConfigKeys.DeepgramApiKey, '')
  }

  setDeepgramApiKey(apiKey: string) {
    this.set(ConfigKeys.DeepgramApiKey, apiKey)
  }

  getASRDefaultLanguage(): string {
    return this.get(ConfigKeys.ASRDefaultLanguage, 'en')
  }

  setASRDefaultLanguage(language: string) {
    this.set(ConfigKeys.ASRDefaultLanguage, language)
  }

  getASRModel(): string {
    return this.get(ConfigKeys.ASRModel, 'nova-3')
  }

  setASRModel(model: string) {
    this.set(ConfigKeys.ASRModel, model)
  }
}

export const configManager = new ConfigManager()
