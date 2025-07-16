import { locales } from '@main/utils/locales'
import { defaultLanguage, UpgradeChannel } from '@shared/config/constant'
import type { LanguageVarious, Shortcut } from '@types'
import { ThemeMode } from '@types'
import { app } from 'electron'
import { Conf } from 'electron-conf/main'

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
  DisableHardwareAcceleration = 'disableHardwareAcceleration'
}

export class ConfigManager {
  private store: Conf
  private subscribers: Map<string, Array<(newValue: any) => void>> = new Map()

  constructor() {
    this.store = new Conf()
  }

  getTheme(): ThemeMode {
    return this.get(ConfigKeys.Theme, ThemeMode.system)
  }

  setTheme(theme: ThemeMode) {
    this.set(ConfigKeys.Theme, theme)
  }

  getLanguage(): LanguageVarious {
    const locale = Object.keys(locales).includes(app.getLocale())
      ? app.getLocale()
      : defaultLanguage
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
    return this.get<boolean>(ConfigKeys.AutoUpdate, true)
  }

  setAutoUpdate(value: boolean) {
    this.set(ConfigKeys.AutoUpdate, value)
  }

  getTestChannel(): UpgradeChannel {
    return this.get<UpgradeChannel>(ConfigKeys.TestChannel)
  }

  setTestChannel(value: UpgradeChannel) {
    this.set(ConfigKeys.TestChannel, value)
  }

  getTestPlan(): boolean {
    return this.get<boolean>(ConfigKeys.TestPlan, false)
  }

  setTestPlan(value: boolean) {
    this.set(ConfigKeys.TestPlan, value)
  }

  getLaunchToTray(): boolean {
    return !!this.get(ConfigKeys.LaunchToTray, false)
  }

  setLaunchToTray(value: boolean) {
    this.set(ConfigKeys.LaunchToTray, value)
  }

  getTray(): boolean {
    return !!this.get(ConfigKeys.Tray, true)
  }

  setTray(value: boolean) {
    this.setAndNotify(ConfigKeys.Tray, value)
  }

  getTrayOnClose(): boolean {
    return !!this.get(ConfigKeys.TrayOnClose, true)
  }

  setTrayOnClose(value: boolean) {
    this.set(ConfigKeys.TrayOnClose, value)
  }

  getDisableHardwareAcceleration(): boolean {
    return this.get<boolean>(ConfigKeys.DisableHardwareAcceleration, false)
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
    return this.store.get(key, defaultValue) as T
  }
}

export const configManager = new ConfigManager()
