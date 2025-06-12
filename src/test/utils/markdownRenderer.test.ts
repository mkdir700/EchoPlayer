import { describe, it, expect } from 'vitest'
import {
  renderMarkdown,
  isMarkdownContent,
  createHtmlProps
} from '@renderer/utils/markdownRenderer'

describe('markdownRenderer', () => {
  describe('renderMarkdown', () => {
    it('should render basic markdown to HTML / 应该将基本Markdown渲染为HTML', () => {
      const markdown = '**Bold text** and *italic text*'
      const result = renderMarkdown(markdown)

      expect(result).toContain('<strong>Bold text</strong>')
      expect(result).toContain('<em>italic text</em>')
    })

    it('should render markdown lists / 应该渲染Markdown列表', () => {
      const markdown = `
- Feature 1
- Feature 2
- Bug fix 3
      `.trim()

      const result = renderMarkdown(markdown)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Feature 1</li>')
      expect(result).toContain('<li>Feature 2</li>')
      expect(result).toContain('<li>Bug fix 3</li>')
    })

    it('should render markdown headers / 应该渲染Markdown标题', () => {
      const markdown = '# Release Notes\n## New Features'
      const result = renderMarkdown(markdown)

      expect(result).toContain('<h1>Release Notes</h1>')
      expect(result).toContain('<h2>New Features</h2>')
    })

    it('should sanitize dangerous HTML / 应该净化危险的HTML', () => {
      const maliciousMarkdown = '<script>alert("xss")</script>\n\n**Safe text**'
      const result = renderMarkdown(maliciousMarkdown)

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert("xss")')
      expect(result).toContain('<strong>Safe text</strong>')
    })

    it('should handle empty or invalid input / 应该处理空或无效输入', () => {
      expect(renderMarkdown('')).toBe('')
      expect(renderMarkdown(null as never)).toBe('')
      expect(renderMarkdown(undefined as never)).toBe('')
      expect(renderMarkdown(123 as never)).toBe('')
    })

    it('should handle mixed HTML content safely / 应该安全处理混合HTML内容', () => {
      const htmlContent = '<div>Some content</div>\n\n**Markdown text**'
      const result = renderMarkdown(htmlContent)

      // Should preserve safe HTML tags like div but render markdown
      // 应该保留安全的HTML标签如div并渲染Markdown
      expect(result).toContain('<div>Some content</div>')
      expect(result).toContain('<strong>Markdown text</strong>')
    })
  })

  describe('isMarkdownContent', () => {
    it('should detect markdown headers / 应该检测Markdown标题', () => {
      expect(isMarkdownContent('# Header')).toBe(true)
      expect(isMarkdownContent('## Another Header')).toBe(true)
      expect(isMarkdownContent('   ### Indented Header')).toBe(true)
    })

    it('should detect markdown lists / 应该检测Markdown列表', () => {
      expect(isMarkdownContent('- List item')).toBe(true)
      expect(isMarkdownContent('* Another list')).toBe(true)
      expect(isMarkdownContent('+ Plus list')).toBe(true)
      expect(isMarkdownContent('1. Numbered list')).toBe(true)
    })

    it('should detect markdown formatting / 应该检测Markdown格式', () => {
      expect(isMarkdownContent('**bold text**')).toBe(true)
      expect(isMarkdownContent('*italic text*')).toBe(true)
      expect(isMarkdownContent('`code snippet`')).toBe(true)
      expect(isMarkdownContent('[link](http://example.com)')).toBe(true)
      expect(isMarkdownContent('> blockquote')).toBe(true)
    })

    it('should detect markdown code blocks / 应该检测Markdown代码块', () => {
      expect(isMarkdownContent('```javascript')).toBe(true)
      expect(isMarkdownContent('```\ncode\n```')).toBe(true)
    })

    it('should not detect plain text as markdown / 不应该将纯文本检测为Markdown', () => {
      expect(isMarkdownContent('Just plain text')).toBe(false)
      expect(isMarkdownContent('This is a sentence.')).toBe(false)
      expect(isMarkdownContent('Numbers 123 and symbols & @')).toBe(false)
    })

    it('should handle empty or invalid input / 应该处理空或无效输入', () => {
      expect(isMarkdownContent('')).toBe(false)
      expect(isMarkdownContent(null as never)).toBe(false)
      expect(isMarkdownContent(undefined as never)).toBe(false)
    })
  })

  describe('createHtmlProps', () => {
    it('should create dangerouslySetInnerHTML props / 应该创建dangerouslySetInnerHTML属性', () => {
      const html = '<p>Test content</p>'
      const result = createHtmlProps(html)

      expect(result).toEqual({
        dangerouslySetInnerHTML: { __html: html }
      })
    })

    it('should handle empty HTML / 应该处理空HTML', () => {
      const result = createHtmlProps('')

      expect(result).toEqual({
        dangerouslySetInnerHTML: { __html: '' }
      })
    })
  })

  describe('integration tests / 集成测试', () => {
    it('should handle typical release notes content / 应该处理典型的发布说明内容', () => {
      const releaseNotes = `
# Version 1.2.3

## New Features
- Added dark mode support
- Improved performance by **50%**

## Bug Fixes
- Fixed memory leak in \`VideoPlayer\`
- Resolved crash on startup

## Breaking Changes
> This version requires Node.js 18+

For more details, visit [our website](https://example.com).
      `.trim()

      expect(isMarkdownContent(releaseNotes)).toBe(true)

      const htmlContent = renderMarkdown(releaseNotes)
      const props = createHtmlProps(htmlContent)

      expect(htmlContent).toContain('<h1>')
      expect(htmlContent).toContain('<h2>')
      expect(htmlContent).toContain('<ul>')
      expect(htmlContent).toContain('<strong>')
      expect(htmlContent).toContain('<code>')
      expect(htmlContent).toContain('<blockquote>')
      expect(htmlContent).toContain('<a href="https://example.com"')

      expect(props.dangerouslySetInnerHTML.__html).toBe(htmlContent)
    })

    it('should handle mixed content safely / 应该安全处理混合内容', () => {
      const mixedContent = `
# Release Notes

<script>malicious()</script>

**New features:**
- Feature 1 <img src="x" onerror="alert('xss')">
- Feature 2

[Safe link](https://example.com)
<a href="javascript:alert('xss')">Malicious link</a>
      `.trim()

      const htmlContent = renderMarkdown(mixedContent)

      // Should contain safe content / 应该包含安全内容
      expect(htmlContent).toContain('<h1>Release Notes</h1>')
      expect(htmlContent).toContain('<strong>New features:</strong>')
      expect(htmlContent).toContain('href="https://example.com"')

      // Should not contain dangerous content / 不应该包含危险内容
      expect(htmlContent).not.toContain('<script>')
      expect(htmlContent).not.toContain('malicious()')
      expect(htmlContent).not.toContain('onerror')
      expect(htmlContent).not.toContain('javascript:')
    })
  })
})
