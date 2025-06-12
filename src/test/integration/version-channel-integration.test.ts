/**
 * Integration tests for version channel mapping functionality
 * 版本渠道映射功能的集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getUpdateChannel, getVersionInfo } from '../../main/utils/version-parser'

// Mock electron app module
const mockApp = {
  getVersion: vi.fn()
}

vi.mock('electron', () => ({
  app: mockApp
}))

describe('Version Channel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Real-world version scenarios', () => {
    it('should handle current project version correctly', () => {
      // Test with the actual project version from package.json
      const projectVersion = '0.2.0-alpha.3'
      mockApp.getVersion.mockReturnValue(projectVersion)

      const channel = getUpdateChannel(projectVersion)
      const versionInfo = getVersionInfo(projectVersion)

      expect(channel).toBe('alpha')
      expect(versionInfo.channel).toBe('alpha')
      expect(versionInfo.isValid).toBe(true)
      expect(versionInfo.pattern?.name).toBe('alpha')
    })

    it('should handle development workflow versions', () => {
      const testCases = [
        // Development versions
        { version: '0.3.0-dev', expectedChannel: 'dev' },
        { version: '0.3.0-dev.1', expectedChannel: 'dev' },
        { version: '1.0.0-dev.10', expectedChannel: 'dev' },

        // Test versions (mapped to dev channel)
        { version: '0.3.0-test', expectedChannel: 'dev' },
        { version: '0.3.0-test.1', expectedChannel: 'dev' },

        // Alpha versions
        { version: '0.3.0-alpha', expectedChannel: 'alpha' },
        { version: '0.3.0-alpha.1', expectedChannel: 'alpha' },
        { version: '1.0.0-alpha.5', expectedChannel: 'alpha' },

        // Beta versions
        { version: '0.3.0-beta', expectedChannel: 'beta' },
        { version: '0.3.0-beta.1', expectedChannel: 'beta' },
        { version: '1.0.0-beta.3', expectedChannel: 'beta' },

        // Stable versions
        { version: '0.3.0', expectedChannel: 'stable' },
        { version: '1.0.0', expectedChannel: 'stable' },
        { version: '2.1.5', expectedChannel: 'stable' }
      ]

      testCases.forEach(({ version, expectedChannel }) => {
        mockApp.getVersion.mockReturnValue(version)

        const detectedChannel = getUpdateChannel(version)
        const versionInfo = getVersionInfo(version)

        expect(detectedChannel).toBe(expectedChannel)
        expect(versionInfo.channel).toBe(expectedChannel)
        expect(versionInfo.isValid).toBe(true)
        expect(versionInfo.version).toBe(version)
      })
    })

    it('should prioritize dev/test versions over other patterns', () => {
      // These should all be detected as 'dev' channel due to higher priority
      const devVersions = ['1.0.0-dev.1', '1.0.0-test.1', '2.0.0-dev', '2.0.0-test']

      devVersions.forEach((version) => {
        const channel = getUpdateChannel(version)
        expect(channel).toBe('dev')
      })
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        { version: '', expectedChannel: 'stable' },
        { version: '   ', expectedChannel: 'stable' },
        { version: 'invalid-version', expectedChannel: 'stable' },
        { version: '1.2', expectedChannel: 'stable' },
        { version: '1.2.3.4', expectedChannel: 'stable' },
        { version: '1.2.3-unknown', expectedChannel: 'stable' }
      ]

      edgeCases.forEach(({ version, expectedChannel }) => {
        const detectedChannel = getUpdateChannel(version)
        expect(detectedChannel).toBe(expectedChannel)
      })
    })

    it('should handle whitespace and formatting variations', () => {
      const variations = [
        { version: '  1.0.0-alpha.1  ', expectedChannel: 'alpha' },
        { version: '\t1.0.0-beta.1\n', expectedChannel: 'beta' },
        { version: ' 1.0.0-dev.1 ', expectedChannel: 'dev' },
        { version: '1.0.0 ', expectedChannel: 'stable' }
      ]

      variations.forEach(({ version, expectedChannel }) => {
        const detectedChannel = getUpdateChannel(version)
        expect(detectedChannel).toBe(expectedChannel)
      })
    })
  })

  describe('Version info completeness', () => {
    it('should provide complete version information', () => {
      const testVersion = '1.2.3-alpha.5'
      const versionInfo = getVersionInfo(testVersion)

      // Check all required properties are present
      expect(versionInfo).toHaveProperty('version')
      expect(versionInfo).toHaveProperty('channel')
      expect(versionInfo).toHaveProperty('pattern')
      expect(versionInfo).toHaveProperty('isValid')

      // Check values are correct
      expect(versionInfo.version).toBe(testVersion)
      expect(versionInfo.channel).toBe('alpha')
      expect(versionInfo.isValid).toBe(true)
      expect(versionInfo.pattern).not.toBeNull()
      expect(versionInfo.pattern?.name).toBe('alpha')
      expect(versionInfo.pattern?.channel).toBe('alpha')
    })

    it('should handle invalid versions in version info', () => {
      const invalidVersion = 'not-a-version'
      const versionInfo = getVersionInfo(invalidVersion)

      expect(versionInfo.version).toBe(invalidVersion)
      expect(versionInfo.channel).toBe('stable') // fallback
      expect(versionInfo.isValid).toBe(false)
      expect(versionInfo.pattern).toBeNull()
    })
  })

  describe('Pattern matching accuracy', () => {
    it('should match exact patterns without false positives', () => {
      // These should NOT match any specific pattern and default to stable
      const nonMatchingVersions = [
        '1.2.3-alphabeta', // contains 'alpha' but not exact match
        '1.2.3-beta-alpha', // multiple suffixes
        '1.2.3-dev-test', // multiple suffixes
        '1.2.3-alpha.', // trailing dot
        '1.2.3-beta.a', // non-numeric after dot
        'v1.2.3-alpha.1', // version prefix
        '1.2.3-ALPHA.1' // case sensitivity
      ]

      nonMatchingVersions.forEach((version) => {
        const channel = getUpdateChannel(version)
        expect(channel).toBe('stable')
      })
    })

    it('should match patterns with correct precedence', () => {
      // Test that patterns are matched in correct priority order
      const versionInfo = getVersionInfo('1.0.0-dev.1')

      expect(versionInfo.channel).toBe('dev')
      expect(versionInfo.pattern?.priority).toBeGreaterThan(80) // dev has higher priority than alpha/beta
    })
  })
})
