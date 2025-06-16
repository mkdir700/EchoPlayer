// 这个文件已被重构为多个专门的 hooks:
// - useVideoFileState.ts: 管理视频文件状态
// - useVideoFileUpload.ts: 处理文件上传
// - useVideoFileSelection.ts: 处理文件选择
// - useVideoFile.ts: 组合 hook

// 为了保持向后兼容性，重新导出主要 hook
export { useVideoFile, type UseVideoFileReturn } from './useVideoFile'

// 也可以分别导出专门的 hooks 供特定需求使用
export { useVideoFileUpload, type UseVideoFileUploadReturn } from './useVideoFileUpload'
export { useVideoFileSelection, type UseVideoFileSelectionReturn } from './useVideoFileSelection'

// 为了完全向后兼容，保留旧的导出名称
export {
  useVideoFile as useFileUpload,
  type UseVideoFileReturn as UseFileUploadReturn
} from './useVideoFile'
