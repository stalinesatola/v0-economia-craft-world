// Resource image URLs - using placeholder colored icons mapped to game resources
// These represent the visual identity of each resource in the production chain

export const RESOURCE_COLORS: Record<string, string> = {
  EARTH: "#8B4513",
  SOIL: "#8B4513",
  MUD: "#6B3410",
  CLAY: "#C67B4E",
  SAND: "#E8D4A0",
  COPPER: "#B87333",
  STEEL: "#A8A8A8",
  SCREWS: "#7B7B7B",
  WATER: "#4A90D9",
  SEAWATER: "#2E7D9E",
  ALGAE: "#4CAF50",
  OXYGEN: "#81C784",
  GAS: "#64B5F6",
  FUEL: "#388E3C",
  OIL: "#3E2723",
  FIRE: "#FF5722",
  HEAT: "#FF7043",
  LAVA: "#E65100",
  GLASS: "#B3E5FC",
  SULFUR: "#FFC107",
  FIBERGLASS: "#90CAF9",
  CERAMICS: "#BCAAA4",
  STONE: "#9E9E9E",
  STEAM: "#B0BEC5",
  CEMENT: "#78909C",
  ACID: "#CDDC39",
  PLASTICS: "#00BCD4",
  ENERGY: "#FFD600",
  HYDROGEN: "#42A5F5",
  DYNAMITE: "#D32F2F",
  COIN: "#FFD700",
}

// Level required to unlock each recipe
export const RESOURCE_LEVELS: Record<string, number> = {
  MUD: 1,
  CLAY: 4,
  SAND: 5,
  COPPER: 10,
  STEEL: 15,
  SCREWS: 25,
  WATER: 0,
  SEAWATER: 16,
  ALGAE: 20,
  OXYGEN: 28,
  GAS: 35,
  FUEL: 51,
  OIL: 63,
  FIRE: 0,
  HEAT: 24,
  LAVA: 30,
  GLASS: 32,
  SULFUR: 77,
  FIBERGLASS: 95,
  CERAMICS: 57,
  STONE: 40,
  STEAM: 45,
  CEMENT: 84,
  ACID: 70,
  PLASTICS: 130,
  ENERGY: 118,
  HYDROGEN: 105,
  DYNAMITE: 130,
}

// Production recipes with correct quantities from the game image
export interface Recipe {
  output: string
  outputImage?: string
  inputs: { resource: string; quantity: number; image?: string }[]
  level: number
}

// Resource image URLs - configurable per resource
export const RESOURCE_IMAGES: Record<string, string> = {
  // Deixar vazio por defeito; o admin pode inserir URLs de imagens reais
}

