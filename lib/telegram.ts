import { getConfig } from "./config-manager"

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

// Send a message via Telegram Bot API
export async function sendTelegramMessage(text: string): Promise<{ success: boolean; message: string }> {
  const config = getConfig()
  const token = config.telegram.botToken || process.env.TELEGRAM_BOT_TOKEN
  const chatId = config.telegram.chatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return { success: false, message: "Bot Token ou Chat ID nao configurados" }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    })

    const data = await res.json()

    if (!data.ok) {
      return { success: false, message: `Telegram API error: ${data.description || "Unknown error"}` }
    }

    return { success: true, message: "Mensagem enviada com sucesso" }
  } catch (error) {
    return { success: false, message: `Erro de rede: ${error instanceof Error ? error.message : "Unknown"}` }
  }
}

// Send test message
export async function sendTestMessage(): Promise<{ success: boolean; message: string }> {
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
  const text = `<b>Craft World Economy - Teste</b>\n\nMensagem de teste enviada com sucesso.\nData: ${now}`
  return sendTelegramMessage(text)
}

// Fetch prices from GeckoTerminal
async function fetchPrices(pools: Record<string, string>, network: string): Promise<Record<string, PriceResult>> {
  const poolEntries = Object.entries(pools)
  const addresses = poolEntries.map(([, addr]) => addr).filter((a) => a.startsWith("0x"))
  const results: Record<string, PriceResult> = {}

  // Single batch request (GeckoTerminal supports up to 30)
  const joined = addresses.join(",")
  const url = `${GECKO_BASE_URL}/networks/${network}/pools/multi/${joined}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(url, {
      headers: API_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    if (!res.ok) return results

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
  } catch {
    // Timeout or network error
  }

  return results
}

// Format opportunity for Telegram
function formatOpportunity(opp: Opportunity): string {
  const icon = opp.signal === "buy" ? "BUY" : "SELL"
  const arrow = opp.signal === "buy" ? "v" : "^"
  const deviation = opp.deviation > 0 ? `+${opp.deviation.toFixed(1)}%` : `${opp.deviation.toFixed(1)}%`
  return `${arrow} <b>${icon} ${opp.symbol}</b> | Mercado: $${opp.marketPrice.toFixed(8)} | Custo: $${opp.costPrice.toFixed(8)} | Desvio: ${deviation} | ${opp.priority.toUpperCase()}`
}

// Build full alert message
function buildAlertMessage(opportunities: Opportunity[]): string {
  const buyOps = opportunities.filter((o) => o.signal === "buy")
  const sellOps = opportunities.filter((o) => o.signal === "sell")
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })

  let msg = `<b>Craft World Economy - Alerta</b>\n${now}\n\n`

  if (buyOps.length > 0) {
    msg += `<b>OPORTUNIDADES DE COMPRA (${buyOps.length})</b>\n`
    msg += buyOps.map(formatOpportunity).join("\n")
    msg += "\n\n"
  }

  if (sellOps.length > 0) {
    msg += `<b>SINAIS DE VENDA (${sellOps.length})</b>\n`
    msg += sellOps.map(formatOpportunity).join("\n")
    msg += "\n"
  }

  msg += `\nTotal: ${opportunities.length} alertas`
  return msg
}

// Run the full monitor cycle
export async function runMonitorCycle(): Promise<{
  success: boolean
  message: string
  alerts: string[]
  opportunities: Opportunity[]
}> {
  const config = getConfig()
  const { pools, productionCosts, alertsConfig, thresholds, network } = config

  // Fetch current prices
  const prices = await fetchPrices(pools, network)
  const priceCount = Object.keys(prices).length

  if (priceCount === 0) {
    return {
      success: false,
      message: "Nao foi possivel obter precos da GeckoTerminal",
      alerts: [],
      opportunities: [],
    }
  }

  // Find opportunities
  const opportunities: Opportunity[] = []
  const alertMessages: string[] = []

  for (const [symbol, price] of Object.entries(prices)) {
    const cost = productionCosts[symbol]
    const alertCfg = alertsConfig[symbol]

    if (!cost || !alertCfg || !alertCfg.enabled || cost.cost_usd === 0) continue

    const deviation = ((price.price_usd - cost.cost_usd) / cost.cost_usd) * 100

    if (deviation < -thresholds.buy) {
      const opp: Opportunity = {
        symbol,
        signal: "buy",
        marketPrice: price.price_usd,
        costPrice: cost.cost_usd,
        deviation,
        priority: alertCfg.priority,
        category: alertCfg.category,
      }
      opportunities.push(opp)
      alertMessages.push(`COMPRAR ${symbol}: ${deviation.toFixed(1)}% abaixo do custo`)
    } else if (deviation > thresholds.sell) {
      const opp: Opportunity = {
        symbol,
        signal: "sell",
        marketPrice: price.price_usd,
        costPrice: cost.cost_usd,
        deviation,
        priority: alertCfg.priority,
        category: alertCfg.category,
      }
      opportunities.push(opp)
      alertMessages.push(`VENDER ${symbol}: +${deviation.toFixed(1)}% acima do custo`)
    }
  }

  // Sort by absolute deviation (strongest signals first)
  opportunities.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

  // Send Telegram message if enabled and there are opportunities
  if (config.telegram.enabled && opportunities.length > 0) {
    const msg = buildAlertMessage(opportunities)
    const result = await sendTelegramMessage(msg)
    if (!result.success) {
      return {
        success: false,
        message: `${priceCount} precos obtidos, ${opportunities.length} alertas encontrados, mas falhou a enviar Telegram: ${result.message}`,
        alerts: alertMessages,
        opportunities,
      }
    }
  }

  const summary = opportunities.length > 0
    ? `${priceCount} precos obtidos, ${opportunities.length} alertas detetados${config.telegram.enabled ? " e enviados via Telegram" : " (Telegram desativado)"}`
    : `${priceCount} precos obtidos, nenhum alerta neste momento`

  return {
    success: true,
    message: summary,
    alerts: alertMessages,
    opportunities,
  }
}
