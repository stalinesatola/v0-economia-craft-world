// Craft World Economy - All game data
// Pools on Ronin network via GeckoTerminal

export const NETWORK = "ronin"
export const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"

export const POOLS: Record<string, string> = {
  COIN: "0x8d896c96ffcafbf12d86dd4510236de7bcfa7dcf",
  EARTH: "0xc356cd52364541379ad4d31a889b7031e758220a",
  MUD: "0xb287ea5a5cd4f2b74571e30fdec96241aa5163d9",
  CLAY: "0x8b1a1b7b43a53904b0a05406c13399079e553501",
  SAND: "0x6d8839a585f7877a5e218a217c07334980f04a4a",
  COPPER: "0xe9e419dbe8e0e056bb91989eb10f5fa62a0cb702",
  STEEL: "0x58b2487718700fa5773ea936aad01ad3343c6f39",
  SCREWS: "0x0016c4c602cc1a96a9d35fe133a7e374d3cdc26d",
  WATER: "0xe9c0995144a199241a5c46ccb7e7cd439af3ac75",
  SEAWATER: "0xd1d6bb059c97295f7437ad423111047cbcddf4c6",
  ALGAE: "0xe63f8cefea9a17a259bb3b375929bd10d5e1cdfa",
  OXYGEN: "0x4343846ebe54dcd40ba572275640230d533296e5",
  GAS: "0x4782e36bbe6e9abca5357d3e43a090fa772de71b",
  FUEL: "0x0f8f4dcf1b6eb9f5c0e8fbb9cd6879aa3983c8bc",
  OIL: "0x6f363e6760876a4c66730fbbefccdd3014b6220c",
  FIRE: "0xe973dc221bb031010ec673105ed8b04c9e713b9d",
  HEAT: "0x6ccd01c951e57d82be8dccb90c01a58bfb4d83cd",
  LAVA: "0x54ae64826ca9d440ede8c33e6cf4cfa1a3aa5801",
  GLASS: "0x7aa1cc00ca62982ab10d12fd4f6b6687f33011ad",
  SULFUR: "0x346e30b7ca273fb001eec84fabf2b693617df710",
  FIBERGLASS: "0x0ffb7bd0bc009a01f9f9e95a0f563bad2189f151",
  CERAMICS: "0xfa3a564b27deb29781f80032df662a4406eebef6",
  STONE: "0xda4145a4975b1219e85a233673187309c4840044",
  STEAM: "0x7bf03c63adfded079adbd9f807ccce0fd28b8fd8",
  CEMENT: "0x491a412400840651c243acfc1ed9947ffe8a4e8f",
  ACID: "0xefc128c4cb990a5ecc88ff71e9efcc0eaef434d2",
  PLASTICS: "0x0ab775634107063a7c16c6c8e0fd6bda1f219ae6",
  ENERGY: "0xb0a3c31aae83526fd6ee75aac552822d676f46b2",
  HYDROGEN: "0xbb155716cd99d7ef8fd3fb45c91d39958c95b088",
  DYNAMITE: "0x85172e7ff5040366fa5a3caf7b1bd969bb06b570",
}

export type ResourceCategory = "mine" | "factory" | "token" | "base" | "advanced" | "defi"
export type Priority = "high" | "medium" | "low"

export interface ProductionCost {
  cost_usd: number
  source?: string
  input?: string
  ratio?: number
  levels: number
}

export interface ResourceConfig {
  enabled: boolean
  priority: Priority
  category: ResourceCategory
}

export interface ResourceInfo {
  name: string
  symbol: string
  poolAddress: string
  productionCost: number
  input?: string
  ratio?: number
  levels: number
  category: string
  priority: string
  enabled: boolean
  source?: string
}

