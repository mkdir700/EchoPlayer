import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'

import { getKysely } from '../index'
import { FileDAO } from './FileDAO'
import { PlayerSettingsDAO } from './PlayerSettingsDAO'
import { SubtitleLibraryDAO } from './SubtitleLibraryDAO'
import { VideoLibraryDAO } from './VideoLibraryDAO'

/**
 * 数据库服务类 - 统一入口
 */
export class DatabaseService {
  public files: FileDAO
  public videoLibrary: VideoLibraryDAO
  public subtitleLibrary: SubtitleLibraryDAO
  public playerSettings: PlayerSettingsDAO

  constructor(db?: Kysely<DB>) {
    const kysely = db || getKysely()
    this.files = new FileDAO(kysely)
    this.videoLibrary = new VideoLibraryDAO(kysely)
    this.subtitleLibrary = new SubtitleLibraryDAO(kysely)
    this.playerSettings = new PlayerSettingsDAO(kysely)
  }

  /**
   * 事务执行
   */
  async transaction<T>(callback: (trx: Kysely<DB>) => Promise<T>): Promise<T> {
    return await getKysely().transaction().execute(callback)
  }
}

// 导出单例实例
export const db = new DatabaseService()