export const RECIPES: Recipe[] = [
  { output: "MUD", inputs: [{ resource: "EARTH", quantity: 3 }], level: 1 },
  { output: "CLAY", inputs: [{ resource: "MUD", quantity: 10 }], level: 4 },
  { output: "SAND", inputs: [{ resource: "CLAY", quantity: 3 }], level: 5 },
  { output: "COPPER", inputs: [{ resource: "SAND", quantity: 30 }], level: 10 },
  { output: "STEEL", inputs: [{ resource: "COPPER", quantity: 5 }], level: 15 },
  { output: "SCREWS", inputs: [{ resource: "STEEL", quantity: 3 }], level: 25 },
  { output: "SEAWATER", inputs: [{ resource: "WATER", quantity: 16 }], level: 16 },
  { output: "ALGAE", inputs: [{ resource: "SEAWATER", quantity: 4 }], level: 20 },
  { output: "OXYGEN", inputs: [{ resource: "ALGAE", quantity: 3 }], level: 28 },
  { output: "GAS", inputs: [{ resource: "OXYGEN", quantity: 2 }], level: 35 },
  { output: "FUEL", inputs: [{ resource: "GAS", quantity: 3 }], level: 51 },
  { output: "OIL", inputs: [{ resource: "FUEL", quantity: 3 }], level: 63 },
  { output: "HEAT", inputs: [{ resource: "FIRE", quantity: 18 }], level: 24 },
  { output: "LAVA", inputs: [{ resource: "HEAT", quantity: 4 }], level: 30 },
  { output: "GLASS", inputs: [{ resource: "SAND", quantity: 180 }, { resource: "HEAT", quantity: 8 }], level: 32 },
  { output: "SULFUR", inputs: [{ resource: "STEEL", quantity: 8 }, { resource: "LAVA", quantity: 10 }], level: 77 },
  { output: "FIBERGLASS", inputs: [{ resource: "GLASS", quantity: 10 }, { resource: "SULFUR", quantity: 2 }], level: 95 },
  { output: "CERAMICS", inputs: [{ resource: "CLAY", quantity: 300 }, { resource: "SEAWATER", quantity: 10 }], level: 57 },
  { output: "STONE", inputs: [{ resource: "COPPER", quantity: 10 }, { resource: "ALGAE", quantity: 3 }], level: 40 },
  { output: "CEMENT", inputs: [{ resource: "CERAMICS", quantity: 3 }, { resource: "STONE", quantity: 2 }], level: 84 },
  { output: "ACID", inputs: [{ resource: "SCREWS", quantity: 2 }, { resource: "FUEL", quantity: 2 }], level: 70 },
  { output: "STEAM", inputs: [{ resource: "OXYGEN", quantity: 2 }, { resource: "LAVA", quantity: 4 }], level: 45 },
  { output: "ENERGY", inputs: [{ resource: "STEAM", quantity: 7 }, { resource: "HEAT", quantity: 2 }], level: 118 },
  { output: "HYDROGEN", inputs: [{ resource: "OIL", quantity: 2 }, { resource: "ENERGY", quantity: 2 }], level: 105 },
  { output: "PLASTICS", inputs: [{ resource: "CEMENT", quantity: 2 }, { resource: "FIBERGLASS", quantity: 3 }], level: 130 },
  { output: "DYNAMITE", inputs: [{ resource: "PLASTICS", quantity: 2 }, { resource: "FIBERGLASS", quantity: 3 }], level: 130 },
]

export function getResourceColor(symbol: string): string {
  return RESOURCE_COLORS[symbol] ?? "#666"
}

export function getResourceLevel(symbol: string): number {
  return RESOURCE_LEVELS[symbol] ?? 0
}

export function getRecipeFor(symbol: string): Recipe | undefined {
  return RECIPES.find(r => r.output === symbol)
}

/**
 * Calcula o custo de producao de um recurso com base nos precos em tempo real das pools.
 * Para cada input da receita, soma (preco_pool_input * quantidade).
 * Recursos base (sem receita) usam directamente o preco da pool.
 * Usa cache interno para evitar recalculos recursivos.
 */
export function calculateProductionCost(
  symbol: string,
  prices: Record<string, { price_usd: number }>,
  _cache?: Map<string, number>
): number {
  const cache = _cache ?? new Map<string, number>()
  if (cache.has(symbol)) return cache.get(symbol)!

  const recipe = getRecipeFor(symbol)
  if (!recipe) {
    // Recurso base (EARTH, FIRE, WATER, COIN) - custo = preco da pool
    const cost = prices[symbol]?.price_usd ?? 0
    cache.set(symbol, cost)
    return cost
  }

  let totalCost = 0
  for (const inp of recipe.inputs) {
    const inputPrice = calculateProductionCost(inp.resource, prices, cache)
    totalCost += inputPrice * inp.quantity
  }

  cache.set(symbol, totalCost)
  return totalCost
}

/**
 * Calcula todos os custos de producao para todos os recursos com receita.
 */
export function calculateAllProductionCosts(
  prices: Record<string, { price_usd: number }>
): Record<string, number> {
  const cache = new Map<string, number>()
  const result: Record<string, number> = {}

  for (const recipe of RECIPES) {
    result[recipe.output] = calculateProductionCost(recipe.output, prices, cache)
  }

  return result
}
