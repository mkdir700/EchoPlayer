# API Reference

This section provides comprehensive API documentation for EchoLab's internal architecture. It covers the main process APIs, renderer process APIs, and IPC communication protocols.

## Overview

EchoLab follows Electron's multi-process architecture:

- **Main Process**: Node.js backend handling system operations
- **Renderer Process**: React frontend for user interface
- **Preload Scripts**: Secure bridge between main and renderer processes

## API Categories

### [Main Process APIs](./main-process)

Backend APIs running in the Node.js environment:

- Video processing and FFmpeg integration
- File system operations
- Window management
- System integration

### [Renderer Process APIs](./renderer-process)

Frontend APIs for the React application:

- Video player controls
- Subtitle editing interface
- State management
- UI components

### [IPC Communication](./ipc)

Inter-process communication protocols:

- Available channels and message formats
- Event handling and error management
- Security considerations

## Quick Reference

### Common IPC Channels

#### Video Operations

```typescript
// Load video file
window.electronAPI.loadVideo(filePath: string): Promise<VideoInfo>

// Get video metadata
window.electronAPI.getVideoInfo(filePath: string): Promise<VideoMetadata>

// Transcode video
window.electronAPI.transcodeVideo(options: TranscodeOptions): Promise<string>
```

#### File Operations

```typescript
// Open file dialog
window.electronAPI.openFileDialog(options: OpenDialogOptions): Promise<string[]>

// Save file dialog
window.electronAPI.saveFileDialog(options: SaveDialogOptions): Promise<string>

// Read file
window.electronAPI.readFile(filePath: string): Promise<Buffer>
```

#### Subtitle Operations

```typescript
// Parse subtitle file
window.electronAPI.parseSubtitles(filePath: string): Promise<Subtitle[]>

// Save subtitles
window.electronAPI.saveSubtitles(filePath: string, subtitles: Subtitle[]): Promise<void>

// Export subtitles
window.electronAPI.exportSubtitles(options: ExportOptions): Promise<string>
```

## Type Definitions

### Core Types

```typescript
interface VideoInfo {
  path: string
  duration: number
  width: number
  height: number
  fps: number
  format: string
  size: number
}

interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  position?: SubtitlePosition
}

interface TranscodeOptions {
  inputPath: string
  outputPath: string
  format: VideoFormat
  quality: QualityPreset
  onProgress?: (progress: TranscodeProgress) => void
}
```

### Event Types

```typescript
interface VideoPlayerEvents {
  'video:loaded': (info: VideoInfo) => void
  'video:timeupdate': (currentTime: number) => void
  'video:ended': () => void
  'video:error': (error: Error) => void
}

interface SubtitleEvents {
  'subtitle:added': (subtitle: Subtitle) => void
  'subtitle:updated': (subtitle: Subtitle) => void
  'subtitle:deleted': (id: string) => void
}
```

## Security Model

### Context Isolation

EchoLab uses Electron's context isolation for security:

```typescript
// Preload script exposes safe APIs
contextBridge.exposeInMainWorld('electronAPI', {
  loadVideo: (filePath: string) => ipcRenderer.invoke('video:load', filePath)
  // ... other safe APIs
})
```

### Allowed Operations

The preload script only exposes necessary operations:

- File operations with user consent (dialogs)
- Video processing with validated parameters
- Subtitle operations with sanitized input

## Error Handling

### Standard Error Format

```typescript
interface APIError {
  code: string
  message: string
  details?: any
  stack?: string
}
```

### Common Error Codes

- `FILE_NOT_FOUND`: Requested file doesn't exist
- `INVALID_FORMAT`: Unsupported file format
- `TRANSCODE_FAILED`: Video transcoding error
- `PERMISSION_DENIED`: Insufficient file permissions
- `NETWORK_ERROR`: Network-related operation failed

## Performance Considerations

### Async Operations

All heavy operations are asynchronous:

```typescript
// Good: Non-blocking video loading
const videoInfo = await window.electronAPI.loadVideo(filePath)

// Good: Progress tracking for long operations
await window.electronAPI.transcodeVideo({
  inputPath,
  outputPath,
  onProgress: (progress) => updateUI(progress)
})
```

### Memory Management

- Large files are streamed rather than loaded entirely
- Video frames are processed on-demand
- Subtitle data is paginated for large files

## Development Guidelines

### API Design Principles

1. **Consistency**: Similar operations follow similar patterns
2. **Type Safety**: All APIs are fully typed with TypeScript
3. **Error Handling**: Comprehensive error reporting
4. **Performance**: Async operations with progress tracking
5. **Security**: Minimal surface area with validation

### Adding New APIs

When adding new APIs:

1. Define TypeScript interfaces first
2. Implement main process handlers
3. Add preload script bindings
4. Create renderer process wrappers
5. Write comprehensive tests
6. Update documentation

## Testing APIs

### Unit Testing

```typescript
// Test main process handlers
describe('Video API', () => {
  it('should load video info', async () => {
    const info = await loadVideo('/path/to/video.mp4')
    expect(info).toMatchObject({
      duration: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number)
    })
  })
})
```

### Integration Testing

```typescript
// Test IPC communication
describe('IPC Integration', () => {
  it('should handle video loading via IPC', async () => {
    const result = await ipcRenderer.invoke('video:load', testVideoPath)
    expect(result).toBeDefined()
  })
})
```

## Migration Guide

### Version Compatibility

- API versions are tracked with semantic versioning
- Breaking changes are documented with migration paths
- Deprecated APIs include sunset timelines

### Upgrading APIs

When APIs change:

1. Check the changelog for breaking changes
2. Update type definitions
3. Modify implementation code
4. Test thoroughly
5. Update documentation

---

For detailed information about specific APIs, see the individual sections:

- [Main Process APIs](./main-process) - Backend operations
- [Renderer Process APIs](./renderer-process) - Frontend interfaces
- [IPC Communication](./ipc) - Inter-process protocols
