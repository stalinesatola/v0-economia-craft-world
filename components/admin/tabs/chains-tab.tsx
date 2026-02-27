"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Eye, Code, Plus, Trash2, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { RECIPES, getResourceColor, type Recipe } from "@/lib/resource-images"
import type { AppConfig, ChainNode } from "@/lib/config-manager"

interface ChainsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

// Default chains for reset
const DEFAULT_CHAINS: ChainNode[] = [
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
                  { symbol: "GLASS", children: [{ symbol: "FIBERGLASS", children: [{ symbol: "DYNAMITE", children: [] }] }] },
                ],
              },
              { symbol: "CERAMICS", children: [{ symbol: "CEMENT", children: [{ symbol: "PLASTICS", children: [] }] }] },
            ],
          },
        ],
      },
    ],
  },
  { symbol: "FIRE", children: [{ symbol: "HEAT", children: [{ symbol: "LAVA", children: [] }] }] },
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

function ResourceIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const color = getResourceColor(symbol)
  const initials = symbol.slice(0, 2)
  return (
    <div
      className="flex items-center justify-center rounded-md font-mono text-[9px] font-bold text-white shrink-0 shadow-sm"
      style={{ width: size, height: size, backgroundColor: color, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      title={symbol}
    >
      {initials}
    </div>
  )
}

function RecipePreview({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {recipe.inputs.map((inp, i) => (
          <div key={inp.resource} className="flex items-center gap-1">
            {i > 0 && <span className="text-[10px] text-muted-foreground font-bold">+</span>}
            <span className="text-[10px] font-mono font-bold text-primary">{inp.quantity}x</span>
            <ResourceIcon symbol={inp.resource} size={20} />
            <span className="text-[10px] font-mono text-muted-foreground">{inp.resource}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center shrink-0">
        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-mono border-muted-foreground/30">
          LVL {recipe.level}
        </Badge>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1.5">
        <ResourceIcon symbol={recipe.output} size={24} />
        <span className="text-xs font-mono font-bold text-card-foreground">{recipe.output}</span>
      </div>
    </div>
  )
}

function ChainTreePreview({ nodes, depth = 0 }: { nodes: ChainNode[]; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      {nodes.map((node) => (
        <div key={node.symbol} className="py-1">
          <div className="flex items-center gap-2">
            {depth > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            <ResourceIcon symbol={node.symbol} size={22} />
            <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
              {node.symbol}
            </Badge>
          </div>
          {node.children.length > 0 && <ChainTreePreview nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  )
}

export function ChainsTab({ config, onUpdate, saving }: ChainsTabProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"visual" | "json">("visual")
  const [jsonText, setJsonText] = useState(JSON.stringify(config.productionChains, null, 2))
  const [error, setError] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    setError("")
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        setError(t("chains.mustBeArray"))
        return
      }
      const success = await onUpdate("productionChains", parsed)
      if (success) setHasChanges(false)
    } catch {
      setError(t("chains.invalidJson"))
    }
  }

  const handleReset = () => {
    setJsonText(JSON.stringify(DEFAULT_CHAINS, null, 2))
    setHasChanges(true)
    setError("")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Recipes visual reference */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">{t("chains.title")}</CardTitle>
              <CardDescription>{t("chains.description")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === "visual" ? "json" : "visual")}
                className="gap-1.5"
              >
                {mode === "visual" ? (
                  <><Code className="h-3.5 w-3.5" /> {t("chains.jsonEditor")}</>
                ) : (
                  <><Eye className="h-3.5 w-3.5" /> {t("chains.preview")}</>
                )}
              </Button>
              {mode === "json" && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> {t("chains.reset")}
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {saving ? t("admin.saving") : t("admin.save")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "visual" ? (
            <div className="flex flex-col gap-4">
              {/* Recipe cards - visual representation */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-card-foreground">Receitas de Producao</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RECIPES.map((recipe) => (
                    <RecipePreview key={recipe.output} recipe={recipe} />
                  ))}
                </div>
              </div>

              {/* Chain tree preview */}
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-card-foreground">Arvore de Dependencias</h3>
                <div className="rounded-lg border border-border bg-secondary/50 p-4 max-h-[400px] overflow-y-auto">
                  <ChainTreePreview nodes={config.productionChains} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setHasChanges(true); setError("") }}
                className="bg-secondary border-border text-card-foreground font-mono text-xs min-h-[400px]"
                placeholder="JSON da cadeia de producao..."
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
