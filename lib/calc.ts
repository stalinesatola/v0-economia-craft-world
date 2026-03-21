/**
 * Centralized calculation logic for the Craft World Economy app.
 * This ensures consistency between the Dashboard and the Telegram Monitor.
 */

export interface OpportunitySignal {
  symbol: string
  signal: "buy" | "sell" | "neutral"
  marketPrice: number
  cost: number
  deviation: number
}

export const BUY_THRESHOLD = 15
export const SELL_THRESHOLD = 20

/**
 * Calculates the deviation and signal for a given resource.
 * 
 * @param marketPrice Current market price of the resource
 * @param cost Production cost of the resource
 * @param thresholds Thresholds for buy and sell signals (in percentage)
 * @returns Object with deviation and signal
 */
export function calculateSignal(
  marketPrice: number,
  cost: number,
  thresholds: { buy: number; sell: number } = { buy: BUY_THRESHOLD, sell: SELL_THRESHOLD }
): { deviation: number; signal: "buy" | "sell" | "neutral" } {
  if (cost <= 0 || marketPrice <= 0) {
    return { deviation: 0, signal: "neutral" }
  }

  const deviation = ((marketPrice - cost) / cost) * 100

  let signal: "buy" | "sell" | "neutral" = "neutral"
  if (deviation < -thresholds.buy) {
    signal = "buy"
  } else if (deviation > thresholds.sell) {
    signal = "sell"
  }

  return { deviation, signal }
}

/**
 * Formats a price value with appropriate decimal places.
 */
export function formatPrice(value: number): string {
  if (value === 0) return "$0.00"
  if (value >= 1) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(4)}`
  if (value >= 0.0001) return `$${value.toFixed(6)}`
  return `$${value.toFixed(8)}`
}

/**
 * Returns the CSS class for a given deviation.
 */
export function getDeviationColor(deviation: number): string {
  if (deviation < -BUY_THRESHOLD) return "text-success"
  if (deviation > SELL_THRESHOLD) return "text-destructive"
  return "text-muted-foreground"
}

/**
 * Returns a human-readable label for a given deviation.
 */
export function getDeviationLabel(deviation: number): string {
  if (deviation < -BUY_THRESHOLD) return "COMPRAR"
  if (deviation > SELL_THRESHOLD) return "VENDER"
  return "NEUTRO"
}
