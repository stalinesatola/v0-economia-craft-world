import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const CONFIG_PATH = join(process.cwd(), "data", "config.json")

export interface MaintenanceConfig {
  enabled: boolean
  message: string
}

export interface AppConfig {
  pools: Record<string, string>
  productionCosts: Record<string, {
    cost_usd: number
    source?: string
    input?: string
    ratio?: number
    levels: number
  }>
  alertsConfig: Record<string, {
    enabled: boolean
    priority: "high" | "medium" | "low"
    category: "mine" | "factory" | "token"
  }>
  productionChains: ChainNode[]
  thresholds: {
    buy: number
    sell: number
  }
  telegram: {
    botToken: string
    chatId: string
    enabled: boolean
    intervalMinutes: number
  }
  network: string
  users: UserEntry[]
  banners?: BannerConfig[]
  sharing?: SharingConfig
  customization?: CustomizationConfig
  maintenance?: MaintenanceConfig
}

export interface UserPermissions {
  pools: boolean
  chains: boolean
  telegram: boolean
  sharing: boolean
  banners: boolean
  settings: boolean
  users: boolean
}

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  pools: true, chains: true, telegram: true, sharing: true, banners: true, settings: true, users: true,
}

export const DEFAULT_VIEWER_PERMISSIONS: UserPermissions = {
  pools: false, chains: false, telegram: false, sharing: false, banners: false, settings: false, users: false,
}

export interface UserEntry {
  username: string
  passwordHash: string
  role: "admin" | "viewer"
  permissions?: UserPermissions
  createdAt: string
}

export interface BannerConfig {
  id: string
  position: "top" | "sidebar" | "between"
  enabled: boolean
  imageUrl: string
  linkUrl: string
  altText: string
  adScript: string
}

export interface SharingConfig {
  twitter: {
    enabled: boolean
    apiKey: string
    apiSecret: string
    accessToken: string
    accessSecret: string
    minDeviation: number
    hashtags: string
    template: string
  }
  telegramChannels: {
    enabled: boolean
    chatIds: string[]
    minDeviation: number
    template: string
  }
}

export interface CustomizationConfig {
  headerLogo: string
  headerText: string
  footerCredits: string
  footerLinks: string
  footerDisclaimer: string
  loginTitle: string
  loginCredits: string
}

export interface ChainNode {
  symbol: string
  children: ChainNode[]
}

// In-memory cache to avoid repeated disk reads
let cachedConfig: AppConfig | null = null
let lastReadTime = 0
const CACHE_TTL = 5000 // 5 seconds

export function getConfig(): AppConfig {
  const now = Date.now()

  // Return cache if still valid
  if (cachedConfig && now - lastReadTime < CACHE_TTL) {
    return cachedConfig
  }

  try {
    if (!existsSync(CONFIG_PATH)) {
      throw new Error("Config file not found")
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8")
    cachedConfig = JSON.parse(raw) as AppConfig
    lastReadTime = now
    return cachedConfig
  } catch {
    // Fallback: try to import defaults from craft-data
    throw new Error("Failed to read config. Ensure data/config.json exists.")
  }
}

export function updateConfig(section: string, data: unknown): AppConfig {
  const config = getConfig()
  const key = section as keyof AppConfig

  if (!(key in config)) {
    throw new Error(`Unknown config section: ${section}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(config as any)[key] = data

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")

  // Update cache
  cachedConfig = config
  lastReadTime = Date.now()

  return config
}

export function getFullConfig(): AppConfig {
  return getConfig()
}

// Invalidate cache (useful after external edits)
export function invalidateCache(): void {
  cachedConfig = null
  lastReadTime = 0
}
