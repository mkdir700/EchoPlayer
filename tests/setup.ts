import { afterEach, beforeEach, vi } from 'vitest'

// Mock Electron APIs
global.window = Object.assign(global.window, {
  api: {
    file: {
      select: vi.fn(),
      binaryImage: vi.fn(),
      base64File: vi.fn(),
      delete: vi.fn()
    },
    db: {
      files: {
        add: vi.fn(),
        findByPath: vi.fn(),
        findByType: vi.fn(),
        delete: vi.fn()
      },
      videoLibrary: {
        upsert: vi.fn(),
        findByFileId: vi.fn(),
        getRecentlyPlayed: vi.fn(),
        getFavorites: vi.fn(),
        updatePlayProgress: vi.fn(),
        toggleFavorite: vi.fn()
      },
      subtitleLibrary: {
        add: vi.fn(),
        findByVideoId: vi.fn(),
        findByVideoIdAndPath: vi.fn(),
        delete: vi.fn()
      }
    },
    recentPlays: {
      getRecentPlays: vi.fn(),
      addRecentPlay: vi.fn(),
      updateRecentPlay: vi.fn(),
      removeRecentPlay: vi.fn(),
      clearRecentPlays: vi.fn(),
      getRecentPlayByPath: vi.fn(),
      getRecentPlayByFileId: vi.fn(),
      searchRecentPlays: vi.fn(),
      removeMultipleRecentPlays: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      getRawData: vi.fn(),
      setRawData: vi.fn(),
      removeRawData: vi.fn(),
      toggleFavorite: vi.fn()
    }
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
global.localStorage = localStorageMock

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock performance API
global.performance = {
  ...performance,
  now: vi.fn(() => Date.now())
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset localStorage
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})
