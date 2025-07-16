import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.web.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'out/',
        'build/',
        'resources/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      '@preload': resolve(__dirname, 'src/preload'),
      '@types': resolve(__dirname, 'src/renderer/src/infrastructure/types'),
      '@shared': resolve(__dirname, 'packages/shared'),
      '@logger': resolve(__dirname, 'src/renderer/src/services/Logger')
    }
  }
})
