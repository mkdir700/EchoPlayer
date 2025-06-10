import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Electron IPC
global.fetch = vi.fn()

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}

// Setup MSW for API mocking
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'

export const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
