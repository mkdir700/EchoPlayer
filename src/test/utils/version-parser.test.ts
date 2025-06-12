/**
 * Unit tests for version parser utilities
 * 版本解析工具的单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  getUpdateChannel,
  isValidVersionFormat,
  getVersionInfo,
  VERSION_SUFFIX_PATTERNS,
  type UpdateChannel,
  type VersionInfo
} from '../../main/utils/version-parser'

describe('Version Parser', () => {
  describe('getUpdateChannel', () => {
    it('should detect alpha versions correctly', () => {
      const alphaVersions = [
        '0.2.0-alpha',
        '0.2.0-alpha.1',
        '0.2.0-alpha.3',
        '1.0.0-alpha.5',
        '2.1.3-alpha.10'
      ]

      alphaVersions.forEach((version) => {
        expect(getUpdateChannel(version)).toBe('alpha')
      })
    })

    it('should detect beta versions correctly', () => {
      const betaVersions = ['0.2.0-beta', '0.2.0-beta.1', '1.0.0-beta.3', '2.1.0-beta.5']

      betaVersions.forEach((version) => {
        expect(getUpdateChannel(version)).toBe('beta')
      })
    })

    it('should detect dev versions correctly', () => {
      const devVersions = ['0.2.0-dev', '0.2.0-dev.0', '0.2.0-dev.1', '1.0.0-dev.5']

      devVersions.forEach((version) => {
        expect(getUpdateChannel(version)).toBe('dev')
      })
    })

    it('should detect test versions correctly', () => {
      const testVersions = ['0.2.0-test', '0.2.0-test.1', '1.0.0-test.3']

      testVersions.forEach((version) => {
        expect(getUpdateChannel(version)).toBe('dev')
      })
    })

    it('should detect stable versions correctly', () => {
      const stableVersions = ['0.2.0', '1.0.0', '2.1.5', '10.15.3']

      stableVersions.forEach((version) => {
        expect(getUpdateChannel(version)).toBe('stable')
      })
    })

    it('should handle invalid inputs gracefully', () => {
      const invalidInputs = [
        '',
        null,
        undefined,
        '   ',
        'invalid-version',
        '1.2',
        '1.2.3.4',
        '1.2.3-unknown'
      ]

      invalidInputs.forEach((input) => {
        expect(getUpdateChannel(input as string)).toBe('stable')
      })
    })

    it('should prioritize dev/test over other patterns', () => {
      // Test that dev patterns have higher priority than alpha/beta
      expect(getUpdateChannel('1.0.0-dev.1')).toBe('dev')
      expect(getUpdateChannel('1.0.0-test.1')).toBe('dev')
    })

    it('should handle whitespace correctly', () => {
      expect(getUpdateChannel('  1.0.0-alpha.1  ')).toBe('alpha')
      expect(getUpdateChannel('\t1.0.0-beta.1\n')).toBe('beta')
    })
  })

  describe('isValidVersionFormat', () => {
    it('should validate correct version formats', () => {
      const validVersions = [
        '0.2.0',
        '0.2.0-alpha',
        '0.2.0-alpha.1',
        '0.2.0-beta',
        '0.2.0-beta.1',
        '0.2.0-dev',
        '0.2.0-dev.1',
        '0.2.0-test',
        '0.2.0-test.1',
        '1.0.0',
        '10.15.3-alpha.5'
      ]

      validVersions.forEach((version) => {
        expect(isValidVersionFormat(version)).toBe(true)
      })
    })

    it('should reject invalid version formats', () => {
      const invalidVersions = [
        '',
        'invalid',
        '1.2',
        '1.2.3.4',
        '1.2.3-unknown',
        '1.2.3-alpha-beta',
        'v1.2.3',
        '1.2.3-',
        '1.2.3-alpha.',
        null,
        undefined
      ]

      invalidVersions.forEach((version) => {
        expect(isValidVersionFormat(version as string)).toBe(false)
      })
    })
  })

  describe('getVersionInfo', () => {
    it('should return complete version information for valid versions', () => {
      const testCases: Array<{
        version: string
        expectedChannel: UpdateChannel
        expectedValid: boolean
      }> = [
        { version: '1.0.0', expectedChannel: 'stable', expectedValid: true },
        { version: '1.0.0-alpha.1', expectedChannel: 'alpha', expectedValid: true },
        { version: '1.0.0-beta.1', expectedChannel: 'beta', expectedValid: true },
        { version: '1.0.0-dev.1', expectedChannel: 'dev', expectedValid: true },
        { version: '1.0.0-test.1', expectedChannel: 'dev', expectedValid: true },
        { version: 'invalid', expectedChannel: 'stable', expectedValid: false }
      ]

      testCases.forEach(({ version, expectedChannel, expectedValid }) => {
        const info: VersionInfo = getVersionInfo(version)

        expect(info.version).toBe(version)
        expect(info.channel).toBe(expectedChannel)
        expect(info.isValid).toBe(expectedValid)

        if (expectedValid) {
          expect(info.pattern).not.toBeNull()
          expect(info.pattern?.channel).toBe(expectedChannel)
        }
      })
    })
  })

  describe('VERSION_SUFFIX_PATTERNS', () => {
    it('should have patterns sorted by priority', () => {
      for (let i = 0; i < VERSION_SUFFIX_PATTERNS.length - 1; i++) {
        expect(VERSION_SUFFIX_PATTERNS[i].priority).toBeGreaterThanOrEqual(
          VERSION_SUFFIX_PATTERNS[i + 1].priority
        )
      }
    })

    it('should have all required properties for each pattern', () => {
      VERSION_SUFFIX_PATTERNS.forEach((pattern) => {
        expect(pattern.name).toBeDefined()
        expect(pattern.pattern).toBeInstanceOf(RegExp)
        expect(pattern.channel).toBeDefined()
        expect(typeof pattern.priority).toBe('number')
        expect(pattern.description).toBeDefined()
        expect(Array.isArray(pattern.examples)).toBe(true)
        expect(pattern.examples.length).toBeGreaterThan(0)
      })
    })

    it('should have working examples for each pattern', () => {
      VERSION_SUFFIX_PATTERNS.forEach((pattern) => {
        pattern.examples.forEach((example) => {
          expect(pattern.pattern.test(example)).toBe(true)
          expect(getUpdateChannel(example)).toBe(pattern.channel)
        })
      })
    })
  })
})
