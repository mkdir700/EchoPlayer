import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { regionDetectionService } from '../RegionDetectionService'

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}))

vi.mock('../LoggerService', () => ({
  loggerService: {
    withContext: () => mockLogger
  }
}))

describe('RegionDetectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    regionDetectionService.clearCache()
  })

  afterEach(() => {
    regionDetectionService.clearCache()
  })

  it('should fetch country from API and cache the result', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ country: 'CN' })
    }

    const fetchSpy = vi.fn().mockResolvedValue(mockResponse)
    global.fetch = fetchSpy as any

    const firstCountry = await regionDetectionService.getCountry(true)
    expect(firstCountry).toBe('CN')
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const secondCountry = await regionDetectionService.getCountry()
    expect(secondCountry).toBe('CN')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('should return default country when API call fails', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('network error'))
    global.fetch = fetchSpy as any

    const country = await regionDetectionService.getCountry(true)
    expect(country).toBe('US')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('should detect Chinese regions correctly', () => {
    expect(regionDetectionService.isChinaCountry('CN')).toBe(true)
    expect(regionDetectionService.isChinaCountry('hk')).toBe(true)
    expect(regionDetectionService.isChinaCountry('TW')).toBe(true)
    expect(regionDetectionService.isChinaCountry('US')).toBe(false)
    expect(regionDetectionService.isChinaCountry(undefined)).toBe(false)
  })

  it('should determine China user status via isChinaUser', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ country: 'HK' })
    }

    const fetchSpy = vi.fn().mockResolvedValue(mockResponse)
    global.fetch = fetchSpy as any

    const isChina = await regionDetectionService.isChinaUser(true)
    expect(isChina).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('should refetch after cache cleared', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ country: 'JP' })
    }

    const fetchSpy = vi.fn().mockResolvedValue(mockResponse)
    global.fetch = fetchSpy as any

    await regionDetectionService.getCountry(true)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await regionDetectionService.getCountry()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    regionDetectionService.clearCache()

    await regionDetectionService.getCountry()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
