import { getConfig, getConfigSection, setConfigSection } from "./config-manager"
import { RECIPES as DEFAULT_RECIPES } from "./resource-images"
import type { Recipe } from "./resource-images"
import { POOLS as DEFAULT_POOLS, NETWORK as DEFAULT_NETWORK } from "./craft-data"

const TELEGRAM_API = "https://api.telegram.org"
const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2"
const API_HEADERS = { Accept: "application/json;version=20230203" }

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
    const config = await getConfig()
    const history: AlertHistoryEntry[] = (config as Record<string, unknown>).alertHistory as AlertHistoryEntry[] ?? []
    const newEntry: AlertHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    return { success: false, message: "Bot Token ou Chat ID nao configurados." }
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

    return { success: true, message: "Mensagem enviada com sucesso" }
  } catch (error) {
    const errMsg = `Erro de rede: ${error instanceof Error ? error.message : "Unknown"}`
    console.error("[v0] Telegram network error:", errMsg)
    return { success: false, message: errMsg }
  }
}

// ── Send test message ──
export async function sendTestMessage(): Promise<{ success: boolean; message: string }> {
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
  const text = `<b>Craft World Economy - Teste</b>\n\nMensagem de teste enviada com sucesso.\nData: ${now}`
  const result = await sendTelegramMessage(text)

  await saveAlertHistory({
    timestamp: new Date().toISOString(),
    type: "test",
    success: result.success,
    message: result.success ? "Mensagem de teste enviada" : result.message,
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
): string {
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
  const signalEmoji = opp.signal === "buy" ? "COMPRAR" : "VENDER"
  const signalIcon = opp.signal === "buy" ? "🟢" : "🔴"
  const deviation = opp.deviation > 0 ? `+${opp.deviation.toFixed(1)}%` : `${opp.deviation.toFixed(1)}%`
  const priceChange = prices[opp.symbol]?.price_change_24h ?? 0
  const changeIcon = priceChange >= 0 ? "+" : ""
  const volume = prices[opp.symbol]?.volume_usd_24h ?? 0
  const coinPrice = prices["COIN"]?.price_usd ?? 0

  let msg = `${signalIcon} <b>${signalEmoji} ${opp.symbol}</b>\n`
  msg += `<i>${now}</i>\n\n`

  // Price info
  msg += `<b>Preco Mercado:</b> $${opp.marketPrice.toFixed(8)}\n`
  if (coinPrice > 0 && opp.symbol !== "COIN") {
    msg += `<b>Valor COIN:</b> ${(opp.marketPrice / coinPrice).toFixed(2)} COIN\n`
  }
  msg += `<b>Custo Producao:</b> $${opp.costPrice.toFixed(8)}\n`
  msg += `<b>Desvio:</b> ${deviation}\n`
  msg += `<b>Variacao 24h:</b> ${changeIcon}${priceChange.toFixed(2)}%\n`
  if (volume > 0) msg += `<b>Volume 24h:</b> $${volume.toFixed(2)}\n`
  msg += `<b>Prioridade:</b> ${opp.priority.toUpperCase()}\n`

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

// Legacy bulk message (kept for /alertas command)
function buildAlertMessage(opportunities: Opportunity[], customMessage?: string, coinPrice?: number): string {
  const buyOps = opportunities.filter((o) => o.signal === "buy")
  const sellOps = opportunities.filter((o) => o.signal === "sell")
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })

  let msg = `<b>Craft World Economy - Alerta</b>\n${now}\n\n`
  if (customMessage) msg += `${customMessage}\n\n`

  if (buyOps.length > 0) {
    msg += `<b>OPORTUNIDADES DE COMPRA (${buyOps.length})</b>\n`
    for (const opp of buyOps) {
      const dev = opp.deviation > 0 ? `+${opp.deviation.toFixed(1)}%` : `${opp.deviation.toFixed(1)}%`
      const coinStr = coinPrice && coinPrice > 0 && opp.symbol !== "COIN" ? ` | ${(opp.marketPrice / coinPrice).toFixed(2)} COIN` : ""
      msg += `🟢 <b>${opp.symbol}</b> | $${opp.marketPrice.toFixed(8)}${coinStr} | Custo: $${opp.costPrice.toFixed(8)} | ${dev}\n`
    }
    msg += "\n"
  }
  if (sellOps.length > 0) {
    msg += `<b>SINAIS DE VENDA (${sellOps.length})</b>\n`
    for (const opp of sellOps) {
      const dev = `+${opp.deviation.toFixed(1)}%`
      const coinStr = coinPrice && coinPrice > 0 && opp.symbol !== "COIN" ? ` | ${(opp.marketPrice / coinPrice).toFixed(2)} COIN` : ""
      msg += `🔴 <b>${opp.symbol}</b> | $${opp.marketPrice.toFixed(8)}${coinStr} | Custo: $${opp.costPrice.toFixed(8)} | ${dev}\n`
    }
  }
  msg += `\nTotal: ${opportunities.length} alertas`
  return msg
}

function buildPriceAlertMessage(symbol: string, price: PriceResult, customMessage?: string, coinPrice?: number): string {
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
  const changeIcon = price.price_change_24h >= 0 ? "+" : ""

  let msg = `<b>Craft World Economy - Preco ${symbol}</b>\n${now}\n\n`
  if (customMessage) msg += `${customMessage}\n\n`

  msg += `<b>Preco:</b> $${price.price_usd.toFixed(8)}\n`
  if (coinPrice && coinPrice > 0 && symbol !== "COIN") {
    msg += `<b>Valor COIN:</b> ${(price.price_usd / coinPrice).toFixed(2)} COIN\n`
  }
  msg += `<b>Variacao 24h:</b> ${changeIcon}${price.price_change_24h.toFixed(2)}%\n`
  msg += `<b>Volume 24h:</b> $${price.volume_usd_24h.toFixed(2)}\n`

  return msg
}

// Build a summary of all prices
function buildAllPricesMessage(prices: Record<string, PriceResult>, costs: Record<string, number>): string {
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
  const coinPrice = prices["COIN"]?.price_usd ?? 0
  let msg = `<b>Craft World Economy - Precos</b>\n${now}\n\n`

  const sorted = Object.entries(prices).sort((a, b) => a[0].localeCompare(b[0]))
  for (const [symbol, p] of sorted) {
    const cost = costs[symbol] ?? 0
    const changeIcon = p.price_change_24h >= 0 ? "+" : ""
    const deviation = cost > 0 ? ((p.price_usd - cost) / cost * 100) : 0
    const devStr = cost > 0 ? ` | Desvio: ${deviation > 0 ? "+" : ""}${deviation.toFixed(1)}%` : ""
    const coinStr = coinPrice > 0 && symbol !== "COIN" ? ` | ${(p.price_usd / coinPrice).toFixed(2)} COIN` : ""
    msg += `<b>${symbol}</b>: $${p.price_usd.toFixed(8)}${coinStr} (${changeIcon}${p.price_change_24h.toFixed(1)}%)${devStr}\n`
  }

  msg += `\nTotal: ${sorted.length} recursos`
  return msg
}

// ── Bot Commands Handler ──
export async function handleBotCommand(command: string, chatId: string, botToken: string): Promise<string> {
  const cmd = command.toLowerCase().trim()

  try {
    const config = await getConfig()
    const pools = (config.pools && Object.keys(config.pools).length > 0) ? config.pools : DEFAULT_POOLS
    // Always ensure COIN pool is present for value conversion
    if (!pools["COIN"] && DEFAULT_POOLS["COIN"]) {
      pools["COIN"] = DEFAULT_POOLS["COIN"]
    }
    const network = config.network || DEFAULT_NETWORK

    if (cmd === "/start" || cmd === "/help") {
      return `<b>Craft World Economy Bot</b>\n\n` +
        `<b>Comandos disponiveis:</b>\n` +
        `/precos - Ver todos os precos actuais\n` +
        `/preco [SIMBOLO] - Ver preco de um recurso (ex: /preco DYNO)\n` +
        `/alertas - Ver oportunidades de compra/venda\n` +
        `/status - Ver estado do bot\n` +
        `/historico - Ultimos 5 alertas enviados\n` +
        `/help - Mostrar esta ajuda`
    }

    if (cmd === "/status") {
      const tg = config.telegram
      const poolCount = Object.keys(pools).length
      const priceAlert = tg?.priceAlertEnabled ? `Ativo (${tg.priceAlertSymbol || "N/A"})` : "Desativado"
      return `<b>Estado do Bot</b>\n\n` +
        `<b>Bot:</b> ${tg?.enabled ? "Ativo" : "Desativado"}\n` +
        `<b>Pools:</b> ${poolCount} cadastradas\n` +
        `<b>Intervalo:</b> ${tg?.intervalMinutes || 5} min\n` +
        `<b>Alerta Preco:</b> ${priceAlert}\n` +
        `<b>Thresholds:</b> Compra -${config.thresholds?.buy || 15}% / Venda +${config.thresholds?.sell || 15}%`
    }

    if (cmd === "/precos") {
      const prices = await fetchPrices(pools, network)
      if (Object.keys(prices).length === 0) {
        return "Nao foi possivel obter precos. Verifique se ha pools cadastradas."
      }
      const recipes = await loadRecipes()
      const costs = calcCostsFromRecipes(recipes, prices)
      return buildAllPricesMessage(prices, costs)
    }

    if (cmd.startsWith("/preco ")) {
      const symbol = cmd.replace("/preco ", "").trim().toUpperCase()
      if (!pools[symbol]) {
        return `Recurso <b>${symbol}</b> nao encontrado nas pools cadastradas.\n\nPools disponiveis: ${Object.keys(pools).join(", ") || "nenhuma"}`
      }
      const prices = await fetchPrices(pools, network)
      if (!prices[symbol]) {
        return `Nao foi possivel obter preco para <b>${symbol}</b>.`
      }
      return buildPriceAlertMessage(symbol, prices[symbol], undefined, prices["COIN"]?.price_usd ?? 0)
    }

    if (cmd === "/alertas") {
      const prices = await fetchPrices(pools, network)
      if (Object.keys(prices).length === 0) {
        return "Nao foi possivel obter precos."
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

        const deviation = ((price.price_usd - costValue) / costValue) * 100
        if (deviation < -thresholds.buy) {
          opportunities.push({ symbol, signal: "buy", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
        } else if (deviation > thresholds.sell) {
          opportunities.push({ symbol, signal: "sell", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
        }
      }

      if (opportunities.length === 0) {
        return "Sem oportunidades de compra/venda neste momento."
      }
      return buildAlertMessage(opportunities, undefined, prices["COIN"]?.price_usd ?? 0)
    }

    if (cmd === "/historico") {
      const history = await getAlertHistory()
      if (history.length === 0) {
        return "Sem historico de alertas."
      }
      const last5 = history.slice(0, 5)
      let msg = `<b>Ultimos ${last5.length} Alertas</b>\n\n`
      for (const entry of last5) {
        const icon = entry.success ? "OK" : "ERRO"
        const date = new Date(entry.timestamp).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
        msg += `[${icon}] <b>${entry.type.toUpperCase()}</b> - ${date}\n${entry.message}\n\n`
      }
      return msg
    }

    return `Comando desconhecido: ${cmd}\n\nUse /help para ver os comandos disponiveis.`
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
  // Always ensure COIN pool is present for value conversion
  if (!pools["COIN"] && DEFAULT_POOLS["COIN"]) {
    pools["COIN"] = DEFAULT_POOLS["COIN"]
  }
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
    console.log("[v0] Telegram desactivado - skipping")
    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "error",
      success: false,
      message: "Monitor executado mas Telegram desactivado",
    })
    return { success: true, message: "Telegram desactivado", alerts: [], opportunities: [] }
  }

  if (!telegramCfg.botToken || !telegramCfg.chatId) {
    console.log("[v0] Bot Token ou Chat ID nao configurados")
    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "error",
      success: false,
      message: "Bot Token ou Chat ID nao configurados",
    })
    return { success: false, message: "Bot Token ou Chat ID nao configurados", alerts: [], opportunities: [] }
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
      message: "Nao foi possivel obter precos da GeckoTerminal (0 precos retornados)",
      details: `Pools: ${Object.keys(pools).join(", ")}`,
    })
    return { success: false, message: "Nao foi possivel obter precos", alerts: [], opportunities: [] }
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

    const deviation = ((price.price_usd - costValue) / costValue) * 100
    console.log(`[v0] ${symbol}: preco=$${price.price_usd.toFixed(8)}, custo=$${costValue.toFixed(8)}, desvio=${deviation.toFixed(1)}%, thresholds: buy=-${thresholds.buy}%, sell=+${thresholds.sell}%`)

    if (deviation < -thresholds.buy) {
      opportunities.push({ symbol, signal: "buy", marketPrice: price.price_usd, costPrice: costValue, deviation, priority: alertCfg.priority, category: alertCfg.category })
      alertMessages.push(`COMPRAR ${symbol}: ${deviation.toFixed(1)}% abaixo do custo`)
    } else if (deviation > thresholds.sell) {
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
      const cardMsg = buildCardMessage(opp, recipes, prices)
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
      message: `${sentCount}/${opportunities.length} cards enviados individualmente: ${opportunities.map(o => `${o.signal.toUpperCase()} ${o.symbol}`).join(", ")}`,
      details: opportunities.map(o => `${o.signal} ${o.symbol} ${o.deviation.toFixed(1)}%`).join(", "),
    })
  }

  // Price alert as separate card
  if (priceAlertEnabled && prices[priceSymbol]) {
    console.log(`[v0] Sending price alert card for ${priceSymbol}...`)
    // Add delay after opportunity cards
    if (hasOpportunities) await new Promise(resolve => setTimeout(resolve, 300))

    const priceMsg = buildPriceAlertMessage(priceSymbol, prices[priceSymbol], telegramCfg.customAlertMessage, prices["COIN"]?.price_usd ?? 0)
    const priceResult = await sendTelegramMessage(priceMsg, telegramCfg.botToken, telegramCfg.chatId)
    priceAlertSent = priceResult.success
    console.log("[v0] Price alert result:", priceResult.success, priceResult.message)

    await saveAlertHistory({
      timestamp: new Date().toISOString(),
      type: "price",
      success: priceResult.success,
      message: priceResult.success
        ? `Preco ${priceSymbol}: $${prices[priceSymbol].price_usd.toFixed(8)} (${prices[priceSymbol].price_change_24h >= 0 ? "+" : ""}${prices[priceSymbol].price_change_24h.toFixed(2)}%)`
        : `Falha ao enviar preco ${priceSymbol}: ${priceResult.message}`,
    })
  } else if (!hasOpportunities) {
    console.log("[v0] No opportunities and no price alert configured/available")

    if (telegramCfg.priceAlertEnabled && priceSymbol && !prices[priceSymbol]) {
      console.log(`[v0] Price for ${priceSymbol} not found. Available: ${Object.keys(prices).join(", ")}`)
      await saveAlertHistory({
        timestamp: new Date().toISOString(),
        type: "error",
        success: false,
        message: `Preco ${priceSymbol} nao encontrado nas pools. Disponiveis: ${Object.keys(prices).join(", ")}`,
      })
    }
  }

  const parts: string[] = []
  parts.push(`${priceCount} precos obtidos`)
  if (opportunities.length > 0) {
    parts.push(`${opportunities.length} alertas${telegramSent ? " enviados" : ""}`)
  } else {
    parts.push("sem alertas")
  }
  if (priceAlertSent && priceSymbol) {
    parts.push(`preco ${priceSymbol} enviado`)
  }

  console.log("[v0] Monitor cycle complete:", parts.join(", "))

  return { success: true, message: parts.join(", "), alerts: alertMessages, opportunities, priceAlertSent }
}
