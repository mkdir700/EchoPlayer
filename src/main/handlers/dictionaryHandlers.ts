import { ipcMain } from 'electron'
import { createHash } from 'crypto'
import * as cheerio from 'cheerio'

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
        const parsedData = parseEudicHtml(html, word)
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

// 解析欧陆词典HTML响应
function parseEudicHtml(
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
    const $ = cheerio.load(html)

    // 解析音标
    let phonetic = ''
    const phoneticElement = $('.phonetic')
    if (phoneticElement.length > 0) {
      phonetic = phoneticElement.text().trim()
    }

    // 解析词性和释义
    const definitions: Array<{
      partOfSpeech?: string
      meaning: string
      examples?: string[]
    }> = []

    // 查找英汉-汉英词典部分 - 根据实际HTML结构调整
    // case1: 简单格式
    // <div id="FCChild"  class="expDiv"><!--word-thumbnail-image--><i>adj.</i> 形而上学的,纯粹哲学的,超自然的</div>
    // case2: 列表格式
    // <div id="FCChild" class="expDiv">
    //     <div class="exp" data-eusoft-scrollable-element="1">
    //     <ol data-eusoft-scrollable-element="1">
    //         <li data-eusoft-scrollable-element="1">adv. 大概；也许；可能</li>
    //         <li data-eusoft-scrollable-element="1">n. 不确定性；可能性</li>
    //     </ol>
    // </div>
    $('#FCChild.expDiv').each((_, element) => {
      const $element = $(element)

      // 首先检查是否有列表结构 (case2)
      const $listItems = $element.find('ol li, ul li')
      if ($listItems.length > 0) {
        // 处理列表格式的释义
        $listItems.each((_, listItem) => {
          const $listItem = $(listItem)
          const itemText = $listItem.text().trim()

          if (itemText) {
            // 尝试提取词性和释义
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
          }
        })
      } else {
        // 处理简单格式 (case1)
        const fullText = $element.text().trim()

        // 查找词性标签 <i>
        const $partOfSpeech = $element.find('i')
        let partOfSpeech = ''
        let meaning = fullText

        if ($partOfSpeech.length > 0) {
          partOfSpeech = $partOfSpeech.text().trim()
          // 移除词性部分，获取释义
          meaning = fullText.replace(partOfSpeech, '').trim()
        }

        if (meaning) {
          definitions.push({
            partOfSpeech: partOfSpeech || undefined,
            meaning: meaning
          })
        }
      }
    })

    // 如果没有找到释义，尝试其他选择器
    if (definitions.length === 0) {
      // case3: 尝试查找所有 .expDiv 元素（备用方案）
      $('.expDiv').each((_, element) => {
        const $element = $(element)
        const fullText = $element.text().trim()

        // 跳过空内容和样式内容
        if (!fullText || fullText.includes('style>') || fullText.length < 3) {
          return
        }

        // 首先检查是否有列表结构
        const $listItems = $element.find('ol li, ul li')
        if ($listItems.length > 0) {
          $listItems.each((_, listItem) => {
            const $listItem = $(listItem)
            const itemText = $listItem.text().trim()

            if (itemText) {
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
            }
          })
        } else {
          // 处理简单文本格式
          const $partOfSpeech = $element.find('i')
          let partOfSpeech = ''
          let meaning = fullText

          if ($partOfSpeech.length > 0) {
            partOfSpeech = $partOfSpeech.text().trim()
            meaning = fullText.replace(partOfSpeech, '').trim()
          }

          if (meaning) {
            definitions.push({
              partOfSpeech: partOfSpeech || undefined,
              meaning: meaning
            })
          }
        }
      })
    }

    // 如果仍然没有找到释义，尝试通用选择器
    if (definitions.length === 0) {
      // case4: 尝试解析任何列表形式的释义
      $('ol li, ul li').each((_, element) => {
        const $element = $(element)
        const meaning = $element.text().trim()
        if (meaning && meaning.length > 0) {
          // 尝试提取词性
          const partOfSpeechMatch = meaning.match(/^(\w+\.)\s*(.+)/)
          if (partOfSpeechMatch) {
            definitions.push({
              partOfSpeech: partOfSpeechMatch[1],
              meaning: partOfSpeechMatch[2]
            })
          } else {
            definitions.push({
              meaning: meaning
            })
          }
        }
      })
    }

    // case5: 如果还是没有找到，尝试查找任何包含释义的div
    if (definitions.length === 0) {
      $('div').each((_, element) => {
        const $element = $(element)
        const text = $element.text().trim()

        // 跳过太短或包含特殊内容的文本
        if (!text || text.length < 5 || text.includes('style>') || text.includes('script>')) {
          return true // 继续循环
        }

        // 检查是否看起来像释义（包含中文字符）
        if (/[\u4e00-\u9fa5]/.test(text) && text.length < 200) {
          // 尝试提取词性
          const partOfSpeechMatch = text.match(/^(\w+\.)\s*(.+)/)
          if (partOfSpeechMatch) {
            definitions.push({
              partOfSpeech: partOfSpeechMatch[1],
              meaning: partOfSpeechMatch[2]
            })
          } else {
            definitions.push({
              meaning: text
            })
          }

          // 只取第一个找到的释义，避免重复
          return false // 停止循环
        }
        return true // 继续循环
      })
    }

    // 解析例句
    const examples: string[] = []
    $('.example, .sentence').each((_, element) => {
      const $element = $(element)
      const example = $element.text().trim()
      if (example) {
        examples.push(example)
      }
    })

    // 解析翻译结果
    const translations: string[] = []
    $('.translation').each((_, element) => {
      const $element = $(element)
      const translation = $element.text().trim()
      if (translation) {
        translations.push(translation)
      }
    })

    console.log('欧陆词典解析结果:', {
      word,
      phonetic,
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
    console.error('HTML解析失败:', error)
    throw new Error('HTML解析失败')
  }
}
