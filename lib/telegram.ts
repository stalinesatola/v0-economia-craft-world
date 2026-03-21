import { getConfig, getConfigSection, setConfigSection } from "./config-manager"
import { RECIPES as DEFAULT_RECIPES } from "./resource-images"
import type { Recipe } from "./resource-images"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "./craft-data"
import { randomUUID } from "node:crypto"
import { calculateSignal, formatPrice } from "./calc"

const TELEGRAM_API = "https://api.telegram.org"
const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }
const DYNO_COIN_POOL_ADDRESS = "0x8d896c96ffcafbf12d86dd4510236de7bcfa7dcf"

// Find DYNO COIN price from prices map (symbol can be "COIN", "DYNO COIN", etc.)
function getDynoCoinPrice(prices: Record<string, PriceResult>, pools: Record<string, string>): number {
  for (const [symbol, addr] of Object.entries(pools)) {
    if (addr.toLowerCase() === DYNO_COIN_POOL_ADDRESS && prices[symbol]) {
      return prices[symbol].price_usd
    }
  }
  return 0
}

interface PriceResult {
  price_usd: number
  volume_usd_24h: number
  price_change_24h: number
}

interface Opportunity {
  symbol: string
  signal: "buy" | "sell"
  marketPrice: number
  costPrice: number
  deviation: number
  priority: string
  category: string
}

export interface AlertHistoryEntry {
  id: string
  timestamp: string
  type: "opportunity" | "price" | "test" | "command" | "error"
  success: boolean
  message: string
  details?: string
}

// ── Load recipes from DB (same source as frontend) ──
async function loadRecipes(): Promise<Recipe[]> {
  try {
    const dbRecipes = await getConfigSection("recipes")
    if (dbRecipes && Array.isArray(dbRecipes) && dbRecipes.length > 0) {
      return dbRecipes as Recipe[]
    }
  } catch { /* fallback */ }
  return DEFAULT_RECIPES
}

// Calculate costs using DB recipes + real pool prices
function calcCostsFromRecipes(
  recipes: Recipe[],
  prices: Record<string, PriceResult>
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const recipe of recipes) {
    let totalCost = 0
    for (const inp of recipe.inputs) {
      const inputPrice = prices[inp.resource]?.price_usd ?? 0
      totalCost += inputPrice * inp.quantity
    }
    result[recipe.output] = totalCost
  }
  return result
}

// ── Alert History ──
async function saveAlertHistory(entry: Omit<AlertHistoryEntry, "id">) {
  try {
    const historyRaw = await getConfigSection("alertHistory")
    const history: AlertHistoryEntry[] = Array.isArray(historyRaw) ? historyRaw as AlertHistoryEntry[] : []
    const newEntry: AlertHistoryEntry = {
      ...entry,
      id: randomUUID(), // Use cryptographically secure UUID
    }
    // Keep last 100 entries
    const updated = [newEntry, ...history].slice(0, 100)
    await setConfigSection("alertHistory", updated)
  } catch (e) {
    console.error("[v0] Error saving alert history:", e)
  }
}

export async function getAlertHistory(): Promise<AlertHistoryEntry[]> {
  try {
    const config = await getConfig()
    return (config as Record<string, unknown>).alertHistory as AlertHistoryEntry[] ?? []
  } catch {
    return []
  }
}

// ── Send message via Telegram Bot API ──
export async function sendTelegramMessage(text: string, botToken?: string, chatId?: string): Promise<{ success: boolean; message: string }> {
  let token = botToken
  let chat = chatId

  if (!token || !chat) {
    try {
      const config = await getConfig()
      token = token || config.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || ""
      chat = chat || config.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || ""
    } catch {
      token = token || process.env.TELEGRAM_BOT_TOKEN || ""
      chat = chat || process.env.TELEGRAM_CHAT_ID || ""
    }
  }

  if (!token || !chat) {
    return { success: false, message: "Bot Token or Chat ID not configured." }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json()

    if (!data.ok) {
      const errMsg = `Telegram API error: ${data.description || "Unknown"} (code: ${data.error_code || "?"})`
      console.error("[v0] Telegram send failed:", errMsg, "chat_id:", chat)
      return { success: false, message: errMsg }
    }

    return { success: true, message: "Message sent successfully" }
  } catch (error) {
    const errMsg = `Network error: ${error instanceof Error ? error.message : "Unknown"}`
    console.error("[v0] Telegram network error:", errMsg)
    return { success: false, message: errMsg }
  }
}

