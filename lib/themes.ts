// UI Themes - Selectable themes for the application
export type UITheme = "craft" | "modern"

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  muted: string
  mutedForeground: string
  border: string
  destructive: string
  success: string
  warning: string
}

export interface Theme {
  name: string
  id: UITheme
  description: string
  colors: ThemeColors
}

export const THEMES: Record<UITheme, Theme> = {
  // Original Craft World Economy theme
  craft: {
    name: "Craft World",
    id: "craft",
    description: "Deep volcanic dark theme inspired by Craft World Economy",
    colors: {
      background: "oklch(0.12 0.01 270)",
      foreground: "oklch(0.95 0.005 90)",
      card: "oklch(0.16 0.012 270)",
      cardForeground: "oklch(0.95 0.005 90)",
      primary: "oklch(0.75 0.18 55)", // Orange/fire
      primaryForeground: "oklch(0.12 0.01 270)",
      secondary: "oklch(0.20 0.012 270)",
      secondaryForeground: "oklch(0.85 0.01 90)",
      accent: "oklch(0.70 0.14 190)", // Teal
      accentForeground: "oklch(0.12 0.01 270)",
      muted: "oklch(0.22 0.01 270)",
      mutedForeground: "oklch(0.60 0.02 260)",
      border: "oklch(0.25 0.015 270)",
      destructive: "oklch(0.62 0.22 25)", // Red
      success: "oklch(0.72 0.15 130)", // Green
      warning: "oklch(0.80 0.16 80)", // Yellow
    },
  },

  // Modern SaaS theme - clean, minimal, professional
  modern: {
    name: "Modern",
    id: "modern",
    description: "Clean, minimal SaaS design with soft shadows and rounded corners",
    colors: {
      background: "oklch(0.98 0.001 270)", // Almost white
      foreground: "oklch(0.15 0.01 270)", // Almost black
      card: "oklch(1 0 0)", // Pure white
      cardForeground: "oklch(0.15 0.01 270)",
      primary: "oklch(0.55 0.22 263)", // Modern blue
      primaryForeground: "oklch(1 0 0)", // White
      secondary: "oklch(0.93 0.01 270)", // Light gray
      secondaryForeground: "oklch(0.30 0.01 270)",
      accent: "oklch(0.50 0.25 150)", // Vibrant teal
      accentForeground: "oklch(1 0 0)", // White
      muted: "oklch(0.90 0.01 270)", // Gray
      mutedForeground: "oklch(0.50 0.01 270)",
      border: "oklch(0.93 0.01 270)", // Light border
      destructive: "oklch(0.65 0.20 25)", // Soft red
      success: "oklch(0.65 0.18 130)", // Soft green
      warning: "oklch(0.75 0.15 80)", // Soft yellow
    },
  },
}

export const THEME_OPTIONS: Array<{ value: UITheme; label: string; description: string }> = [
  { value: "craft", label: "Craft World", description: "Deep volcanic dark theme" },
  { value: "modern", label: "Modern", description: "Clean, minimal SaaS design" },
]

export function applyTheme(theme: UITheme): void {
  const colors = THEMES[theme].colors
  const root = document.documentElement

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
    root.style.setProperty(cssVar, value)
  })

  // Store theme preference
  if (typeof window !== "undefined") {
    localStorage.setItem("ui-theme", theme)
  }
}

export function getStoredTheme(): UITheme {
  if (typeof window === "undefined") return "craft"
  return (localStorage.getItem("ui-theme") as UITheme) || "craft"
}

export function getCSSVariables(theme: UITheme): Record<string, string> {
  const colors = THEMES[theme].colors
  const result: Record<string, string> = {}

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
    result[cssVar] = value
  })

  return result
}
