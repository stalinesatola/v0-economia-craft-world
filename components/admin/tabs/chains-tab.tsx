"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Eye, Code, ArrowRight, ImageIcon, ChevronDown, ChevronUp } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { RECIPES, getResourceColor, RESOURCE_IMAGES, type Recipe } from "@/lib/resource-images"
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

function ResourceIcon({ symbol, size = 28, imageUrl }: { symbol: string; size?: number; imageUrl?: string }) {
  const color = getResourceColor(symbol)
  const initials = symbol.slice(0, 2)
  const imgSrc = imageUrl || RESOURCE_IMAGES[symbol]

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={symbol}
        className="rounded-md shrink-0 shadow-sm object-cover"
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback para icone colorido se imagem falhar
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          const parent = target.parentElement
          if (parent) {
            const fallback = document.createElement("div")
            fallback.className = "flex items-center justify-center rounded-md font-mono text-[9px] font-bold text-white shrink-0 shadow-sm"
            fallback.style.width = `${size}px`
            fallback.style.height = `${size}px`
            fallback.style.backgroundColor = color
            fallback.style.textShadow = "0 1px 2px rgba(0,0,0,0.5)"
            fallback.textContent = initials
            parent.appendChild(fallback)
          }
        }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-md font-mono text-[9px] font-bold text-white shrink-0 shadow-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
      title={symbol}
    >
      {initials}
    </div>
  )
}

function RecipeCard({ recipe, images, onImageChange }: {
  recipe: Recipe
  images: Record<string, string>
  onImageChange: (symbol: string, url: string) => void
}) {
  const [showImageEdit, setShowImageEdit] = useState(false)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-primary/30">
      {/* Receita principal */}
      <div className="flex items-center gap-2">
        {/* Inputs */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {recipe.inputs.map((inp, i) => (
            <div key={inp.resource} className="flex items-center gap-1">
              {i > 0 && <span className="text-[10px] text-muted-foreground font-bold">+</span>}
              <span className="text-[10px] font-mono font-bold text-primary">{inp.quantity}x</span>
              <ResourceIcon symbol={inp.resource} size={24} imageUrl={images[inp.resource]} />
              <span className="text-[10px] font-mono text-muted-foreground">{inp.resource}</span>
            </div>
          ))}
        </div>

        {/* Arrow + Level */}
        <div className="flex flex-col items-center shrink-0">
          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-mono border-muted-foreground/30">
            LVL 1
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Output */}
        <div className="flex items-center gap-1.5">
          <ResourceIcon symbol={recipe.output} size={28} imageUrl={images[recipe.output]} />
          <span className="text-xs font-mono font-bold text-card-foreground">{recipe.output}</span>
        </div>

        {/* Botao imagem */}
        <button
          onClick={() => setShowImageEdit(!showImageEdit)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          title="Editar imagens"
        >
          {showImageEdit ? <ChevronUp className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Editor de imagens (expansivel) */}
      {showImageEdit && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] text-muted-foreground font-semibold">
              Imagem de {recipe.output} (recurso produzido)
            </Label>
            <Input
              value={images[recipe.output] || ""}
              onChange={(e) => onImageChange(recipe.output, e.target.value)}
              placeholder="https://...imagem.png"
              className="bg-background border-border text-card-foreground h-7 text-[10px] font-mono"
            />
          </div>
          {recipe.inputs.map((inp) => (
            <div key={inp.resource} className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-muted-foreground">
                Imagem de {inp.resource}
              </Label>
              <Input
                value={images[inp.resource] || ""}
                onChange={(e) => onImageChange(inp.resource, e.target.value)}
                placeholder="https://...imagem.png"
                className="bg-background border-border text-card-foreground h-7 text-[10px] font-mono"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChainTreePreview({ nodes, depth = 0, images }: { nodes: ChainNode[]; depth?: number; images: Record<string, string> }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      {nodes.map((node) => (
        <div key={node.symbol} className="py-1">
          <div className="flex items-center gap-2">
            {depth > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            <ResourceIcon symbol={node.symbol} size={22} imageUrl={images[node.symbol]} />
            <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
              {node.symbol}
            </Badge>
          </div>
          {node.children.length > 0 && <ChainTreePreview nodes={node.children} depth={depth + 1} images={images} />}
        </div>
      ))}
    </div>
  )
}

export function ChainsTab({ config, onUpdate, saving }: ChainsTabProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"visual" | "json">("visual")
  const [jsonText, setJsonText] = useState(JSON.stringify(config.productionChains ?? [], null, 2))
  const [error, setError] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Imagens de recursos armazenadas na config
  const [resourceImages, setResourceImages] = useState<Record<string, string>>(
    (config as Record<string, unknown>).resourceImages as Record<string, string> ?? {}
  )

  useEffect(() => {
    setJsonText(JSON.stringify(config.productionChains ?? [], null, 2))
    setResourceImages((config as Record<string, unknown>).resourceImages as Record<string, string> ?? {})
    setHasChanges(false)
    setError("")
  }, [config.productionChains, config])

  const handleImageChange = (symbol: string, url: string) => {
    setResourceImages((prev) => {
      const next = { ...prev }
      if (url.trim()) {
        next[symbol] = url.trim()
      } else {
        delete next[symbol]
      }
      return next
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setError("")
    try {
      if (mode === "json") {
        const parsed = JSON.parse(jsonText)
        if (!Array.isArray(parsed)) {
          setError("Deve ser um array JSON valido")
          return
        }
        await onUpdate("productionChains", parsed)
      }
      // Salvar imagens de recursos
      const success = await onUpdate("resourceImages", resourceImages)
      if (success) setHasChanges(false)
    } catch {
      setError("JSON invalido")
    }
  }

  const handleReset = () => {
    setJsonText(JSON.stringify(DEFAULT_CHAINS, null, 2))
    setHasChanges(true)
    setError("")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-card-foreground">Cadeia de Producao</CardTitle>
              <CardDescription>Receitas e arvore de dependencias dos recursos. Os precos sao extraidos automaticamente das pools.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === "visual" ? "json" : "visual")}
                className="gap-1.5"
              >
                {mode === "visual" ? (
                  <><Code className="h-3.5 w-3.5" /> JSON</>
                ) : (
                  <><Eye className="h-3.5 w-3.5" /> Visual</>
                )}
              </Button>
              {mode === "json" && (
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "visual" ? (
            <div className="flex flex-col gap-4">
              {/* Cadeia de Producao - Recipe cards */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  Cadeia de Producao
                  <Badge variant="secondary" className="text-[10px]">{RECIPES.length} receitas</Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Clique no icone de imagem para adicionar URLs de imagens aos recursos. LVL 1 para todas as receitas.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {RECIPES.map((recipe) => (
                    <RecipeCard
                      key={recipe.output}
                      recipe={recipe}
                      images={resourceImages}
                      onImageChange={handleImageChange}
                    />
                  ))}
                </div>
              </div>

              {/* Arvore de Dependencias */}
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-card-foreground">Arvore de Dependencias</h3>
                <div className="rounded-lg border border-border bg-secondary/50 p-4 max-h-[400px] overflow-y-auto">
                  <ChainTreePreview nodes={config.productionChains ?? []} images={resourceImages} />
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