// ── Send test message ──
export async function sendTestMessage(): Promise<{ success: boolean; message: string }> {
  const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" })
  const text = `<b>Craft World Economy - Test</b>\n\nTest message sent successfully.\nDate: ${now}`
  const result = await sendTelegramMessage(text)

  await saveAlertHistory({
    timestamp: new Date().toISOString(),
    type: "test",
    success: result.success,
    message: result.success ? "Test message sent" : result.message,
  })

  return result
}

// ── Fetch prices from GeckoTerminal ──
async function fetchPrices(pools: Record<string, string>, network: string): Promise<Record<string, PriceResult>> {
  const poolEntries = Object.entries(pools)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))
  const results: Record<string, PriceResult> = {}

  if (addresses.length === 0) return results

  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${network}/pools/multi/${joined}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: API_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error("[v0] GeckoTerminal API error:", res.status, res.statusText)
      return results
    }

    const data = await res.json()
    const addrToSymbol: Record<string, string> = {}
    for (const [symbol, addr] of poolEntries) {
      addrToSymbol[addr.toLowerCase()] = symbol
    }

    for (const item of data.data ?? []) {
      const poolAddr = item.attributes?.address?.toLowerCase()
      if (!poolAddr) continue
      const symbol = addrToSymbol[poolAddr]
      if (!symbol) continue
      results[symbol] = {
        price_usd: parseFloat(item.attributes?.base_token_price_usd || "0"),
        volume_usd_24h: parseFloat(item.attributes?.volume_usd?.h24 || "0"),
        price_change_24h: parseFloat(item.attributes?.price_change_percentage?.h24 || "0"),
      }
    }
  } catch (e) {
    console.error("[v0] GeckoTerminal fetch error:", e instanceof Error ? e.message : e)
  }

  return results
}

// Build individual card message for a single opportunity with input details
function buildCardMessage(
  opp: Opportunity,
  recipes: Recipe[],
  prices: Record<string, PriceResult>,
  pools: Record<string, string>,
): string {
  const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" })
  const signalEmoji = opp.signal === "buy" ? "BUY" : "SELL"
  const signalIcon = opp.signal === "buy" ? "🟢" : "🔴"
  const deviation = opp.deviation > 0 ? `+${opp.deviation.toFixed(1)}%` : `${opp.deviation.toFixed(1)}%`
  const priceChange = prices[opp.symbol]?.price_change_24h ?? 0
  const changeIcon = priceChange >= 0 ? "+" : ""
  const volume = prices[opp.symbol]?.volume_usd_24h ?? 0
  const coinPrice = getDynoCoinPrice(prices, pools)

  let msg = `${signalIcon} <b>${signalEmoji} ${opp.symbol}</b>\n`
  msg += `<i>${now}</i>\n\n`

  // Price info
  msg += `<b>Market Price:</b> ${formatPrice(opp.marketPrice)}\n`
  if (coinPrice > 0 && opp.symbol !== "DYNO COIN") {
    msg += `<b>DYNO Value:</b> ${(opp.marketPrice / coinPrice).toFixed(2)} DYNO\n`
  }
  msg += `<b>Production Cost:</b> ${formatPrice(opp.costPrice)}\n`
  msg += `<b>Deviation:</b> ${deviation}\n`
  msg += `<b>24h Change:</b> ${changeIcon}${priceChange.toFixed(2)}%\n`
  if (volume > 0) msg += `<b>24h Volume:</b> $${volume.toFixed(2)}\n`
  msg += `<b>Priority:</b> ${opp.priority.toUpperCase()}\n`

  // Input details (recipe)
  const recipe = recipes.find(r => r.output === opp.symbol)
  if (recipe && recipe.inputs.length > 0) {
    msg += `\n<b>--- Inputs ---</b>\n`
    for (const inp of recipe.inputs) {
      const inputPrice = prices[inp.resource]?.price_usd ?? 0
      const subtotal = inputPrice * inp.quantity
      msg += `  ${inp.quantity}x ${inp.resource}: $${inputPrice.toFixed(8)} = $${subtotal.toFixed(8)}\n`
    }
  }

  msg += `\n<i>Craft World - Economy</i>`
  return msg
}

