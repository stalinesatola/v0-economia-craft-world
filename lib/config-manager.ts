import { neon } from "@neondatabase/serverless"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// ── Types ──────────────────────────────────────────

export interface MaintenanceConfig {
  enabled: boolean
  message: string
}

export interface AppConfig {
  pools: Record<string, string>
  productionCosts: Record<string, number>
  alertsConfig: Record<string, {
    enabled: boolean
    priority: string
    category: string
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
    priceAlertEnabled?: boolean
    priceAlertSymbol?: string
    priceAlertIntervalMinutes?: number
    customAlertMessage?: string
  }
  network: string
  users: UserEntry[]
  banners?: BannerConfig[]
  sharing?: SharingConfig
  customization?: CustomizationConfig
  maintenance?: MaintenanceConfig
  categories?: CategoryConfig[]
  recipes?: RecipeConfig[]
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

export interface CategoryConfig {
  id: string
  label: string
  color: string
  icon: string
  enabled: boolean
  order: number
}

export interface RecipeConfig {
  output: string
  inputs: { resource: string; quantity: number }[]
  level: number
}

export interface CustomizationConfig {
  headerLogo: string
  headerText: string
  footerCredits: string
  footerLinks: string
  footerDisclaimer: string
  loginTitle: string
  loginCredits: string
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  modules?: {
    showOpportunities: boolean
    showStats: boolean
    showBanners: boolean
    showChain: boolean
  }
  template?: "default" | "compact" | "cards"
  chartType?: "area" | "candlestick" | "line"
}

export interface ChainNode {
  symbol: string
  children: ChainNode[]
}

// ── Valid sections ──────────────────────────────────

const VALID_SECTIONS = [
  "pools", "productionCosts", "alertsConfig", "productionChains",
  "thresholds", "telegram", "network", "users", "banners",
  "sharing", "customization", "maintenance", "resourceImages",
  "categories", "recipes", "alertHistory",
]

// ── Config section read/write ──────────────────────

export async function getConfigSection(sectionName: string): Promise<unknown> {
  const sql = getSql()
  const rows = await sql`SELECT data FROM app_config WHERE section = ${sectionName}`
  if (rows.length === 0) return null
  return rows[0].data
}

export async function setConfigSection(sectionName: string, value: unknown): Promise<void> {
  if (!VALID_SECTIONS.includes(sectionName)) {
    throw new Error(`Unknown config section: ${sectionName}`)
  }
  const sql = getSql()
  const jsonValue = JSON.stringify(value)
  await sql`
    INSERT INTO app_config (section, data)
    VALUES (${sectionName}, ${jsonValue}::jsonb)
    ON CONFLICT (section) DO UPDATE SET data = ${jsonValue}::jsonb
  `
}

// ── Full config (assemble from all sections) ───────

export async function getConfig(): Promise<AppConfig> {
  const sql = getSql()
  const rows = await sql`SELECT section, data FROM app_config`

  const config: Record<string, unknown> = {}
  for (const row of rows) {
    config[row.section] = row.data
  }
  // Ensure all required sections have safe defaults when DB is empty
  const defaults: AppConfig = {
    pools: {},
    productionCosts: {},
    alertsConfig: {},
    productionChains: [],
    thresholds: { buy: 15, sell: 15 },
    telegram: { botToken: "", chatId: "", enabled: false, intervalMinutes: 30 },
    network: "ronin",
    users: [],
    banners: [],
    sharing: undefined,
    customization: undefined,
    maintenance: { enabled: false, message: "" },
  }

  return { ...defaults, ...config } as AppConfig
}

export async function getFullConfig(): Promise<AppConfig> {
  return getConfig()
}

export async function updateConfig(section: string, data: unknown): Promise<AppConfig> {
  await setConfigSection(section, data)
  return getConfig()
}

// ── Users (separate table) ─────────────────────────

export async function getUsers(): Promise<UserEntry[]> {
  const sql = getSql()
  const rows = await sql`SELECT username, password_hash, role, permissions, created_at FROM admin_users ORDER BY created_at ASC`
  return rows.map((r) => ({
    username: r.username,
    passwordHash: r.password_hash,
    role: r.role as "admin" | "viewer",
    permissions: r.permissions as UserPermissions | undefined,
    createdAt: r.created_at,
  }))
}

export async function getUserByUsername(username: string): Promise<UserEntry | null> {
  const sql = getSql()
  const rows = await sql`SELECT username, password_hash, role, permissions, created_at FROM admin_users WHERE username = ${username}`
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    username: r.username,
    passwordHash: r.password_hash,
    role: r.role as "admin" | "viewer",
    permissions: r.permissions as UserPermissions | undefined,
    createdAt: r.created_at,
  }
}

export async function createUser(user: { username: string; passwordHash: string; role: "admin" | "viewer"; permissions?: UserPermissions }): Promise<void> {
  const sql = getSql()
  const permsJson = user.permissions ? JSON.stringify(user.permissions) : null
  await sql`
    INSERT INTO admin_users (username, password_hash, role, permissions)
    VALUES (${user.username}, ${user.passwordHash}, ${user.role}, ${permsJson}::jsonb)
  `
}

export async function deleteUser(username: string): Promise<void> {
  const sql = getSql()
  await sql`DELETE FROM admin_users WHERE username = ${username}`
}

export async function updateUserPassword(username: string, newPasswordHash: string): Promise<void> {
  const sql = getSql()
  await sql`UPDATE admin_users SET password_hash = ${newPasswordHash} WHERE username = ${username}`
}

// ── Cache invalidation (noop for DB, kept for API compat) ──

export function invalidateCache(): void {
  // No-op: Neon queries are always fresh
}
