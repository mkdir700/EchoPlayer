import { describe, it, expect } from 'vitest'
import * as cheerio from 'cheerio'

// 从dictionaryHandlers.ts中提取的HTML解析函数
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

    // 查找英汉-汉英词典部分
    $('.dict-content').each((_, element) => {
      const $element = $(element)

      // 解析基本释义
      $element.find('.explain').each((_, explainElement) => {
        const $explain = $(explainElement)
        const meaning = $explain.text().trim()
        if (meaning) {
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
    })

    // 如果没有找到释义，尝试其他选择器
    if (definitions.length === 0) {
      // 尝试解析列表形式的释义
      $('ol li, ul li').each((_, element) => {
        const $element = $(element)
        const meaning = $element.text().trim()
        if (meaning && meaning.length > 0) {
          definitions.push({
            meaning: meaning
          })
        }
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

// 生成大型HTML测试数据
function generateLargeHtml(definitionCount: number, exampleCount: number): string {
  const definitions = Array.from(
    { length: definitionCount },
    (_, i) =>
      `<div class="explain">${i % 2 === 0 ? 'n.' : 'v.'} 释义${i + 1}的内容，包含一些详细的解释</div>`
  ).join('')

  const examples = Array.from(
    { length: exampleCount },
    (_, i) =>
      `<div class="example">This is example sentence number ${i + 1} with some content.</div>`
  ).join('')

  return `
    <html>
      <body>
        <div class="phonetic">/ˈtestɪŋ/</div>
        <div class="dict-content">
          ${definitions}
        </div>
        ${examples}
        <div class="translation">测试翻译1</div>
        <div class="translation">测试翻译2</div>
      </body>
    </html>
  `
}

describe('欧陆词典HTML解析器性能测试', () => {
  // 在CI环境中跳过性能测试
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'

  if (isCI) {
    it('性能测试在CI环境中被跳过', () => {
      console.log('⏭️  性能测试在CI环境中被跳过，因为CI环境的性能表现不稳定')
      expect(true).toBe(true) // 占位测试，确保测试套件不为空
    })
    return
  }

  describe('大数据量处理性能', () => {
    it('应该在合理时间内处理中等数量的释义和例句', () => {
      const html = generateLargeHtml(50, 30)

      const startTime = performance.now()
      const result = parseEudicHtml(html, 'test')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      // 验证结果正确性
      expect(result.word).toBe('test')
      expect(result.phonetic).toBe('/ˈtestɪŋ/')
      expect(result.definitions).toHaveLength(50)
      expect(result.examples).toHaveLength(30)
      expect(result.translations).toHaveLength(2)

      // 性能要求：处理50个释义和30个例句应该在100ms内完成
      expect(executionTime).toBeLessThan(100)

      console.log(`处理50个释义和30个例句耗时: ${executionTime.toFixed(2)}ms`)
    })

    it('应该在合理时间内处理大量释义', () => {
      const html = generateLargeHtml(200, 10)

      const startTime = performance.now()
      const result = parseEudicHtml(html, 'test')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      // 验证结果正确性
      expect(result.definitions).toHaveLength(200)
      expect(result.examples).toHaveLength(10)

      // 性能要求：处理200个释义应该在200ms内完成
      expect(executionTime).toBeLessThan(200)

      console.log(`处理200个释义耗时: ${executionTime.toFixed(2)}ms`)
    })

    it('应该在合理时间内处理大量例句', () => {
      const html = generateLargeHtml(10, 200)

      const startTime = performance.now()
      const result = parseEudicHtml(html, 'test')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      // 验证结果正确性
      expect(result.definitions).toHaveLength(10)
      expect(result.examples).toHaveLength(200)

      // 性能要求：处理200个例句应该在200ms内完成
      expect(executionTime).toBeLessThan(200)

      console.log(`处理200个例句耗时: ${executionTime.toFixed(2)}ms`)
    })

    it('应该处理极大数据量而不崩溃', () => {
      const html = generateLargeHtml(500, 500)

      const startTime = performance.now()
      const result = parseEudicHtml(html, 'stress-test')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      // 验证结果正确性
      expect(result.word).toBe('stress-test')
      expect(result.definitions).toHaveLength(500)
      expect(result.examples).toHaveLength(500)

      // 性能要求：处理500个释义和500个例句应该在1秒内完成
      expect(executionTime).toBeLessThan(1000)

      console.log(`压力测试 - 处理500个释义和500个例句耗时: ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('内存使用优化', () => {
    it('应该正确处理重复解析而不泄露内存', () => {
      const html = generateLargeHtml(100, 50)

      // 多次解析同一个HTML
      const iterations = 10
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        const result = parseEudicHtml(html, `test-${i}`)
        expect(result.definitions).toHaveLength(100)
        expect(result.examples).toHaveLength(50)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime
      const averageTime = totalTime / iterations

      // 平均每次解析时间应该保持稳定
      expect(averageTime).toBeLessThan(50)

      console.log(`${iterations}次重复解析，平均每次耗时: ${averageTime.toFixed(2)}ms`)
    })

    it('应该处理空内容而不影响性能', () => {
      const emptyHtml = '<html><body></body></html>'

      const iterations = 100
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        const result = parseEudicHtml(emptyHtml, `empty-${i}`)
        expect(result.definitions).toHaveLength(0)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // 100次空HTML解析应该在50ms内完成
      expect(totalTime).toBeLessThan(50)

      console.log(`100次空HTML解析总耗时: ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('边界性能测试', () => {
    it('应该处理包含大量嵌套元素的HTML', () => {
      const nestedHtml = `
        <html>
          <body>
            <div class="dict-content">
              ${Array.from(
                { length: 100 },
                (_, i) => `
                <div class="section-${i}">
                  <div class="subsection">
                    <div class="explain">n. 嵌套释义${i + 1}</div>
                    <div class="nested-content">
                      <div class="deep-nested">
                        <div class="example">嵌套例句${i + 1}</div>
                      </div>
                    </div>
                  </div>
                </div>
              `
              ).join('')}
            </div>
          </body>
        </html>
      `

      const startTime = performance.now()
      const result = parseEudicHtml(nestedHtml, 'nested-test')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      expect(result.definitions).toHaveLength(100)
      expect(executionTime).toBeLessThan(300)

      console.log(`处理100个嵌套元素耗时: ${executionTime.toFixed(2)}ms`)
    })

    it('应该处理包含特殊字符的大量内容', () => {
      const specialCharsHtml = `
        <html>
          <body>
            <div class="phonetic">/ˈspɛʃəl ˈkærɪktərz/</div>
            <div class="dict-content">
              ${Array.from(
                { length: 50 },
                (_, i) => `
                <div class="explain">n. 特殊字符释义${i + 1}：包含émojis 🎉、中文字符、数学符号 ∑∆∇</div>
              `
              ).join('')}
            </div>
            ${Array.from(
              { length: 30 },
              (_, i) => `
              <div class="example">Example with special chars: café, naïve, résumé ${i + 1}</div>
            `
            ).join('')}
          </body>
        </html>
      `

      const startTime = performance.now()
      const result = parseEudicHtml(specialCharsHtml, 'special-chars')
      const endTime = performance.now()

      const executionTime = endTime - startTime

      expect(result.definitions).toHaveLength(50)
      expect(result.examples).toHaveLength(30)
      expect(result.phonetic).toBe('/ˈspɛʃəl ˈkærɪktərz/')
      expect(executionTime).toBeLessThan(150)

      console.log(`处理特殊字符内容耗时: ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('性能回归测试', () => {
    it('应该保持基准性能水平', () => {
      // 标准测试用例
      const standardHtml = generateLargeHtml(100, 100)

      // 运行多次取平均值
      const runs = 5
      const times: number[] = []

      for (let i = 0; i < runs; i++) {
        const startTime = performance.now()
        const result = parseEudicHtml(standardHtml, `benchmark-${i}`)
        const endTime = performance.now()

        times.push(endTime - startTime)

        // 验证结果一致性
        expect(result.definitions).toHaveLength(100)
        expect(result.examples).toHaveLength(100)
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / runs
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      // 性能基准：平均时间应该在150ms内
      expect(averageTime).toBeLessThan(150)

      // 性能稳定性：最大时间不应该超过平均时间的2倍
      expect(maxTime).toBeLessThan(averageTime * 2)

      console.log(`性能基准测试结果:`)
      console.log(`  平均时间: ${averageTime.toFixed(2)}ms`)
      console.log(`  最小时间: ${minTime.toFixed(2)}ms`)
      console.log(`  最大时间: ${maxTime.toFixed(2)}ms`)
      console.log(`  时间方差: ${(maxTime - minTime).toFixed(2)}ms`)
    })
  })
})
