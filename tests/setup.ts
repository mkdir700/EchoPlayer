import { afterEach, beforeEach, vi } from 'vitest'

// Mock Electron app module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      const mockPaths = {
        userData: '/tmp/test-userData',
        appData: '/tmp/test-appData',
        documents: '/tmp/test-documents',
        downloads: '/tmp/test-downloads',
        desktop: '/tmp/test-desktop',
        home: '/tmp/test-home'
      }
      return mockPaths[name] || '/tmp/test-default'
    }),
    getAppPath: vi.fn(() => '/tmp/test-app'),
    setPath: vi.fn(),
    quit: vi.fn(),
    exit: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn()
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    on: vi.fn(),
    once: vi.fn(),
    handle: vi.fn(),
    emit: vi.fn()
  },
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
    showMessageBox: vi.fn()
  }
}))

// Mock Node.js fs module for directory operations
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true), // Always return true to avoid directory creation in tests
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(() => [])
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(() => [])
}))

vi.mock('node:fs/promises', () => ({
  default: {
    readdir: vi.fn(() => Promise.resolve([])),
    stat: vi.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false, size: 0 })),
    readFile: vi.fn(() => Promise.resolve('')),
    writeFile: vi.fn(() => Promise.resolve()),
    mkdir: vi.fn(() => Promise.resolve()),
    unlink: vi.fn(() => Promise.resolve())
  },
  readdir: vi.fn(() => Promise.resolve([])),
  stat: vi.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false, size: 0 })),
  readFile: vi.fn(() => Promise.resolve('')),
  writeFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve())
}))

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
    dictionary: {
      queryEudic: vi.fn()
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

// Polyfill getComputedStyle for components relying on scroll calculations
window.getComputedStyle = vi.fn().mockImplementation(() => {
  // Return a more complete mock based on the element type
  const computedStyle = {
    getPropertyValue: (prop: string) => {
      const propMap = {
        'overflow-x': 'visible',
        'overflow-y': 'visible',
        overflow: 'visible',
        position: 'static',
        'z-index': 'auto',
        display: 'block'
      }
      return propMap[prop] || ''
    },
    overflowX: 'visible',
    overflowY: 'visible',
    overflow: 'visible',
    position: 'static',
    zIndex: 'auto',
    display: 'block'
  }

  // Create a proxy to handle any missing properties
  return new Proxy(computedStyle, {
    get(target, prop) {
      if (prop in target) {
        return target[prop]
      }
      // For any other CSS property, return a sensible default
      if (typeof prop === 'string' && prop.includes('overflow')) {
        return 'visible'
      }
      return ''
    }
  })
})

// Mock document methods for better DOM handling
const originalQuerySelector = document.querySelector
document.querySelector = vi.fn().mockImplementation((selector) => {
  const element = originalQuerySelector.call(document, selector)
  if (element) return element

  // Return a mock element for cases where selector doesn't match
  return {
    style: {},
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100
    }),
    offsetParent: document.body,
    scrollTop: 0,
    scrollLeft: 0,
    clientTop: 0,
    clientLeft: 0
  }
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock speechSynthesis for pronunciation feature
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [])
}

global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: 'en-US',
  rate: 0.8,
  pitch: 1,
  volume: 1
}))

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
