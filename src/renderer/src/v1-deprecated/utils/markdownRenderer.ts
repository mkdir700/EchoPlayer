import { marked } from 'marked'

/**
 * Basic HTML sanitization for security
 * 基本的HTML净化以确保安全性
 */
function sanitizeHtml(html: string): string {
  // Remove dangerous tags and attributes
  // 移除危险的标签和属性
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers / 移除事件处理器
    .replace(/javascript\s*:/gi, '') // Remove javascript: URLs / 移除javascript: URL
    .replace(/data\s*:/gi, '') // Remove data: URLs / 移除data: URL
    .replace(/<[^>]*style\s*=\s*["'][^"']*["'][^>]*>/gi, (match) => {
      // Remove style attributes that could contain malicious code
      // 移除可能包含恶意代码的style属性
      return match.replace(/style\s*=\s*["'][^"']*["']/gi, '')
    })
}

/**
 * Safely render markdown content to HTML
 * 安全地将Markdown内容渲染为HTML
 *
 * @param markdown - The markdown string to render / 要渲染的Markdown字符串
 * @returns Sanitized HTML string / 经过净化的HTML字符串
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  try {
    // Configure marked options for better security
    // 配置marked选项以提高安全性
    marked.setOptions({
      breaks: true, // Enable line breaks / 启用换行符
      gfm: true // Enable GitHub Flavored Markdown / 启用GitHub风格Markdown
    })

    // Convert markdown to HTML
    // 将Markdown转换为HTML
    const rawHtml = marked(markdown) as string

    // Sanitize HTML to prevent XSS attacks
    // 净化HTML以防止XSS攻击
    return sanitizeHtml(rawHtml)
  } catch (error) {
    console.error('Error rendering markdown:', error)
    // Fallback to plain text if markdown parsing fails
    // 如果Markdown解析失败，则回退到纯文本
    return markdown.replace(/[<>&"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      }
      return escapeMap[match] || match
    })
  }
}

/**
 * Check if content appears to be markdown formatted
 * 检查内容是否看起来是Markdown格式
 *
 * @param content - The content to check / 要检查的内容
 * @returns True if content appears to be markdown / 如果内容看起来是Markdown则返回true
 */
export function isMarkdownContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  // Basic markdown indicators / 基本的Markdown指示符
  const markdownPatterns = [
    /^\s*#+ /, // Headers / 标题
    /^\s*[-*+] /, // Lists / 列表
    /^\s*\d+\. /, // Numbered lists / 有序列表
    /\*\*.*\*\*/, // Bold / 粗体
    /\*.*\*/, // Italic / 斜体
    /`.*`/, // Code / 代码
    /\[.*\]\(.*\)/, // Links / 链接
    /^\s*> /, // Blockquotes / 引用
    /^\s*```/, // Code blocks / 代码块
    /^\s*---\s*$/, // Horizontal rules / 水平线
    /!\[.*\]\(.*\)/ // Images / 图片
  ]

  return markdownPatterns.some((pattern) => pattern.test(content))
}

/**
 * Create React component props for rendering HTML content
 * 创建用于渲染HTML内容的React组件属性
 *
 * @param html - The HTML string to render / 要渲染的HTML字符串
 * @returns Object with dangerouslySetInnerHTML prop / 包含dangerouslySetInnerHTML属性的对象
 */
export function createHtmlProps(html: string): { dangerouslySetInnerHTML: { __html: string } } {
  return {
    dangerouslySetInnerHTML: { __html: html }
  }
}
