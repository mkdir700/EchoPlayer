# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Environment Setup

```bash
# Use UV for dependency management
uv sync                    # Install dependencies and dev dependencies
uv sync --no-dev           # Install only production dependencies (packaged builds)
python -m venv .venv       # Create virtual environment (if not using uv)
source .venv/bin/activate  # Activate virtual environment
```

### Running the Application

```bash
python run.py              # Start the transcoding service (port 8799)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8799  # Development mode
```

### Development Tools

```bash
# Code quality
ruff check                 # Lint the codebase
ruff format               # Format code

# Testing
pytest                    # Run test suite
pytest tests/             # Run specific test directory
pytest -v tests/test_specific.py  # Run specific test file
```

## Architecture Overview

### Core System Design

This is a **high-performance video transcoding backend** built with FastAPI that provides real-time H.265/AC3/DTS to HLS transcoding for browser compatibility.

**Two Main Transcoding Modes:**

1. **Traditional Session-based**: Complete file transcoding with FFmpeg HLS output
2. **Advanced Segment-based**: JIT (Just-In-Time) segment transcoding with intelligent caching

### Key Architectural Components

**Service Layer (`src/app/services/`):**

- `transcoder.py`: Session-based transcoding with FFmpeg process management
- `segment_transcoder.py`: JIT segment transcoding with priority queuing
- `segment_manager.py`: Segment lifecycle and cache management
- `playlist_generator.py`: Dynamic HLS playlist generation
- `predictive_cache.py`: Intelligent segment preloading based on playback patterns

**API Layer (`src/app/api/`):**

- `/api/transcode/*`: Traditional session-based transcoding endpoints
- `/api/segment/*`: Advanced segment-based transcoding and playlist management

**Data Models:**

- `models/segment.py`: Segment state management and metadata
- `schemas/`: Request/response models for API validation
- `enum.py`: Status enums for transcoding states

### Critical System Patterns

**Session Management:**

- Sessions are auto-managed with TTL-based cleanup
- Multiple qualities supported (480p, 720p, 1080p)
- Hardware acceleration detection and fallback

**Segment-based Architecture:**

- Dynamic segment generation with configurable duration (1.5s default)
- Priority-based transcoding queue (seek operations get higher priority)
- Intelligent cache warming based on playback patterns
- RAM disk optimization for high-performance storage

**Performance Optimizations:**

- Background cleanup tasks for expired sessions/segments
- Concurrent transcoding with configurable limits
- Smart session reuse for nearby timestamps
- Predictive segment preloading

## Configuration

### Environment Variables

- `DEBUG`: Enable debug mode (default: false)
- `SESSIONS_ROOT`: Storage path for transcoded files (auto-detects RAM disk)
- `FFMPEG_PATH`: FFmpeg executable path (default: ffmpeg)
- `FFPROBE_PATH`: FFprobe executable path (default: ffprobe)
- `PREFER_HW`: Enable hardware acceleration (default: true)

### Key Settings (`src/app/settings.py`)

- `HLS_TIME`: Segment duration (1.5s)
- `MAX_CONCURRENT`: Concurrent transcoding limit (3)
- `SESSION_TTL`: Session idle timeout (120s)
- Auto-detection of RAM disk for optimal performance

## FFmpeg Dependencies

This project requires FFmpeg with support for:

- H.265 (HEVC) decoding
- Hardware acceleration (NVENC, VideoToolbox, VAAPI)
- HLS muxing and fMP4 container support

The system automatically detects hardware capabilities and falls back gracefully.
