/**
 * @interface
 * @description 文件元数据接口
 */
export interface FileMetadata {
  /**
   * 文件的唯一标识符
   */
  id: string
  /**
   * 文件名
   */
  name: string
  /**
   * 文件的原始名称（展示名称）
   */
  origin_name: string
  /**
   * 文件路径
   */
  path: string
  /**
   * 文件大小，单位为字节
   */
  size: number
  /**
   * 文件扩展名（包含.）
   */
  ext: string
  /**
   * 文件类型
   */
  type: FileTypes
  /**
   * 文件创建时间的ISO字符串
   */
  created_at: string
}

export interface FileType extends FileMetadata {}

export enum FileTypes {
  VIDEO = 'video',
  AUDIO = 'audio',
  SUBTITLE = 'subtitle',
  OTHER = 'other'
}
