import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const CONFIG_PATH = join(process.cwd(), "data", "config.json")

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