// Legacy bulk message (kept for /alerts command)
function buildAlertMessage(opportunities: Opportunity[], customMessage?: string, dynoCoinPrice?: number): string {
  const buyOps = opportunities.filter((o) => o.signal === "buy")
  const sellOps = opportunities.filter((o) => o.signal === "sell")
  const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" })

  let msg = `<b>Craft World Economy - Alert</b>\n${now}\n\n`
  if (customMessage) msg += `${customMessage}\n\n`

  if (buyOps.length > 0) {
    msg += `<b>BUY OPPORTUNITIES (${buyOps.length})</b>\n`
    for (const opp of buyOps) {
      const dev = opp.deviation > 0 ? `+${opp.deviation.toFixed(1)}%` : `${opp.deviation.toFixed(1)}%`
      const coinStr = dynoCoinPrice && dynoCoinPrice > 0 && opp.symbol !== "DYNO COIN" ? ` | ${(opp.marketPrice / dynoCoinPrice).toFixed(2)} DYNO` : ""
      msg += `🟢 <b>${opp.symbol}</b> | ${formatPrice(opp.marketPrice)}${coinStr} | Cost: ${formatPrice(opp.costPrice)} | ${dev}\n`
    }
    msg += "\n"
  }
  if (sellOps.length > 0) {
    msg += `<b>SELL SIGNALS (${sellOps.length})</b>\n`
    for (const opp of sellOps) {
      const dev = `+${opp.deviation.toFixed(1)}%`
      const coinStr = dynoCoinPrice && dynoCoinPrice > 0 && opp.symbol !== "DYNO COIN" ? ` | ${(opp.marketPrice / dynoCoinPrice).toFixed(2)} DYNO` : ""
      msg += `🔴 <b>${opp.symbol}</b> | ${formatPrice(opp.marketPrice)}${coinStr} | Cost: ${formatPrice(opp.costPrice)} | ${dev}\n`
    }
  }
  msg += `\nTotal: ${opportunities.length} alerts`
  return msg
}

function buildPriceAlertMessage(symbol: string, price: PriceResult, customMessage?: string, dynoCoinPrice?: number): string {
  const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" })
  const changeIcon = price.price_change_24h >= 0 ? "+" : ""

  let msg = `<b>Craft World Economy - Price ${symbol}</b>\n${now}\n\n`
  if (customMessage) msg += `${customMessage}\n\n`

  msg += `<b>Price:</b> ${formatPrice(price.price_usd)}\n`
  if (dynoCoinPrice && dynoCoinPrice > 0 && symbol !== "DYNO COIN") {
    msg += `<b>DYNO Value:</b> ${(price.price_usd / dynoCoinPrice).toFixed(2)} DYNO\n`
  }
  msg += `<b>24h Change:</b> ${changeIcon}${price.price_change_24h.toFixed(2)}%\n`
  msg += `<b>24h Volume:</b> $${price.volume_usd_24h.toFixed(2)}\n`

  return msg
}

// Build a summary of all prices
function buildAllPricesMessage(prices: Record<string, PriceResult>, costs: Record<string, number>, pools: Record<string, string>): string {
  const now = new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" })
  const coinPrice = getDynoCoinPrice(prices, pools)
  let msg = `<b>Craft World Economy - Prices</b>\n${now}\n\n`

  const sorted = Object.entries(prices).sort((a, b) => a[0].localeCompare(b[0]))
  for (const [symbol, p] of sorted) {
    const cost = costs[symbol] ?? 0
    const changeIcon = p.price_change_24h >= 0 ? "+" : ""
    const { deviation } = calculateSignal(p.price_usd, cost)
    const devStr = cost > 0 ? ` | Dev: ${deviation > 0 ? "+" : ""}${deviation.toFixed(1)}%` : ""
    const coinStr = coinPrice > 0 && symbol !== "DYNO COIN" ? ` | ${(p.price_usd / coinPrice).toFixed(2)} DYNO` : ""
    msg += `<b>${symbol}</b>: ${formatPrice(p.price_usd)}${coinStr} (${changeIcon}${p.price_change_24h.toFixed(1)}%)${devStr}\n`
  }

  msg += `\nTotal: ${sorted.length} resources`
  return msg
}

