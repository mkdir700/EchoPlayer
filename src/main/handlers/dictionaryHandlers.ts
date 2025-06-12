import { ipcMain } from 'electron'
import { createHash } from 'crypto'

// 设置词典服务相关的 IPC 处理器
export function setupDictionaryHandlers(): void {
  // 有道词典API请求
  ipcMain.handle(
    'dictionary:youdao-request',
    async (_, url: string, params: Record<string, string>) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(params)
        })

        if (response.ok) {
          const data = await response.json()
          return { success: true, data }
        } else {
          return { success: false, error: '请求失败' }
        }
      } catch (error) {
        console.error('有道词典API请求失败:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : '网络错误'
        }
      }
    }
  )

  // 欧陆词典API请求
  ipcMain.handle('dictionary:eudic-request', async (_, url: string, options: RequestInit) => {
    try {
      const response = await fetch(url, options)

      if (response.ok) {
        const data = await response.json()
        return { success: true, data }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || response.statusText,
          status: response.status
        }
      }
    } catch (error) {
      console.error('欧陆词典API请求失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  })

  // SHA256哈希计算
  ipcMain.handle('crypto:sha256', async (_, text: string) => {
    try {
      const hash = createHash('sha256')
      hash.update(text)
      return hash.digest('hex')
    } catch (error) {
      console.error('SHA256计算失败:', error)
      return null
    }
  })

  // 欧陆词典HTML解析请求
  ipcMain.handle('dictionary:eudic-html-request', async (_, word: string, context?: string) => {
    try {
      // 构建欧陆词典查询URL
      const baseUrl = 'https://dict.eudic.net/dicts/MiniDictSearch2'
      const params = new URLSearchParams({
        word: word,
        context: context || word
      })
      const url = `${baseUrl}?${params.toString()}`

      console.log('正在请求欧陆词典:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      if (response.ok) {
        const html = await response.text()
        // console.log('欧陆词典HTML响应:', html)
        const parsedData = parseEudicHtmlWithRegex(html, word)
        // 如果没有找到任何释义，记录警告
        if (parsedData.definitions.length === 0) {
          console.warn('警告: 未能从HTML中解析出任何释义')
          //   console.log('HTML内容预览:', html.substring(0, 500))
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
      console.error('欧陆词典HTML请求失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  })
}

// 使用正则表达式解析欧陆词典HTML响应 - 替代cheerio
function parseEudicHtmlWithRegex(
  html: string,
  word: string
): {
  word: string
  phonetic?: string
  definitions: Array<{
    partOfSpeech?: string
    meaning: string
    examples?: string[]
  }>
  examples?: string[]
  translations?: string[]
} {
  try {
    const definitions: Array<{
      partOfSpeech?: string
      meaning: string
      examples?: string[]
    }> = []

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
    }

    // 备用方案：如果 FCChild 没有找到内容，搜索其他可能的释义容器
    if (definitions.length === 0) {
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

    // 解析例句 (如果有)
    const examples: string[] = []
    const exampleRegex = /<[^>]*class[^>]*(?:example|sentence)[^>]*>([^<]+)<\/[^>]*>/gi
    let exampleMatch: RegExpExecArray | null
    while ((exampleMatch = exampleRegex.exec(html)) !== null) {
      const example = exampleMatch[1].trim()
      if (example) {
        examples.push(example)
      }
    }

    // 解析翻译结果 (如果有)
    const translations: string[] = []
    const translationRegex = /<[^>]*class[^>]*translation[^>]*>([^<]+)<\/[^>]*>/gi
    let translationMatch: RegExpExecArray | null
    while ((translationMatch = translationRegex.exec(html)) !== null) {
      const translation = translationMatch[1].trim()
      if (translation) {
        translations.push(translation)
      }
    }

    console.log('欧陆词典正则解析结果:', {
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
    console.error('HTML正则解析失败:', error)
    throw new Error('HTML正则解析失败')
  }
}