export const PRODUCTION_COSTS: Record<string, ProductionCost> = {
  // Base resources (mines)
  EARTH: { cost_usd: 0.0001, source: "mine", levels: 50 },
  FIRE: { cost_usd: 0.01, source: "mine", levels: 30 },
  WATER: { cost_usd: 0.00001, source: "base", levels: 1 },
  // Factories
  MUD: { cost_usd: 0.0003, input: "EARTH", ratio: 3, levels: 50 },
  CLAY: { cost_usd: 0.001, input: "MUD", ratio: 10, levels: 40 },
  SAND: { cost_usd: 0.001, input: "CLAY", ratio: 3, levels: 35 },
  COPPER: { cost_usd: 0.01, input: "SAND", ratio: 30, levels: 30 },
  STEEL: { cost_usd: 0.05, input: "COPPER", ratio: 5, levels: 20 },
  SCREWS: { cost_usd: 0.1, input: "STEEL", ratio: 3, levels: 15 },
  HEAT: { cost_usd: 0.05, input: "FIRE", ratio: 18, levels: 30 },
  LAVA: { cost_usd: 0.1, input: "HEAT", ratio: 4, levels: 20 },
  GLASS: { cost_usd: 0.1, input: "SAND", ratio: 180, levels: 20 },
  SULFUR: { cost_usd: 0.5, input: "STEEL", ratio: 8, levels: 10 },
  FIBERGLASS: { cost_usd: 1.0, input: "GLASS", ratio: 10, levels: 10 },
  CERAMICS: { cost_usd: 0.5, input: "CLAY", ratio: 300, levels: 20 },
  STONE: { cost_usd: 0.5, input: "COPPER", ratio: 10, levels: 15 },
  STEAM: { cost_usd: 1.0, input: "OXYGEN", ratio: 2, levels: 15 },
  CEMENT: { cost_usd: 1.0, input: "CERAMICS", ratio: 10, levels: 15 },
  ACID: { cost_usd: 2.0, input: "SCREWS", ratio: 2, levels: 10 },
  PLASTICS: { cost_usd: 5.0, input: "CEMENT", ratio: 3, levels: 10 },
  ENERGY: { cost_usd: 0.5, input: "OIL", ratio: 2, levels: 10 },
  HYDROGEN: { cost_usd: 1.0, input: "STEAM", ratio: 7, levels: 5 },
  DYNAMITE: { cost_usd: 2.0, input: "FIBERGLASS", ratio: 3, levels: 5 },
  SEAWATER: { cost_usd: 0.001, input: "WATER", ratio: 16, levels: 30 },
  ALGAE: { cost_usd: 0.01, input: "SEAWATER", ratio: 4, levels: 20 },
  OXYGEN: { cost_usd: 0.1, input: "ALGAE", ratio: 3, levels: 20 },
  GAS: { cost_usd: 0.5, input: "OXYGEN", ratio: 2, levels: 15 },
  FUEL: { cost_usd: 1.0, input: "GAS", ratio: 3, levels: 15 },
  OIL: { cost_usd: 2.0, input: "FUEL", ratio: 3, levels: 10 },
  COIN: { cost_usd: 0, source: "token", levels: 0 },
}

export const ALERTS_CONFIG: Record<string, ResourceConfig> = {
  EARTH: { enabled: true, priority: "high", category: "mine" },
  MUD: { enabled: true, priority: "high", category: "factory" },
  CLAY: { enabled: true, priority: "high", category: "factory" },
  SAND: { enabled: true, priority: "high", category: "factory" },
  COPPER: { enabled: true, priority: "high", category: "factory" },
  STEEL: { enabled: true, priority: "high", category: "factory" },
  SCREWS: { enabled: true, priority: "high", category: "factory" },
  FIRE: { enabled: true, priority: "medium", category: "mine" },
  HEAT: { enabled: true, priority: "medium", category: "factory" },
  LAVA: { enabled: true, priority: "medium", category: "factory" },
  GLASS: { enabled: true, priority: "medium", category: "factory" },
  SULFUR: { enabled: true, priority: "medium", category: "factory" },
  FIBERGLASS: { enabled: true, priority: "medium", category: "factory" },
  CERAMICS: { enabled: true, priority: "medium", category: "factory" },
  STONE: { enabled: true, priority: "medium", category: "factory" },
  STEAM: { enabled: true, priority: "medium", category: "factory" },
  CEMENT: { enabled: true, priority: "medium", category: "factory" },
  ACID: { enabled: true, priority: "medium", category: "factory" },
  PLASTICS: { enabled: true, priority: "medium", category: "factory" },
  ENERGY: { enabled: true, priority: "high", category: "factory" },
  HYDROGEN: { enabled: true, priority: "high", category: "factory" },
  DYNAMITE: { enabled: true, priority: "high", category: "factory" },
  SEAWATER: { enabled: false, priority: "low", category: "factory" },
  ALGAE: { enabled: false, priority: "low", category: "factory" },
  OXYGEN: { enabled: false, priority: "low", category: "factory" },
  GAS: { enabled: false, priority: "low", category: "factory" },
  FUEL: { enabled: false, priority: "low", category: "factory" },
  OIL: { enabled: false, priority: "low", category: "factory" },
  WATER: { enabled: false, priority: "low", category: "factory" },
  COIN: { enabled: false, priority: "low", category: "token" },
}