// ── Bot Commands Handler ──
export async function handleBotCommand(command: string, chatId: string, botToken: string): Promise<string> {
  const cmd = command.toLowerCase().trim()

  try {
    const config = await getConfig()
    const pools = (config.pools && Object.keys(config.pools).length > 0) ? config.pools : DEFAULT_POOLS
    const network = config.network || DEFAULT_NETWORK

    if (cmd === "/start" || cmd === "/help") {
      return `<b>Craft World Economy Bot</b>\n\n` +
        `<b>Available commands:</b>\n` +
        `/prices - View all current prices\n` +
        `/price [SYMBOL] - View price of a resource (ex: /price DYNO)\n` +
        `/alerts - View buy/sell opportunities\n` +
        `/status - View bot status\n` +
        `/history - Last 5 alerts sent\n` +
        `/help - Show this help`
    }

    if (cmd === "/status") {
      const tg = config.telegram
      const poolCount = Object.keys(pools).length
      const priceAlert = tg?.priceAlertEnabled ? `Active (${tg.priceAlertSymbol || "N/A"})` : "Disabled"
      return `<b>Bot Status</b>\n\n` +
        `<b>Bot:</b> ${tg?.enabled ? "Active" : "Disabled"}\n` +
        `<b>Pools:</b> ${poolCount} registered\n` +
        `<b>Interval:</b> ${tg?.intervalMinutes || 5} min\n` +
        `<b>Price Alert:</b> ${priceAlert}\n` +
        `<b>Thresholds:</b> Buy -${config.thresholds?.buy || 15}% / Sell +${config.thresholds?.sell || 15}%`
    }

    if (cmd === "/prices") {
      const prices = await fetchPrices(pools, network)
      if (Object.keys(prices).length === 0) {
        return "Could not get prices. Check if pools are registered."
      }
      const recipes = await loadRecipes()
      const costs = calcCostsFromRecipes(recipes, prices)
      return buildAllPricesMessage(prices, costs, pools)
    }

    if (cmd.startsWith("/price ")) {
      const symbol = cmd.replace("/price ", "").trim().toUpperCase()
      if (!pools[symbol]) {
        return `Resource <b>${symbol}</b> not found in registered pools.\n\nAvailable pools: ${Object.keys(pools).join(", ") || "none"}`
      }
      const prices = await fetchPrices(pools, network)
      if (!prices[symbol]) {
        return `Could not get price for <b>${symbol}</b>.`
      }
      return buildPriceAlertMessage(symbol, prices[symbol], undefined, getDynoCoinPrice(prices, pools))
    }

    if (cmd === "/alerts") {
      const prices = await fetchPrices(pools, network)
      if (Object.keys(prices).length === 0) {
        return "Could not get prices."
      }
      const recipes = await loadRecipes()
      const costs = calcCostsFromRecipes(recipes, prices)
      const alertsConfig = config.alertsConfig || {}
      const thresholds = config.thresholds || { buy: 15, sell: 15 }
      const opportunities: Opportunity[] = []

      for (const [symbol, price] of Object.entries(prices)) {
        const costValue = costs[symbol] ?? 0
        const alertCfg = alertsConfig[symbol]
        if (!alertCfg?.enabled) continue

        const hasRecipe = recipes.some(r => r.output === symbol)
        if (!hasRecipe) continue
        if (costValue === 0) continue

        const { deviation, signal } = calculateSignal(price.price_usd, costValue, thresholds)
        if (signal === "buy") {
          opportunities.push({ symbol, signal: "buy", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
        } else if (signal === "sell") {
          opportunities.push({ symbol, signal: "sell", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
        }
      }

      if (opportunities.length === 0) {
        return "No buy/sell opportunities at this time."
      }
      return buildAlertMessage(opportunities, undefined, getDynoCoinPrice(prices, pools))
    }

    if (cmd === "/history") {
      const history = await getAlertHistory()
      if (history.length === 0) {
        return "No alert history."
      }
      const last5 = history.slice(0, 5)
      let msg = `<b>Last ${last5.length} Alerts</b>\n\n`
      for (const entry of last5) {
        const icon = entry.success ? "OK" : "ERROR"
        const date = new Date(entry.timestamp).toLocaleString("en-US", { timeZone: "Europe/Lisbon" })
        msg += `[${icon}] <b>${entry.type.toUpperCase()}</b> - ${date}\n${entry.message}\n\n`
      }
      return msg
    }

    return `Unknown command: ${cmd}\n\nUse /help to see available commands.`
  } catch (e) {
    console.error("[v0] Bot command error:", e)
    return `Erro ao processar comando: ${e instanceof Error ? e.message : "Unknown"}`
  }
}

// ── Run the full monitor cycle ──
export async function runMonitorCycle(): Promise<{
  success: boolean
  message: string
  alerts: string[]
  opportunities: Opportunity[]
  priceAlertSent?: boolean
}> {
  console.log("[v0] Monitor cycle starting...")
  const config = await getConfig()
  const pools = (config.pools && Object.keys(config.pools).length > 0) ? config.pools : DEFAULT_POOLS
  const alertsConfig = config.alertsConfig || {}
  const thresholds = config.thresholds || { buy: 15, sell: 15 }
  const network = config.network || DEFAULT_NETWORK
  const telegramCfg = config.telegram

  console.log("[v0] Telegram config:", JSON.stringify({
    enabled: telegramCfg?.enabled,
    hasToken: !!telegramCfg?.botToken,
    hasChatId: !!telegramCfg?.chatId,
    chatId: telegramCfg?.chatId,
    priceAlertEnabled: telegramCfg?.priceAlertEnabled,
    priceAlertSymbol: telegramCfg?.priceAlertSymbol,
    poolCount: Object.keys(pools).length,
  }))

  if (!telegramCfg?.enabled) {
    console.log("[v0] Telegram disabled - skipping")
    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "error",
      success: false,
      message: "Monitor executed but Telegram disabled",
    })
    return { success: true, message: "Telegram disabled", alerts: [], opportunities: [] }
  }

  if (!telegramCfg.botToken || !telegramCfg.chatId) {
    console.log("[v0] Bot Token or Chat ID not configured")
    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "error",
      success: false,
      message: "Bot Token or Chat ID not configured",
    })
    return { success: false, message: "Bot Token or Chat ID not configured", alerts: [], opportunities: [] }
  }

  console.log("[v0] Fetching prices for", Object.keys(pools).length, "pools on network:", network)
  const prices = await fetchPrices(pools, network)
  const priceCount = Object.keys(prices).length
  console.log("[v0] Got", priceCount, "prices:", Object.keys(prices).join(", "))

  if (priceCount === 0) {
    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "error",
      success: false,
      message: "Could not get prices from GeckoTerminal (0 prices returned)",
      details: `Pools: ${Object.keys(pools).join(", ")}`,
    })
    return { success: false, message: "Could not get prices", alerts: [], opportunities: [] }
  }

  // Load recipes from DB (same source as frontend/API)
  const recipes = await loadRecipes()
  console.log("[v0] Loaded", recipes.length, "recipes (source:", recipes === DEFAULT_RECIPES ? "hardcoded" : "DB", ")")

  const calculatedCosts = calcCostsFromRecipes(recipes, prices)
  console.log("[v0] Calculated costs:", JSON.stringify(calculatedCosts))

  const opportunities: Opportunity[] = []
  const alertMessages: string[] = []

  for (const [symbol, price] of Object.entries(prices)) {
    const costValue = calculatedCosts[symbol] ?? 0
    const alertCfg = alertsConfig[symbol]

    if (!alertCfg?.enabled) {
      continue
    }

    // Only check deviation for resources that have a recipe (non-zero cost)
    const hasRecipe = recipes.some(r => r.output === symbol)
    if (!hasRecipe) continue
    if (costValue === 0) continue

    const { deviation, signal } = calculateSignal(price.price_usd, costValue, thresholds)
    console.log(`[v0] ${symbol}: preco=$${price.price_usd.toFixed(8)}, custo=$${costValue.toFixed(8)}, desvio=${deviation.toFixed(1)}%, thresholds: buy=-${thresholds.buy}%, sell=+${thresholds.sell}%`)

    if (signal === "buy") {
      opportunities.push({ symbol, signal: "buy", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
      alertMessages.push(`COMPRAR ${symbol}: ${deviation.toFixed(1)}% abaixo do custo`)
    } else if (signal === "sell") {
      opportunities.push({ symbol, signal: "sell", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
      alertMessages.push(`VENDER ${symbol}: +${deviation.toFixed(1)}% acima do custo`)
    }
  }

  opportunities.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

  let telegramSent = false
  let priceAlertSent = false

  // === SEND INDIVIDUAL CARDS ===
  const priceSymbol = telegramCfg.priceAlertSymbol
  const priceAlertEnabled = telegramCfg.priceAlertEnabled && priceSymbol && prices[priceSymbol]
  const hasOpportunities = opportunities.length > 0

  if (hasOpportunities) {
    console.log("[v0] Sending", opportunities.length, "individual card alerts...")
    let sentCount = 0
    let failCount = 0

    for (const opp of opportunities) {
      const cardMsg = buildCardMessage(opp, recipes, prices, pools)
      const result = await sendTelegramMessage(cardMsg, telegramCfg.botToken, telegramCfg.chatId)

      if (result.success) {
        sentCount++
      } else {
        failCount++
        console.error(`[v0] Failed to send card for ${opp.symbol}:`, result.message)
      }

      // Delay 300ms between messages to respect Telegram rate limits (30 msg/sec)
      if (opportunities.indexOf(opp) < opportunities.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    telegramSent = sentCount > 0
    console.log(`[v0] Cards sent: ${sentCount} success, ${failCount} failed`)

    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "opportunity",
      success: sentCount > 0,
      message: `${sentCount}/${opportunities.length} cards sent individually: ${opportunities.map(o => `${o.signal.toUpperCase()} ${o.symbol}`).join(", ")}`,
      details: opportunities.map(o => `${o.signal} ${o.symbol} ${o.deviation.toFixed(1)}%`).join(", "),
    })
  }

  // Price alert as separate card
  if (priceAlertEnabled && prices[priceSymbol]) {
    console.log(`[v0] Sending price alert card for ${priceSymbol}...`)
    // Add delay after opportunity cards
    if (hasOpportunities) await new Promise(resolve => setTimeout(resolve, 300))

    const priceMsg = buildPriceAlertMessage(priceSymbol, prices[priceSymbol], telegramCfg.customAlertMessage, getDynoCoinPrice(prices, pools))
    const priceResult = await sendTelegramMessage(priceMsg, telegramCfg.botToken, telegramCfg.chatId)
    priceAlertSent = priceResult.success
    console.log("[v0] Price alert result:", priceResult.success, priceResult.message)

    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "price",
      success: priceResult.success,
      message: priceResult.success
        ? `Price ${priceSymbol}: $${prices[priceSymbol].price_usd.toFixed(8)} (${prices[priceSymbol].price_change_24h >= 0 ? "+" : ""}${prices[priceSymbol].price_change_24h.toFixed(2)}%)`
        : `Failed to send price ${priceSymbol}: ${priceResult.message}`,
    })
  } else if (!hasOpportunities) {
    console.log("[v0] No opportunities and no price alert configured/available")

    if (telegramCfg.priceAlertEnabled && priceSymbol && !prices[priceSymbol]) {
      console.log(`[v0] Price for ${priceSymbol} not found. Available: ${Object.keys(prices).join(", ")}`)
      await saveAlertHistory({
        timestamp: new Date().toISOString(),
        type: "error",
        success: false,
        message: `Price ${priceSymbol} not found in pools. Available: ${Object.keys(prices).join(", ")}`,
      })
    }
  }

  const parts: string[] = []
  parts.push(`${priceCount} prices fetched`)
  if (opportunities.length > 0) {
    parts.push(`${opportunities.length} alerts${telegramSent ? " sent" : ""}`)
  } else {
    parts.push("no alerts")
  }
  if (priceAlertSent && priceSymbol) {
    parts.push(`price ${priceSymbol} sent`)
  }

  console.log("[v0] Monitor cycle complete:", parts.join(", "))

  return { success: true, message: parts.join(", "), alerts: alertMessages, opportunities, priceAlertSent }
}
