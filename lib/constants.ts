// API Configuration Constants
export const API_CONFIG = {
  // Timeouts
  OHLCV_FETCH_TIMEOUT: 15000,
  PRICES_FETCH_TIMEOUT: 20000,
  
  // Batch Processing
  PRICE_BATCH_SIZE: 15,
  RETRY_ATTEMPTS: 3,
  
  // Caching
  PRICES_CACHE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CUSTOMIZATION_CACHE_INTERVAL: 60 * 60 * 1000, // 1 hour
  RECIPES_CACHE_INTERVAL: 60 * 60 * 1000, // 1 hour
  CATEGORIES_CACHE_INTERVAL: 60 * 60 * 1000, // 1 hour
  
  // Rate Limiting
  LOGIN_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: 5,
  WEBHOOK_RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  WEBHOOK_RATE_LIMIT_MAX_ATTEMPTS: 10,
} as const

// Chart Configuration
export const CHART_CONFIG = {
  DEFAULT_TIMEFRAME: "1h",
  DEFAULT_CHART_TYPE: "area",
  DEFAULT_THEME: "craft",
  CANDLESTICK_WIDTH_RATIO: 0.7,
  GRID_LINES: 5,
} as const

// Price Analysis Thresholds
export const PRICE_THRESHOLDS = {
  BUY_DEFAULT: 15, // percent below cost
  SELL_DEFAULT: 20, // percent above cost
  MIN_VOLUME_USD: 100, // minimum acceptable volume
} as const

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME_PATTERN: /^[a-zA-Z0-9_-]+$/,
  USERNAME_MAX_LENGTH: 64,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 256,
  POOL_ADDRESS_PATTERN: /^0x[a-fA-F0-9]{40}$/,
  NETWORK_PATTERN: /^[a-z0-9-]+$/,
  SYMBOL_PATTERN: /^[A-Z0-9]+$/,
} as const

// Message Keys for I18n
export const MESSAGE_KEYS = {
  ERROR_INVALID_CREDENTIALS: "invalid_credentials",
  ERROR_INVALID_REQUEST: "invalid_request",
  ERROR_UNAUTHORIZED: "unauthorized",
  ERROR_INTERNAL: "internal_error",
  ERROR_RATE_LIMITED: "rate_limited",
} as const