// Production chains for visualization
export interface ChainNode {
  symbol: string
  children: ChainNode[]
}

export const PRODUCTION_CHAINS: ChainNode[] = [
  {
    symbol: "EARTH",
    children: [
      {
        symbol: "MUD",
        children: [
          {
            symbol: "CLAY",
            children: [
              {
                symbol: "SAND",
                children: [
                  {
                    symbol: "COPPER",
                    children: [
                      {
                        symbol: "STEEL",
                        children: [
                          { symbol: "SCREWS", children: [{ symbol: "ACID", children: [] }] },
                          { symbol: "SULFUR", children: [] },
                        ],
                      },
                      { symbol: "STONE", children: [] },
                    ],
                  },
                  {
                    symbol: "GLASS",
                    children: [{ symbol: "FIBERGLASS", children: [{ symbol: "DYNAMITE", children: [] }] }],
                  },
                ],
              },
              {
                symbol: "CERAMICS",
                children: [{ symbol: "CEMENT", children: [{ symbol: "PLASTICS", children: [] }] }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    symbol: "FIRE",
    children: [{ symbol: "HEAT", children: [{ symbol: "LAVA", children: [] }] }],
  },
  {
    symbol: "WATER",
    children: [
      {
        symbol: "SEAWATER",
        children: [
          {
            symbol: "ALGAE",
            children: [
              {
                symbol: "OXYGEN",
                children: [
                  { symbol: "GAS", children: [{ symbol: "FUEL", children: [{ symbol: "OIL", children: [{ symbol: "ENERGY", children: [] }] }] }] },
                  { symbol: "STEAM", children: [{ symbol: "HYDROGEN", children: [] }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

export const BUY_THRESHOLD = 15
export const SELL_THRESHOLD = 20

export function getAllResources(): ResourceInfo[] {
  return Object.entries(POOLS).map(([symbol, poolAddress]) => {
    const cost = PRODUCTION_COSTS[symbol]
    const config = ALERTS_CONFIG[symbol]
    return {
      name: symbol,
      symbol,
      poolAddress,
      productionCost: cost?.cost_usd ?? 0,
      input: cost?.input,
      ratio: cost?.ratio,
      levels: cost?.levels ?? 0,
      category: config?.category ?? "factory",
      priority: config?.priority ?? "low",
      enabled: config?.enabled ?? false,
      source: cost?.source,
    }
  })
}

export function formatPrice(value: number): string {
  if (value === 0) return "$0.00"
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  if (value >= 0.0001) return `$${value.toFixed(6)}`
  return `$${value.toFixed(8)}`
}

export function getDeviationColor(deviation: number): string {
  if (deviation < -BUY_THRESHOLD) return "text-success"
  if (deviation > SELL_THRESHOLD) return "text-destructive"
  return "text-muted-foreground"
}

export function getDeviationLabel(deviation: number): string {
  if (deviation < -BUY_THRESHOLD) return "COMPRAR"
  if (deviation > SELL_THRESHOLD) return "VENDER"
  return "NEUTRO"
}
