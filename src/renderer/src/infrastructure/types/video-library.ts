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
