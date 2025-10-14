import { loggerService } from './LoggerService'

const logger = loggerService.withContext('RegionDetectionService')

const CHINESE_REGIONS = ['cn', 'hk', 'mo', 'tw']
const DEFAULT_COUNTRY = 'US'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

class RegionDetectionService {
  private cachedCountry: string | null = null
  private cacheTimestamp = 0
  private inFlightRequest: Promise<string> | null = null

  public async getCountry(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedCountry && !this.isCacheExpired()) {
      return this.cachedCountry
    }

    if (!forceRefresh && this.inFlightRequest) {
      return this.inFlightRequest
    }

    this.inFlightRequest = this.fetchCountry()
      .then((country) => {
        this.cachedCountry = country
        this.cacheTimestamp = Date.now()
        return country
      })
      .catch((error) => {
        logger.warn('获取 IP 国家信息失败，使用默认值', {
          error: error instanceof Error ? error.message : String(error)
        })
        this.cachedCountry = DEFAULT_COUNTRY
        this.cacheTimestamp = Date.now()
        return DEFAULT_COUNTRY
      })
      .finally(() => {
        this.inFlightRequest = null
      })

    return this.inFlightRequest
  }

  public async isChinaUser(forceRefresh = false): Promise<boolean> {
    const country = await this.getCountry(forceRefresh)
    return this.isChinaCountry(country)
  }

  public isChinaCountry(country?: string | null): boolean {
    return CHINESE_REGIONS.includes((country || '').toLowerCase())
  }

  private async fetchCountry(): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch('https://ipinfo.io/json', {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as { country?: string }
      return data.country || DEFAULT_COUNTRY
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('获取 IP 国家信息超时')
      } else {
        logger.warn('获取 IP 国家信息异常', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > CACHE_TTL
  }

  public clearCache(): void {
    this.cachedCountry = null
    this.cacheTimestamp = 0
    this.inFlightRequest = null
  }
}

export const regionDetectionService = new RegionDetectionService()
