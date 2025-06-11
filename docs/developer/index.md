# Developer Documentation

Welcome to the EchoLab developer documentation! This section provides comprehensive information for developers who want to contribute to EchoLab or understand its architecture.

## Project Overview

EchoLab is a cross-platform desktop application built with modern web technologies:

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Electron (Node.js)
- **State Management**: Zustand
- **UI Framework**: Ant Design
- **Testing**: Vitest + Playwright
- **Build System**: Electron Builder

## Quick Start for Developers

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Platform-specific build tools (see [Setup Guide](./setup))

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/echolab.git
cd echolab

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Architecture Overview

### Project Structure

```
echolab/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts
│   └── renderer/       # React frontend
├── docs/               # Documentation
├── e2e/               # End-to-end tests
├── scripts/           # Build and utility scripts
└── resources/         # Static resources
```

### Key Technologies

#### Frontend (Renderer Process)

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Zustand**: Lightweight state management
- **Ant Design**: UI component library
- **Vite**: Fast development and build tool

#### Backend (Main Process)

- **Electron**: Cross-platform desktop framework
- **Node.js**: Server-side JavaScript runtime
- **FFmpeg**: Video processing capabilities
- **IPC**: Inter-process communication

#### Testing

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Testing Library**: React component testing

## Development Workflow

### 1. Setup Development Environment

Follow the [Setup Guide](./setup) to configure your development environment.

### 2. Understanding the Codebase

- Read the [Architecture Guide](./architecture) for detailed system design
- Review the [Code Style](./code-style) guidelines
- Familiarize yourself with the [Testing Strategy](./testing)

### 3. Making Changes

- Follow our [Git Workflow](./git-workflow)
- Write tests for new features
- Ensure code quality with linting and formatting
- Update documentation as needed

### 4. Building and Testing

- Run the full test suite before submitting changes
- Test on multiple platforms when possible
- Follow the [Build & Release](./build-release) process

## Key Concepts

### State Management

EchoLab uses Zustand for state management with a modular store architecture:

```typescript
// Example store slice
interface VideoState {
  currentVideo: VideoFile | null
  isPlaying: boolean
  currentTime: number
}

const useVideoStore = create<VideoState>((set) => ({
  currentVideo: null,
  isPlaying: false,
  currentTime: 0
  // ... actions
}))
```

### IPC Communication

Communication between main and renderer processes uses Electron's IPC:

```typescript
// Main process handler
ipcMain.handle('video:load', async (event, filePath) => {
  // Process video file
  return videoInfo
})

// Renderer process call
const videoInfo = await window.electronAPI.loadVideo(filePath)
```

### Video Processing

FFmpeg integration for video format support and conversion:

```typescript
// Video transcoding
await transcodeVideo({
  inputPath: originalPath,
  outputPath: convertedPath,
  options: transcodeOptions
})
```

## Contributing Guidelines

### Code Quality

- **TypeScript**: All code must be properly typed
- **ESLint**: Follow the configured linting rules
- **Prettier**: Use consistent code formatting
- **Tests**: Write tests for new features and bug fixes

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request
5. Address review feedback

See [Pull Requests](./pull-requests) for detailed guidelines.

### Issue Reporting

- Use GitHub Issues for bug reports and feature requests
- Follow the issue templates
- Provide detailed reproduction steps
- Include system information and logs

## Development Tools

### Recommended IDE Setup

- **VS Code** with recommended extensions
- **TypeScript** language support
- **ESLint** and **Prettier** extensions
- **Electron** debugging configuration

### Debugging

- **Main Process**: Node.js debugging in VS Code
- **Renderer Process**: Chrome DevTools
- **IPC**: Electron's built-in debugging tools

### Performance Monitoring

- **React DevTools**: Component performance
- **Electron DevTools**: Memory and CPU usage
- **Lighthouse**: Web performance metrics

## API Reference

### Main Process APIs

- [Video Processing](../api/main-process#video-processing)
- [File System](../api/main-process#file-system)
- [Window Management](../api/main-process#window-management)

### Renderer Process APIs

- [Video Player](../api/renderer-process#video-player)
- [Subtitle Editor](../api/renderer-process#subtitle-editor)
- [State Management](../api/renderer-process#state-management)

### IPC Communication

- [Available Channels](../api/ipc#channels)
- [Message Formats](../api/ipc#message-formats)
- [Error Handling](../api/ipc#error-handling)

## Release Process

### Version Management

- Semantic versioning (semver)
- Automated changelog generation
- Release notes and migration guides

### Build Pipeline

- Automated testing on multiple platforms
- Code signing for distribution
- Automated deployment to release channels

See [Release Process](./release-process) for complete details.

## Resources

### Documentation

- [User Guide](../user-guide/) - End-user documentation
- [API Reference](../api/) - Technical API documentation
- [Testing Guide](./testing) - Testing strategies and tools

### External Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)

### Community

- [GitHub Discussions](https://github.com/your-username/echolab/discussions)
- [Issue Tracker](https://github.com/your-username/echolab/issues)
- [Contributing Guidelines](https://github.com/your-username/echolab/blob/main/CONTRIBUTING.md)

## Getting Help

### For Developers

- Check existing [GitHub Issues](https://github.com/your-username/echolab/issues)
- Join [GitHub Discussions](https://github.com/your-username/echolab/discussions)
- Review the [FAQ](../user-guide/faq) for common questions

### For Contributors

- Read the [Contributing Guidelines](./pull-requests)
- Follow the [Code Style](./code-style) guide
- Understand the [Git Workflow](./git-workflow)

---

Ready to contribute? Start with the [Setup Guide](./setup) to get your development environment ready!
