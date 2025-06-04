#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json')

/**
 * Version types and their meanings:
 * - dev: Development version (for active development)
 * - test: Test version (for internal testing)
 * - alpha: Alpha version (early preview, may have bugs)
 * - beta: Beta version (feature complete, testing phase)
 * - stable: Stable version (production ready)
 */

type VersionType = 'dev' | 'test' | 'alpha' | 'beta' | 'stable'
type IncrementType = 'major' | 'minor' | 'patch'

interface PackageJson {
  version: string
  [key: string]: unknown
}

interface ParsedVersion {
  major: number
  minor: number
  patch: number
  prerelease: string | null
}

function readPackageJson(): PackageJson {
  const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')
  return JSON.parse(content) as PackageJson
}

function writePackageJson(packageData: PackageJson): void {
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageData, null, 2) + '\n')
}

function parseVersion(version: string): ParsedVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)
  if (!match) {
    throw new Error(`Invalid version format: ${version}`)
  }

  const [, major, minor, patch, prerelease] = match
  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease: prerelease || null
  }
}

function formatVersion(versionObj: ParsedVersion): string {
  const base = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  return versionObj.prerelease ? `${base}-${versionObj.prerelease}` : base
}

function detectVersionType(version: string): VersionType {
  if (!version) return 'stable'

  if (version.includes('dev')) return 'dev'
  if (version.includes('test')) return 'test'
  if (version.includes('alpha')) return 'alpha'
  if (version.includes('beta')) return 'beta'
  return 'stable'
}

function incrementVersion(
  currentVersion: string,
  type: IncrementType,
  versionType: VersionType = 'stable'
): string {
  const parsed = parseVersion(currentVersion)

  switch (type) {
    case 'major': {
      parsed.major++
      parsed.minor = 0
      parsed.patch = 0
      break
    }
    case 'minor': {
      parsed.minor++
      parsed.patch = 0
      break
    }
    case 'patch': {
      parsed.patch++
      break
    }
    default: {
      throw new Error(`Invalid increment type: ${type}`)
    }
  }

  // Set prerelease based on version type
  if (versionType === 'stable') {
    parsed.prerelease = null
  } else if (versionType === 'beta') {
    parsed.prerelease = 'beta.1'
  } else if (versionType === 'alpha') {
    parsed.prerelease = 'alpha.1'
  } else if (versionType === 'dev') {
    parsed.prerelease = 'dev.1'
  } else if (versionType === 'test') {
    parsed.prerelease = 'test.1'
  }

  return formatVersion(parsed)
}

function incrementPrerelease(currentVersion: string): string {
  const parsed = parseVersion(currentVersion)

  if (!parsed.prerelease) {
    throw new Error('Cannot increment prerelease on stable version')
  }

  const match = parsed.prerelease.match(/^(.+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Invalid prerelease format: ${parsed.prerelease}`)
  }

  const [, type, number] = match
  parsed.prerelease = `${type}.${parseInt(number, 10) + 1}`

  return formatVersion(parsed)
}

function main(): void {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log(`
Usage: node version-manager.js <command> [options]

Commands:
  current                    Show current version and type
  set <version>             Set specific version (e.g., 1.0.0, 1.0.0-beta.1)
  major [type]              Increment major version (type: stable|beta|alpha|dev|test)
  minor [type]              Increment minor version (type: stable|beta|alpha|dev|test)
  patch [type]              Increment patch version (type: stable|beta|alpha|dev|test)
  prerelease                Increment prerelease number (e.g., beta.1 -> beta.2)
  
Examples:
  node version-manager.js current
  node version-manager.js set 1.0.0-beta.1
  node version-manager.js minor beta
  node version-manager.js prerelease
    `)
    return
  }

  const packageData = readPackageJson()
  const currentVersion = packageData.version
  const currentType = detectVersionType(currentVersion)

  try {
    switch (command) {
      case 'current': {
        console.log(`Current version: ${currentVersion}`)
        console.log(`Version type: ${currentType}`)
        break
      }

      case 'set': {
        const newVersion = args[1]
        if (!newVersion) {
          console.error('Please provide a version number')
          process.exit(1)
        }
        packageData.version = newVersion
        writePackageJson(packageData)
        console.log(`Version updated to: ${newVersion}`)
        console.log(`Version type: ${detectVersionType(newVersion)}`)
        break
      }

      case 'major':
      case 'minor':
      case 'patch': {
        const versionType = (args[1] as VersionType) || 'stable'
        const incrementedVersion = incrementVersion(currentVersion, command, versionType)
        packageData.version = incrementedVersion
        writePackageJson(packageData)
        console.log(`Version updated from ${currentVersion} to ${incrementedVersion}`)
        console.log(`Version type: ${detectVersionType(incrementedVersion)}`)
        break
      }

      case 'prerelease': {
        const prereleaseVersion = incrementPrerelease(currentVersion)
        packageData.version = prereleaseVersion
        writePackageJson(packageData)
        console.log(`Version updated from ${currentVersion} to ${prereleaseVersion}`)
        console.log(`Version type: ${detectVersionType(prereleaseVersion)}`)
        break
      }

      default: {
        console.error(`Unknown command: ${command}`)
        process.exit(1)
      }
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export {
  parseVersion,
  formatVersion,
  detectVersionType,
  incrementVersion,
  incrementPrerelease,
  type VersionType,
  type IncrementType,
  type ParsedVersion,
  type PackageJson
}
