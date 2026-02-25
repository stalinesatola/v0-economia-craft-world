"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type Locale = "pt" | "en"

const translations = {
  pt: {
    // Dashboard
    "app.title": "Craft World Economy",
    "app.subtitle": "Monitor de Precos | Rede Ronin",
    "dashboard.refresh": "Atualizar",
    "dashboard.admin": "Admin",
    "dashboard.pools": "pools",
    "dashboard.loading": "A carregar...",
    // Stats
    "stats.buyOpportunities": "Oportunidades Compra",
    "stats.sellOpportunities": "Oportunidades Venda",
    "stats.trackedResources": "Recursos Monitorizados",
    "stats.totalVolume": "Volume Total 24h",
    "stats.belowThreshold": "abaixo de",
    "stats.aboveThreshold": "acima de",
    // Table
    "table.title": "Tabela de Precos",
    "table.search": "Pesquisar recurso...",
    "table.allCategories": "Todas",
    "table.allPriorities": "Todas",
    "table.resource": "Recurso",
    "table.marketPrice": "Preco Mercado",
    "table.productionCost": "Custo Producao",
    "table.deviation": "Desvio",
    "table.volume24h": "Volume 24h",
    "table.signal": "Sinal",
    "table.buy": "COMPRA",
    "table.sell": "VENDA",
    "table.neutral": "---",
    "table.noResults": "Nenhum recurso encontrado",
    "table.mine": "Mina",
    "table.factory": "Fabrica",
    "table.token": "Token",
    // Opportunities
    "opps.title": "Oportunidades",
    "opps.buySignals": "Sinais de Compra",
    "opps.sellSignals": "Sinais de Venda",
    "opps.noOpportunities": "Nenhuma oportunidade detetada neste momento.",
    "opps.loading": "A carregar precos...",
    "opps.deviation": "Desvio",
    "opps.cost": "Custo",
    "opps.price": "Preco",
    // Chain
    "chain.title": "Cadeia de Producao",
    "chain.expandAll": "Expandir Tudo",
    "chain.collapseAll": "Recolher Tudo",
    // Chart
    "chart.title": "Grafico de Precos",
    "chart.price": "Preco",
    "chart.volume": "Volume",
    "chart.showVolume": "Mostrar Volume",
    "chart.loading": "A carregar grafico...",
    "chart.noData": "Sem dados disponiveis",
    "chart.close": "Fechar",
    "chart.current": "Preco Atual",
    "chart.prodCost": "Custo Producao",
    // Footer
    "footer.disclaimer": "Verifique sempre no jogo antes de tomar decisoes!",
    // Login
    "login.welcome": "Seja Bem-vindo",
    "login.subtitle": "Craft World Economy",
    "login.password": "Password",
    "login.username": "Username",
    "login.enterPassword": "Introduzir password...",
    "login.enterUsername": "Username...",
    "login.login": "Entrar",
    "login.verifying": "A verificar...",
    "login.wrongCredentials": "Credenciais incorretas",
    "login.superadminHint": "Entrar so com password (superadmin)",
    "login.userHint": "Entrar com username e password",
    "login.backToDashboard": "Voltar ao Dashboard",
    // Admin
    "admin.title": "Painel de Administracao",
    "admin.subtitle": "Gerir pools, custos, alertas e bot Telegram",
    "admin.reload": "Recarregar",
    "admin.logout": "Sair",
    "admin.pools": "Pools",
    "admin.production": "Producao",
    "admin.telegram": "Telegram",
    "admin.sharing": "Partilha",
    "admin.banners": "Banners",
    "admin.config": "Config",
    "admin.dashboard": "Dashboard",
    // Language
    "lang.pt": "Portugues",
    "lang.en": "English",
  },
  en: {
    // Dashboard
    "app.title": "Craft World Economy",
    "app.subtitle": "Price Monitor | Ronin Network",
    "dashboard.refresh": "Refresh",
    "dashboard.admin": "Admin",
    "dashboard.pools": "pools",
    "dashboard.loading": "Loading...",
    // Stats
    "stats.buyOpportunities": "Buy Opportunities",
    "stats.sellOpportunities": "Sell Opportunities",
    "stats.trackedResources": "Tracked Resources",
    "stats.totalVolume": "Total Volume 24h",
    "stats.belowThreshold": "below",
    "stats.aboveThreshold": "above",
    // Table
    "table.title": "Price Table",
    "table.search": "Search resource...",
    "table.allCategories": "All",
    "table.allPriorities": "All",
    "table.resource": "Resource",
    "table.marketPrice": "Market Price",
    "table.productionCost": "Production Cost",
    "table.deviation": "Deviation",
    "table.volume24h": "Volume 24h",
    "table.signal": "Signal",
    "table.buy": "BUY",
    "table.sell": "SELL",
    "table.neutral": "---",
    "table.noResults": "No resources found",
    "table.mine": "Mine",
    "table.factory": "Factory",
    "table.token": "Token",
    // Opportunities
    "opps.title": "Opportunities",
    "opps.buySignals": "Buy Signals",
    "opps.sellSignals": "Sell Signals",
    "opps.noOpportunities": "No opportunities detected at the moment.",
    "opps.loading": "Loading prices...",
    "opps.deviation": "Deviation",
    "opps.cost": "Cost",
    "opps.price": "Price",
    // Chain
    "chain.title": "Production Chain",
    "chain.expandAll": "Expand All",
    "chain.collapseAll": "Collapse All",
    // Chart
    "chart.title": "Price Chart",
    "chart.price": "Price",
    "chart.volume": "Volume",
    "chart.showVolume": "Show Volume",
    "chart.loading": "Loading chart...",
    "chart.noData": "No data available",
    "chart.close": "Close",
    "chart.current": "Current Price",
    "chart.prodCost": "Production Cost",
    // Footer
    "footer.disclaimer": "Always verify in-game before making decisions!",
    // Login
    "login.welcome": "Welcome",
    "login.subtitle": "Craft World Economy",
    "login.password": "Password",
    "login.username": "Username",
    "login.enterPassword": "Enter password...",
    "login.enterUsername": "Username...",
    "login.login": "Sign In",
    "login.verifying": "Verifying...",
    "login.wrongCredentials": "Incorrect credentials",
    "login.superadminHint": "Sign in with password only (superadmin)",
    "login.userHint": "Sign in with username and password",
    "login.backToDashboard": "Back to Dashboard",
    // Admin
    "admin.title": "Admin Panel",
    "admin.subtitle": "Manage pools, costs, alerts and Telegram bot",
    "admin.reload": "Reload",
    "admin.logout": "Logout",
    "admin.pools": "Pools",
    "admin.production": "Production",
    "admin.telegram": "Telegram",
    "admin.sharing": "Sharing",
    "admin.banners": "Banners",
    "admin.config": "Config",
    "admin.dashboard": "Dashboard",
    // Language
    "lang.pt": "Portugues",
    "lang.en": "English",
  },
} as const

type TranslationKey = keyof typeof translations.pt

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: "pt",
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cw-locale") as Locale) || "pt"
    }
    return "pt"
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("cw-locale", newLocale)
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || translations.pt[key] || key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
