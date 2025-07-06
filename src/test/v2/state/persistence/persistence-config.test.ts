/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { PersistenceStrategy } from '@renderer/v2/state/persistence/persistence-manager'
import {
  // Configuration objects
  videoPersistenceConfig,
  subtitlePersistenceConfig,
  playbackPersistenceConfig,
  uiPersistenceConfig,
  appConfigPersistenceConfig,
  userPreferencesPersistenceConfig,
  cachePersistenceConfig,

  // Configuration map and utilities
  persistenceConfigMap,
  getPersistenceConfig,
  createCustomPersistenceConfig,

  // Presets and factories
  persistenceStrategyPresets,
  validatorFactory,
  persistenceConfigUtils,

  // Types
  type PersistenceConfigKey
} from '@renderer/v2/state/persistence/persistence-config'

describe('Persistence Config / 持久化配置', () => {
  describe('Configuration Objects / 配置对象', () => {
    describe('videoPersistenceConfig / 视频持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(videoPersistenceConfig).toEqual({
          key: 'v2-video-state',
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 2000,
          maxRetries: 3,
          retryDelay: 1000,
          compress: false,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate video data structure / 应该验证视频数据结构', () => {
        const validData = {
          recentPlays: [],
          playbackSettingsCache: {},
          uiConfigCache: {}
        }

        const invalidData = {
          recentPlays: 'not-array',
          playbackSettingsCache: {},
          uiConfigCache: {}
        }

        expect(videoPersistenceConfig.validator!(validData)).toBe(true)
        expect(videoPersistenceConfig.validator!(invalidData)).toBeFalsy()
      })
    })

    describe('subtitlePersistenceConfig / 字幕持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(subtitlePersistenceConfig).toEqual({
          key: 'v2-subtitle-state',
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 1500,
          maxRetries: 3,
          retryDelay: 1000,
          compress: false,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate subtitle data structure / 应该验证字幕数据结构', () => {
        const validData = {
          displayConfig: {},
          subtitleCache: {}
        }

        const invalidData = {
          displayConfig: 'not-object',
          subtitleCache: {}
        }

        expect(subtitlePersistenceConfig.validator!(validData)).toBe(true)
        expect(subtitlePersistenceConfig.validator!(invalidData)).toBeFalsy()
      })
    })

    describe('playbackPersistenceConfig / 播放控制持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(playbackPersistenceConfig).toEqual({
          key: 'v2-playback-state',
          strategy: PersistenceStrategy.THROTTLED,
          delay: 3000,
          maxRetries: 3,
          retryDelay: 1000,
          compress: false,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate playback data structure / 应该验证播放数据结构', () => {
        const validData = {
          controlConfig: {},
          loopConfig: {},
          statistics: {}
        }

        const invalidData = {
          controlConfig: {},
          loopConfig: 'not-object',
          statistics: {}
        }

        expect(playbackPersistenceConfig.validator!(validData)).toBe(true)
        expect(playbackPersistenceConfig.validator!(invalidData)).toBeFalsy()
      })
    })

    describe('uiPersistenceConfig / 界面持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(uiPersistenceConfig).toEqual({
          key: 'v2-ui-state',
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 1000,
          maxRetries: 3,
          retryDelay: 1000,
          compress: false,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate UI data structure / 应该验证界面数据结构', () => {
        const validData = {
          themeMode: 'dark',
          layoutMode: 'standard',
          autoResumeAfterWordCard: true
        }

        const invalidData = {
          themeMode: 123,
          layoutMode: 'standard',
          autoResumeAfterWordCard: true
        }

        expect(uiPersistenceConfig.validator!(validData)).toBe(true)
        expect(uiPersistenceConfig.validator!(invalidData)).toBeFalsy()
      })
    })

    describe('appConfigPersistenceConfig / 应用配置持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(appConfigPersistenceConfig).toEqual({
          key: 'v2-app-config',
          strategy: PersistenceStrategy.IMMEDIATE,
          maxRetries: 5,
          retryDelay: 500,
          compress: false,
          encrypt: true,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate app config data structure / 应该验证应用配置数据结构', () => {
        const validData = { setting: 'value' }

        expect(appConfigPersistenceConfig.validator!(validData)).toBe(true)
      })
    })

    describe('userPreferencesPersistenceConfig / 用户偏好持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(userPreferencesPersistenceConfig).toEqual({
          key: 'v2-user-preferences',
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 2000,
          maxRetries: 3,
          retryDelay: 1000,
          compress: false,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate user preferences data structure / 应该验证用户偏好数据结构', () => {
        const validData = { preference: 'value' }

        expect(userPreferencesPersistenceConfig.validator!(validData)).toBe(true)
      })
    })

    describe('cachePersistenceConfig / 缓存持久化配置', () => {
      it('should have correct configuration / 应该有正确的配置', () => {
        expect(cachePersistenceConfig).toEqual({
          key: 'v2-cache-data',
          strategy: PersistenceStrategy.MANUAL,
          maxRetries: 2,
          retryDelay: 2000,
          compress: true,
          encrypt: false,
          version: 1,
          validator: expect.any(Function)
        })
      })

      it('should validate cache data structure / 应该验证缓存数据结构', () => {
        const validData = { cache: 'value' }

        expect(cachePersistenceConfig.validator!(validData)).toBe(true)
      })
    })
  })

  describe('Configuration Map and Utilities / 配置映射和工具', () => {
    describe('persistenceConfigMap / 持久化配置映射', () => {
      it('should contain all configuration keys / 应该包含所有配置键', () => {
        const expectedKeys = [
          'video',
          'subtitle',
          'playback',
          'ui',
          'appConfig',
          'userPreferences',
          'cache'
        ]

        expectedKeys.forEach((key) => {
          expect(persistenceConfigMap).toHaveProperty(key)
        })
      })

      it('should map to correct configurations / 应该映射到正确的配置', () => {
        expect(persistenceConfigMap.video).toBe(videoPersistenceConfig)
        expect(persistenceConfigMap.subtitle).toBe(subtitlePersistenceConfig)
        expect(persistenceConfigMap.playback).toBe(playbackPersistenceConfig)
        expect(persistenceConfigMap.ui).toBe(uiPersistenceConfig)
        expect(persistenceConfigMap.appConfig).toBe(appConfigPersistenceConfig)
        expect(persistenceConfigMap.userPreferences).toBe(userPreferencesPersistenceConfig)
        expect(persistenceConfigMap.cache).toBe(cachePersistenceConfig)
      })
    })

    describe('getPersistenceConfig / 获取持久化配置', () => {
      it('should return correct configuration for valid keys / 应该为有效键返回正确配置', () => {
        expect(getPersistenceConfig('video')).toBe(videoPersistenceConfig)
        expect(getPersistenceConfig('subtitle')).toBe(subtitlePersistenceConfig)
        expect(getPersistenceConfig('playback')).toBe(playbackPersistenceConfig)
        expect(getPersistenceConfig('ui')).toBe(uiPersistenceConfig)
        expect(getPersistenceConfig('appConfig')).toBe(appConfigPersistenceConfig)
        expect(getPersistenceConfig('userPreferences')).toBe(userPreferencesPersistenceConfig)
        expect(getPersistenceConfig('cache')).toBe(cachePersistenceConfig)
      })
    })

    describe('createCustomPersistenceConfig / 创建自定义持久化配置', () => {
      it('should create custom configuration with overrides / 应该创建带覆盖的自定义配置', () => {
        const customConfig = createCustomPersistenceConfig('video', {
          delay: 5000,
          maxRetries: 10,
          encrypt: true
        })

        expect(customConfig).toEqual({
          ...videoPersistenceConfig,
          delay: 5000,
          maxRetries: 10,
          encrypt: true
        })
      })

      it('should preserve original configuration / 应该保留原始配置', () => {
        const originalConfig = getPersistenceConfig('video')
        createCustomPersistenceConfig('video', { delay: 9999 })

        expect(getPersistenceConfig('video')).toBe(originalConfig)
      })

      it('should handle partial overrides / 应该处理部分覆盖', () => {
        const customConfig = createCustomPersistenceConfig('ui', {
          compress: true
        })

        expect(customConfig.compress).toBe(true)
        expect(customConfig.key).toBe(uiPersistenceConfig.key)
        expect(customConfig.strategy).toBe(uiPersistenceConfig.strategy)
      })
    })
  })

  describe('Strategy Presets / 策略预设', () => {
    describe('persistenceStrategyPresets / 持久化策略预设', () => {
      it('should have realTime preset / 应该有实时预设', () => {
        expect(persistenceStrategyPresets.realTime).toEqual({
          strategy: PersistenceStrategy.IMMEDIATE,
          maxRetries: 5,
          retryDelay: 500
        })
      })

      it('should have quickResponse preset / 应该有快速响应预设', () => {
        expect(persistenceStrategyPresets.quickResponse).toEqual({
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 500,
          maxRetries: 3,
          retryDelay: 1000
        })
      })

      it('should have balanced preset / 应该有平衡预设', () => {
        expect(persistenceStrategyPresets.balanced).toEqual({
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 2000,
          maxRetries: 3,
          retryDelay: 1000
        })
      })

      it('should have economy preset / 应该有节约预设', () => {
        expect(persistenceStrategyPresets.economy).toEqual({
          strategy: PersistenceStrategy.THROTTLED,
          delay: 5000,
          maxRetries: 2,
          retryDelay: 2000
        })
      })

      it('should have manual preset / 应该有手动预设', () => {
        expect(persistenceStrategyPresets.manual).toEqual({
          strategy: PersistenceStrategy.MANUAL,
          maxRetries: 3,
          retryDelay: 1000
        })
      })
    })
  })

  describe('Validator Factory / 验证器工厂', () => {
    describe('createObjectValidator / 创建对象验证器', () => {
      it('should validate objects with required keys / 应该验证具有必需键的对象', () => {
        const validator = validatorFactory.createObjectValidator(['name', 'age'])

        expect(validator({ name: 'John', age: 30 })).toBe(true)
        expect(validator({ name: 'John', age: 30, extra: 'value' })).toBe(true)
        expect(validator({ name: 'John' })).toBe(false)
        expect(validator({ age: 30 })).toBe(false)
        expect(validator(null)).toBe(false)
        expect(validator('string')).toBe(false)
      })

      it('should handle empty required keys / 应该处理空的必需键', () => {
        const validator = validatorFactory.createObjectValidator([])

        expect(validator({})).toBe(true)
        expect(validator({ any: 'value' })).toBe(true)
        expect(validator(null)).toBe(false)
      })
    })

    describe('createArrayValidator / 创建数组验证器', () => {
      it('should validate arrays without item validator / 应该验证没有项验证器的数组', () => {
        const validator = validatorFactory.createArrayValidator()

        expect(validator([])).toBe(true)
        expect(validator([1, 2, 3])).toBe(true)
        expect(validator(['a', 'b'])).toBe(true)
        expect(validator(null)).toBe(false)
        expect(validator({})).toBe(false)
      })

      it('should validate arrays with item validator / 应该验证有项验证器的数组', () => {
        const itemValidator = (item: unknown): any => typeof item === 'string'
        const validator = validatorFactory.createArrayValidator(itemValidator)

        expect(validator(['a', 'b', 'c'])).toBe(true)
        expect(validator([])).toBe(true)
        expect(validator(['a', 1, 'c'])).toBe(false)
        expect(validator([1, 2, 3])).toBe(false)
      })
    })

    describe('createTypeValidator / 创建类型验证器', () => {
      it('should validate string type / 应该验证字符串类型', () => {
        const validator = validatorFactory.createTypeValidator('string')

        expect(validator('hello')).toBe(true)
        expect(validator('')).toBe(true)
        expect(validator(123)).toBe(false)
        expect(validator(null)).toBe(false)
      })

      it('should validate number type / 应该验证数字类型', () => {
        const validator = validatorFactory.createTypeValidator('number')

        expect(validator(123)).toBe(true)
        expect(validator(0)).toBe(true)
        expect(validator(-5)).toBe(true)
        expect(validator('123')).toBe(false)
        expect(validator(null)).toBe(false)
      })

      it('should validate boolean type / 应该验证布尔类型', () => {
        const validator = validatorFactory.createTypeValidator('boolean')

        expect(validator(true)).toBe(true)
        expect(validator(false)).toBe(true)
        expect(validator(0)).toBe(false)
        expect(validator('true')).toBe(false)
      })
    })

    describe('createCompositeValidator / 创建组合验证器', () => {
      it('should validate with all validators / 应该使用所有验证器进行验证', () => {
        const validators = [
          (data: unknown) => typeof data === 'object' && data !== null,
          (data: unknown) => 'name' in (data as object),
          (data: unknown) => 'age' in (data as object)
        ]
        const validator = validatorFactory.createCompositeValidator(validators)

        expect(validator({ name: 'John', age: 30 })).toBe(true)
        expect(validator({ name: 'John' })).toBe(false)
        expect(validator({ age: 30 })).toBe(false)
        expect(validator(null)).toBe(false)
        expect(validator('string')).toBe(false)
      })

      it('should handle empty validators array / 应该处理空验证器数组', () => {
        const validator = validatorFactory.createCompositeValidator([])

        expect(validator(null)).toBe(true)
        expect(validator({})).toBe(true)
        expect(validator('anything')).toBe(true)
      })
    })
  })

  describe('Persistence Config Utils / 持久化配置工具', () => {
    describe('validateConfig / 验证配置', () => {
      it('should validate valid configuration / 应该验证有效配置', () => {
        const result = persistenceConfigUtils.validateConfig(videoPersistenceConfig)

        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should detect invalid key / 应该检测无效键', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          key: ''
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('配置键名无效')
      })

      it('should detect invalid strategy / 应该检测无效策略', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,

          strategy: 'invalid-strategy' as any
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('持久化策略无效')
      })

      it('should detect invalid delay / 应该检测无效延迟', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          delay: -1
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('延迟时间无效')
      })

      it('should detect invalid maxRetries / 应该检测无效最大重试次数', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          maxRetries: -1
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('最大重试次数无效')
      })

      it('should detect invalid retryDelay / 应该检测无效重试延迟', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          retryDelay: -1
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('重试延迟无效')
      })

      it('should detect invalid version / 应该检测无效版本', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          version: 0
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('版本号无效')
      })

      it('should accumulate multiple errors / 应该累积多个错误', () => {
        const invalidConfig = {
          ...videoPersistenceConfig,
          key: '',
          delay: -1,
          maxRetries: -1
        }

        const result = persistenceConfigUtils.validateConfig(invalidConfig)

        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(3)
      })
    })

    describe('mergeConfigs / 合并配置', () => {
      it('should merge multiple configurations / 应该合并多个配置', () => {
        const config1 = {
          key: 'test-key',
          strategy: PersistenceStrategy.DEBOUNCED
        }
        const config2 = {
          delay: 1000,
          maxRetries: 5
        }
        const config3 = {
          compress: true,
          encrypt: false
        }

        const merged = persistenceConfigUtils.mergeConfigs(config1, config2, config3)

        expect(merged).toEqual({
          key: 'test-key',
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 1000,
          maxRetries: 5,
          compress: true,
          encrypt: false
        })
      })

      it('should give priority to later configurations / 应该优先使用后面的配置', () => {
        const config1 = {
          key: 'test-key',
          strategy: PersistenceStrategy.IMMEDIATE,
          delay: 1000
        }
        const config2 = {
          strategy: PersistenceStrategy.DEBOUNCED,
          delay: 2000
        }

        const merged = persistenceConfigUtils.mergeConfigs(config1, config2)

        expect(merged.strategy).toBe(PersistenceStrategy.DEBOUNCED)
        expect(merged.delay).toBe(2000)
        expect(merged.key).toBe('test-key')
      })

      it('should throw error if key is missing / 应该在缺少键时抛出错误', () => {
        const config = {
          strategy: PersistenceStrategy.DEBOUNCED
        }

        expect(() => {
          persistenceConfigUtils.mergeConfigs(config)
        }).toThrow('合并后的配置缺少键名')
      })

      it('should set default strategy if missing / 应该在缺少策略时设置默认策略', () => {
        const config = {
          key: 'test-key'
        }

        const merged = persistenceConfigUtils.mergeConfigs(config)

        expect(merged.strategy).toBe(PersistenceStrategy.DEBOUNCED)
      })

      it('should handle empty configurations / 应该处理空配置', () => {
        const config = {
          key: 'test-key',
          strategy: PersistenceStrategy.IMMEDIATE
        }

        const merged = persistenceConfigUtils.mergeConfigs(config, {}, {})

        expect(merged).toEqual(config)
      })
    })
  })

  describe('Edge Cases and Error Handling / 边缘情况和错误处理', () => {
    describe('Data Validation Edge Cases / 数据验证边缘情况', () => {
      it('should handle undefined and null values / 应该处理undefined和null值', () => {
        const configs = [
          videoPersistenceConfig,
          subtitlePersistenceConfig,
          playbackPersistenceConfig,
          uiPersistenceConfig,
          appConfigPersistenceConfig,
          userPreferencesPersistenceConfig,
          cachePersistenceConfig
        ]

        configs.forEach((config) => {
          expect(config.validator!(undefined as any)).toBeFalsy()
          expect(config.validator!(null as any)).toBeFalsy()
        })
      })

      it('should handle primitive values / 应该处理原始值', () => {
        const configs = [
          videoPersistenceConfig,
          subtitlePersistenceConfig,
          playbackPersistenceConfig,
          uiPersistenceConfig,
          appConfigPersistenceConfig,
          userPreferencesPersistenceConfig,
          cachePersistenceConfig
        ]

        configs.forEach((config) => {
          expect(config.validator!('string' as any)).toBeFalsy()
          expect(config.validator!(123 as any)).toBeFalsy()
          expect(config.validator!(true as any)).toBeFalsy()
        })
      })

      it('should handle empty objects / 应该处理空对象', () => {
        expect(appConfigPersistenceConfig.validator!({})).toBe(true)
        expect(userPreferencesPersistenceConfig.validator!({})).toBe(true)
        expect(cachePersistenceConfig.validator!({})).toBe(true)

        expect(videoPersistenceConfig.validator!({})).toBeFalsy()
        expect(subtitlePersistenceConfig.validator!({})).toBeFalsy()
        expect(playbackPersistenceConfig.validator!({})).toBeFalsy()
        expect(uiPersistenceConfig.validator!({})).toBeFalsy()
      })
    })

    describe('Configuration Consistency / 配置一致性', () => {
      it('should maintain configuration object references / 应该保持配置对象引用', () => {
        const originalKey = videoPersistenceConfig.key
        const config1 = getPersistenceConfig('video')
        const config2 = getPersistenceConfig('video')

        expect(config1).toBe(config2)
        expect(config1.key).toBe(originalKey)
      })

      it('should maintain config map consistency / 应该保持配置映射一致性', () => {
        const originalConfig = persistenceConfigMap.video
        const retrievedConfig = getPersistenceConfig('video')

        expect(retrievedConfig).toBe(originalConfig)
        expect(persistenceConfigMap.video).toBe(originalConfig)
      })
    })

    describe('Type Safety / 类型安全', () => {
      it('should enforce correct key types / 应该强制正确的键类型', () => {
        // These should compile without error
        const validKeys: PersistenceConfigKey[] = [
          'video',
          'subtitle',
          'playback',
          'ui',
          'appConfig',
          'userPreferences',
          'cache'
        ]

        validKeys.forEach((key) => {
          expect(getPersistenceConfig(key)).toBeDefined()
        })
      })
    })
  })

  describe('Performance and Memory / 性能和内存', () => {
    it('should reuse configuration objects / 应该重用配置对象', () => {
      const config1 = getPersistenceConfig('video')
      const config2 = getPersistenceConfig('video')

      expect(config1).toBe(config2)
    })

    it('should not create new objects on repeated calls / 重复调用时不应该创建新对象', () => {
      const initialConfig = getPersistenceConfig('ui')

      for (let i = 0; i < 100; i++) {
        const config = getPersistenceConfig('ui')
        expect(config).toBe(initialConfig)
      }
    })

    it('should create new objects for custom configurations / 应该为自定义配置创建新对象', () => {
      const originalConfig = getPersistenceConfig('video')
      const customConfig1 = createCustomPersistenceConfig('video', { delay: 5000 })
      const customConfig2 = createCustomPersistenceConfig('video', { delay: 5000 })

      expect(customConfig1).not.toBe(originalConfig)
      expect(customConfig2).not.toBe(originalConfig)
      expect(customConfig1).not.toBe(customConfig2)
    })
  })
})
