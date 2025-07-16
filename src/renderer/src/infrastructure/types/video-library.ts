export interface VideoLibraryRecord {
  /** 自增主键 */
  id: number
  /** 关联的文件ID */
  fileId: string
  /** 当前播放时间（秒） */
  currentTime: number
  /** 视频总时长（秒） */
  duration: number
  /** 上次播放时间戳 */
  playedAt: number
  /** 首次播放时间戳 */
  firstPlayedAt: number
  /** 播放次数 */
  playCount: number
  /** 是否已播放完毕 */
  isFinished: boolean
  /** 是否收藏 */
  isFavorite: boolean
  /** 缩略图路径 */
  thumbnailPath?: string
}

export interface VideoLibraryRecordQueryParams {
  /** 限制返回数量 */
  limit?: number
  /** 偏移量 */
  offset?: number
  /** 排序方式 */
  sortBy?: 'playedAt' | 'playCount' | 'firstPlayedAt' | 'duration'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 是否只显示收藏 */
  favoritesOnly?: boolean
  /** 搜索关键词 */
  searchQuery?: string
}
