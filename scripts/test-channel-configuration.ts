#!/usr/bin/env tsx

/**
 * Test script to verify autoUpdater channel configuration
 * 测试脚本验证 autoUpdater 渠道配置
 */

import { getUpdateChannel, getVersionInfo } from '../src/main/utils/version-parser'

console.log('🔍 Testing Channel Configuration / 测试渠道配置\n')

// Test different version scenarios
const testVersions = [
  '0.2.0-alpha.3', // Current project version
  '1.0.0', // Stable
  '1.0.0-beta.1', // Beta
  '1.0.0-dev.1', // Dev
  '1.0.0-test.1', // Test (should map to dev)
  '2.0.0-alpha.5' // Alpha
]

console.log('📋 Version Channel Mapping Results / 版本渠道映射结果:')
console.log('='.repeat(60))

testVersions.forEach((version) => {
  const channel = getUpdateChannel(version)
  const versionInfo = getVersionInfo(version)

  console.log(
    `Version: ${version.padEnd(20)} → Channel: ${channel.padEnd(10)} (Pattern: ${versionInfo.pattern?.name || 'none'})`
  )
})

console.log('\n' + '='.repeat(60))

// Test the effective channel logic simulation
console.log('\n🎯 Effective Channel Logic Test / 有效渠道逻辑测试:')

function simulateEffectiveChannel(
  currentVersion: string,
  userSetChannel?: string
): {
  currentVersion: string
  detectedChannel: string
  userSetChannel: string
  effectiveChannel: string
} {
  const detectedChannel = getUpdateChannel(currentVersion)

  // Simulate the logic from updateHandlers.ts
  const effectiveChannel =
    userSetChannel && userSetChannel !== 'stable' ? userSetChannel : detectedChannel

  return {
    currentVersion,
    detectedChannel,
    userSetChannel: userSetChannel || 'stable',
    effectiveChannel
  }
}

const scenarios = [
  { version: '0.2.0-alpha.3', userChannel: undefined },
  { version: '0.2.0-alpha.3', userChannel: 'stable' },
  { version: '0.2.0-alpha.3', userChannel: 'beta' },
  { version: '1.0.0', userChannel: undefined },
  { version: '1.0.0', userChannel: 'alpha' },
  { version: '1.0.0-beta.1', userChannel: 'stable' }
]

scenarios.forEach((scenario) => {
  const result = simulateEffectiveChannel(scenario.version, scenario.userChannel)
  console.log(`
Version: ${result.currentVersion}
User Setting: ${result.userSetChannel}
Auto-detected: ${result.detectedChannel}
→ Effective: ${result.effectiveChannel}
`)
})

console.log('\n✅ Channel configuration test completed / 渠道配置测试完成')

// Simulate autoUpdater configuration
console.log('\n🔧 AutoUpdater Configuration Simulation / AutoUpdater 配置模拟:')

const currentProjectVersion = '0.2.0-alpha.3'
const effectiveChannel = simulateEffectiveChannel(currentProjectVersion).effectiveChannel

console.log(`
Current Project Version: ${currentProjectVersion}
Effective Channel: ${effectiveChannel}
AutoUpdater would be configured with: autoUpdater.channel = "${effectiveChannel}"

In production, electron-updater will look for GitHub releases with tags like:
- For alpha channel: v0.2.0-alpha.4, v0.2.1-alpha.1, etc.
- For beta channel: v0.2.0-beta.1, v0.2.1-beta.1, etc.
- For stable channel: v0.2.0, v0.2.1, etc.
- For dev channel: v0.2.0-dev.1, v0.2.1-dev.1, etc.

The electron-builder.yml setting 'generateUpdatesFilesForAllChannels: true' 
ensures that update manifests are generated for all channels.
`)
