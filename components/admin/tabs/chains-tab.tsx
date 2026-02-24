"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Eye, Code } from "lucide-react"
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
                  {
                    symbol: "GLASS",
                    children: [
                      {
                        symbol: "FIBERGLASS",
                        children: [{ symbol: "DYNAMITE", children: [] }],
                      },
                    ],
                  },
                ],
              },
              {
                symbol: "CERAMICS",
                children: [
                  {
                    symbol: "CEMENT",
                    children: [{ symbol: "PLASTICS", children: [] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    symbol: "FIRE",
    children: [{ symbol: "HEAT", children: [{ symbol: "LAVA", children: [] }] }],
  },
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
                  {
                    symbol: "GAS",
                    children: [
                      {
                        symbol: "FUEL",
                        children: [
                          {
                            symbol: "OIL",
                            children: [{ symbol: "ENERGY", children: [] }],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    symbol: "STEAM",
                    children: [{ symbol: "HYDROGEN", children: [] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

function ChainTreePreview({ nodes, depth = 0 }: { nodes: ChainNode[]; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      {nodes.map((node) => (
        <div key={node.symbol} className="py-1">
          <div className="flex items-center gap-2">
            {depth > 0 && <span className="text-muted-foreground text-xs">{"-->"}</span>}
            <Badge
              variant="outline"
              className="font-mono text-xs border-primary/40 text-primary"
            >
              {node.symbol}
            </Badge>
          </div>
          {node.children.length > 0 && (
            <ChainTreePreview nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export function ChainsTab({ config, onUpdate, saving }: ChainsTabProps) {
  const [mode, setMode] = useState<"preview" | "editor">("preview")
  const [jsonText, setJsonText] = useState(JSON.stringify(config.productionChains, null, 2))
  const [error, setError] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    setError("")
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        setError("O JSON deve ser um array de cadeias.")
        return
      }
      const success = await onUpdate("productionChains", parsed)
      if (success) {
        setHasChanges(false)
      }
    } catch {
      setError("JSON invalido. Verifique a sintaxe.")
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
              <CardDescription>
                Visualizar e editar a arvore de dependencias entre recursos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === "preview" ? "editor" : "preview")}
                className="gap-1.5"
              >
                {mode === "preview" ? (
                  <>
                    <Code className="h-3.5 w-3.5" /> Editor JSON
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </>
                )}
              </Button>
              {mode === "editor" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    size="sm"
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "A guardar..." : "Guardar"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "preview" ? (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 max-h-[500px] overflow-y-auto">
              <ChainTreePreview nodes={config.productionChains} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value)
                  setHasChanges(true)
                  setError("")
                }}
                className="bg-secondary border-border text-card-foreground font-mono text-xs min-h-[400px]"
                placeholder="JSON da cadeia de producao..."
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
