import { loggerService } from '@logger'
import { DictionaryDefinition, DictionaryResponse, DictionaryResult } from '@types'

const logger = loggerService.withContext('DictionaryService')

class DictionaryService {
  private readonly baseUrl = 'https://dict.eudic.net/dicts/MiniDictSearch2'
  private readonly defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }

  constructor() {
    logger.info('DictionaryService initialized')
  }

  /**
   * 查询欧陆词典
   */
  public queryEudic = async (
    _: Electron.IpcMainInvokeEvent,
    word: string,
    context?: string
  ): Promise<DictionaryResponse> => {
    try {
      // 构建查询URL
      const params = new URLSearchParams({
        word: word,
        context: context || word
      })
      const url = `${this.baseUrl}?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders
      })

      if (response.ok) {
        const html = await response.text()
        const parsedData = this.parseEudicHtml(html, word)

        // 如果没有找到任何释义，记录警告
        if (parsedData.definitions.length === 0) {
          logger.warn('警告: 未能从HTML中解析出任何释义')
          return { success: false, error: '未能从HTML中解析出任何释义' }
        }

        return { success: true, data: parsedData }
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      logger.error('欧陆词典HTML请求失败:', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }

  /**
   * 使用正则表达式解析欧陆词典HTML响应
   */
  private parseEudicHtml = (html: string, word: string): DictionaryResult => {
    try {
      const definitions: DictionaryDefinition[] = []

      // 解析音标 - 匹配 class="phonetic" 的内容
      let phonetic = ''
      const phoneticMatch = html.match(/<[^>]*class[^>]*phonetic[^>]*>([^<]+)<\/[^>]*>/i)
      if (phoneticMatch) {
        phonetic = phoneticMatch[1].trim()
      }

      // 解析释义 - 主要目标是 FCChild 中的内容
      const fcChildMatch = html.match(
        /<div[^>]*id="FCChild"[^>]*class="expDiv"[^>]*>([\s\S]*?)<\/div>/i
      )

      if (fcChildMatch) {
        const fcChildContent = fcChildMatch[1]
        this.parseDefinitionsFromContent(fcChildContent, definitions)
      }

      // 备用方案：如果 FCChild 没有找到内容，搜索其他可能的释义容器
      if (definitions.length === 0) {
        this.parseDefinitionsFromGeneralList(html, definitions)
      }

      // 解析例句
      const examples = this.parseExamples(html)

      // 解析翻译结果
      const translations = this.parseTranslations(html)

      logger.debug('欧陆词典正则解析结果:', {
        word,
        phonetic: phonetic || '未找到',
        definitions: definitions.length,
        definitionsDetail: definitions,
        examples: examples.length,
        translations: translations.length
      })

      return {
        word,
        phonetic: phonetic || undefined,
        definitions,
        examples: examples.length > 0 ? examples : undefined,
        translations: translations.length > 0 ? translations : undefined
      }
    } catch (error) {
      logger.error('HTML正则解析失败:', error as Error)
      throw new Error('HTML正则解析失败')
    }
  }

  /**
   * 从FCChild内容中解析释义
   */
  private parseDefinitionsFromContent = (
    fcChildContent: string,
    definitions: DictionaryDefinition[]
  ): void => {
    // 方法1: 解析列表格式 (<ol><li> 或 <ul><li>)
    const listItemRegex = /<li[^>]*>([^<]+)<\/li>/gi
    let match: RegExpExecArray | null
    const foundInList: string[] = []

    while ((match = listItemRegex.exec(fcChildContent)) !== null) {
      const itemText = match[1].trim()
      if (itemText && itemText.length > 0) {
        foundInList.push(itemText)
      }
    }

    if (foundInList.length > 0) {
      // 处理列表中的条目
      foundInList.forEach((itemText) => {
        const partOfSpeechMatch = itemText.match(/^(\w+\.)\s*(.+)/)
        if (partOfSpeechMatch) {
          definitions.push({
            partOfSpeech: partOfSpeechMatch[1],
            meaning: partOfSpeechMatch[2]
          })
        } else {
          definitions.push({
            meaning: itemText
          })
        }
      })
    } else {
      // 方法2: 解析简单格式 (带有 <i> 标签的词性)
      this.parseSimpleFormat(fcChildContent, definitions)
    }
  }

  /**
   * 解析简单格式的释义
   */
  private parseSimpleFormat = (
    fcChildContent: string,
    definitions: DictionaryDefinition[]
  ): void => {
    // 提取所有文本内容，排除HTML标签
    let textContent = fcChildContent.replace(/<script[\s\S]*?<\/script>/gi, '')
    textContent = textContent.replace(/<style[\s\S]*?<\/style>/gi, '')

    // 提取词性信息
    const partOfSpeechMatch = textContent.match(/<i[^>]*>([^<]+)<\/i>/i)
    let partOfSpeech = ''
    if (partOfSpeechMatch) {
      partOfSpeech = partOfSpeechMatch[1].trim()
    }

    // 移除所有HTML标签，获取纯文本
    const cleanText = textContent.replace(/<[^>]*>/g, '').trim()

    if (cleanText && cleanText.length > 0) {
      // 如果有词性，移除词性部分
      let meaning = cleanText
      if (partOfSpeech) {
        meaning = meaning.replace(partOfSpeech, '').trim()
      }

      if (meaning && meaning.length > 0) {
        definitions.push({
          partOfSpeech: partOfSpeech || undefined,
          meaning: meaning
        })
      }
    }
  }

  /**
   * 从通用列表中解析释义（备用方案）
   */
  private parseDefinitionsFromGeneralList = (
    html: string,
    definitions: DictionaryDefinition[]
  ): void => {
    // 尝试匹配任何包含中文释义的列表项
    const generalListRegex = /<li[^>]*>([^<]*[\u4e00-\u9fa5][^<]*)<\/li>/gi
    let match: RegExpExecArray | null

    while ((match = generalListRegex.exec(html)) !== null) {
      const itemText = match[1].trim()
      if (itemText && itemText.length > 3 && itemText.length < 200) {
        const partOfSpeechMatch = itemText.match(/^(\w+\.)\s*(.+)/)
        if (partOfSpeechMatch) {
          definitions.push({
            partOfSpeech: partOfSpeechMatch[1],
            meaning: partOfSpeechMatch[2]
          })
        } else {
          definitions.push({
            meaning: itemText
          })
        }

        // 只取前几个结果，避免过多无关内容
        if (definitions.length >= 5) {
          break
        }
      }
    }
  }

  /**
   * 解析例句
   */
  private parseExamples = (html: string): string[] => {
    const examples: string[] = []
    const exampleRegex = /<[^>]*class[^>]*(?:example|sentence)[^>]*>([^<]+)<\/[^>]*>/gi
    let exampleMatch: RegExpExecArray | null

    while ((exampleMatch = exampleRegex.exec(html)) !== null) {
      const example = exampleMatch[1].trim()
      if (example) {
        examples.push(example)
      }
    }

    return examples
  }

  /**
   * 解析翻译结果
   */
  private parseTranslations = (html: string): string[] => {
    const translations: string[] = []
    const translationRegex = /<[^>]*class[^>]*translation[^>]*>([^<]+)<\/[^>]*>/gi
    let translationMatch: RegExpExecArray | null

    while ((translationMatch = translationRegex.exec(html)) !== null) {
      const translation = translationMatch[1].trim()
      if (translation) {
        translations.push(translation)
      }
    }

    return translations
  }
}

export default DictionaryService
