import type { DictionarySettings } from '@renderer/types'

import { DictionaryServiceFactory } from './dictionaryServices'

// 测试词典服务的修复
export async function testDictionaryServices(): Promise<void> {
  console.log('开始测试词典服务...')

  // 测试有道词典
  const youdaoSettings: DictionarySettings = {
    selectedEngine: 'youdao',
    eudicApiToken: '',
    youdaoApiKey: 'your-youdao-api-key',
    youdaoApiSecret: 'your-youdao-api-secret'
  }

  try {
    console.log('测试有道词典连接...')
    const youdaoResult = await DictionaryServiceFactory.testService('youdao', youdaoSettings)
    console.log('有道词典测试结果:', youdaoResult)

    if (youdaoResult.success) {
      console.log('测试有道词典查词...')
      const service = DictionaryServiceFactory.createService('youdao', youdaoSettings)
      if (service) {
        const lookupResult = await service.lookupWord('hello')
        console.log('有道词典查词结果:', lookupResult)
      }
    }
  } catch (error) {
    console.error('有道词典测试失败:', error)
  }

  // 测试欧陆词典
  const eudicSettings: DictionarySettings = {
    selectedEngine: 'eudic',
    eudicApiToken: 'your-eudic-api-token',
    youdaoApiKey: '',
    youdaoApiSecret: ''
  }

  try {
    console.log('测试欧陆词典连接...')
    const eudicResult = await DictionaryServiceFactory.testService('eudic', eudicSettings)
    console.log('欧陆词典测试结果:', eudicResult)

    if (eudicResult.success) {
      console.log('测试欧陆词典查词...')
      const service = DictionaryServiceFactory.createService('eudic', eudicSettings)
      if (service) {
        const lookupResult = await service.lookupWord('hello')
        console.log('欧陆词典查词结果:', lookupResult)
      }
    }
  } catch (error) {
    console.error('欧陆词典测试失败:', error)
  }

  console.log('词典服务测试完成')
}

// 在浏览器控制台中可以调用这个函数进行测试
// @ts-ignore - 添加到全局window对象用于调试
window.testDictionaryServices = testDictionaryServices
