import { loggerService } from '@logger'

import HomePageVideoService, { HomePageVideoItem } from './HomePageVideos'

const logger = loggerService.withContext('VideoSearchService')

export class VideoSearchService {
  private readonly videoService = new HomePageVideoService()

  /**
   * 搜索视频
   * @param query 搜索关键词
   * @param limit 最大结果数量
   * @returns 匹配的视频列表
   */
  async searchVideos(query: string, limit: number = 20): Promise<HomePageVideoItem[]> {
    if (!query.trim()) {
      return []
    }

    try {
      logger.debug('开始搜索视频', { query, limit })

      // 获取所有视频
      const allVideos = await this.videoService.getHomePageVideos(500) // 获取更多视频用于搜索

      // 执行搜索过滤
      const filteredVideos = this.filterVideos(allVideos, query.trim())

      // 返回限制数量的结果
      const results = filteredVideos.slice(0, limit)

      logger.debug('搜索完成', {
        query,
        totalVideos: allVideos.length,
        matchedVideos: results.length
      })

      return results
    } catch (error) {
      logger.error('搜索视频失败', { error, query })
      throw error
    }
  }

  /**
   * 过滤和排序视频
   * @param videos 视频列表
   * @param query 搜索关键词
   * @returns 过滤后的视频列表
   */
  private filterVideos(videos: HomePageVideoItem[], query: string): HomePageVideoItem[] {
    const lowerQuery = query.toLowerCase()

    // 过滤匹配的视频
    const matchedVideos = videos.filter((video) => this.isVideoMatch(video, lowerQuery))

    // 按相关性排序
    return this.sortByRelevance(matchedVideos, lowerQuery)
  }

  /**
   * 判断视频是否匹配搜索关键词
   * @param video 视频项
   * @param query 小写的搜索关键词
   * @returns 是否匹配
   */
  private isVideoMatch(video: HomePageVideoItem, query: string): boolean {
    // 搜索标题
    if (video.title.toLowerCase().includes(query)) {
      return true
    }

    // 搜索副标题（包含路径和文件大小信息）
    if (video.subtitle?.toLowerCase().includes(query)) {
      return true
    }

    return false
  }

  /**
   * 按相关性排序视频结果
   * @param videos 匹配的视频列表
   * @param query 小写的搜索关键词
   * @returns 排序后的视频列表
   */
  private sortByRelevance(videos: HomePageVideoItem[], query: string): HomePageVideoItem[] {
    return videos.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query)
      const scoreB = this.calculateRelevanceScore(b, query)

      // 按相关性得分降序排列
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }

      // 相关性相同时，按播放时间降序排列（最近播放的在前）
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }

  /**
   * 计算视频的相关性得分
   * @param video 视频项
   * @param query 小写的搜索关键词
   * @returns 相关性得分（越高越相关）
   */
  private calculateRelevanceScore(video: HomePageVideoItem, query: string): number {
    let score = 0
    const lowerTitle = video.title.toLowerCase()
    const lowerSubtitle = video.subtitle?.toLowerCase() || ''

    // 标题完全匹配给最高分
    if (lowerTitle === query) {
      score += 100
    }
    // 标题开头匹配给高分
    else if (lowerTitle.startsWith(query)) {
      score += 80
    }
    // 标题包含关键词给中等分数
    else if (lowerTitle.includes(query)) {
      score += 50
    }

    // 副标题匹配给额外分数
    if (lowerSubtitle.includes(query)) {
      score += 20
    }

    // 关键词在标题中出现的次数
    const titleMatches = (
      lowerTitle.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []
    ).length
    score += titleMatches * 10

    return score
  }
}

export default VideoSearchService
