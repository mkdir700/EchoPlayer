import FileManager from '@renderer/services/FileManager'
import { VideoLibraryService } from '@renderer/services/VideoLibrary'

// Home 页面展示用的视频项结构（与原 mock 字段保持一致）
export interface HomePageVideoItem {
  id: number
  title: string
  thumbnail?: string
  duration: number
  durationText: string
  watchProgress: number
  createdAt: Date
  publishedAt: string
}

function toFileUrl(p: string): string {
  if (!p) return ''
  return p.startsWith('file://') ? p : `file://${p}`
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeAgo(timestampMs: number): string {
  const now = Date.now()
  const diff = Math.max(0, now - timestampMs)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestampMs).toLocaleDateString('zh-CN')
}

export class HomePageVideoService {
  private readonly videoLibrary = new VideoLibraryService()

  async getHomePageVideos(limit: number = 50): Promise<HomePageVideoItem[]> {
    const records = await this.videoLibrary.getRecords({
      limit,
      sortBy: 'playedAt',
      sortOrder: 'desc'
    })

    const items: HomePageVideoItem[] = []

    for (const r of records) {
      const file = await FileManager.getFile(r.fileId)

      const title = file?.origin_name ?? file?.name ?? r.fileId
      const createdAt = file?.created_at ? new Date(file.created_at) : new Date(r.firstPlayedAt)
      const duration = r.duration || 0
      const durationText = formatDuration(duration)
      const watchProgress = r.isFinished ? 1 : clamp01(duration > 0 ? r.currentTime / duration : 0)

      const thumbnail = r.thumbnailPath ? toFileUrl(r.thumbnailPath) : undefined

      items.push({
        id: r.id,
        title,
        thumbnail,
        duration,
        durationText,
        watchProgress,
        createdAt,
        publishedAt: formatTimeAgo(r.playedAt)
      })
    }

    return items
  }
}

export default HomePageVideoService
