"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Eye, Code, ArrowRight, Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { RECIPES, getResourceColor, RESOURCE_IMAGES, type Recipe } from "@/lib/resource-images"
import type { AppConfig, ChainNode, RecipeConfig } from "@/lib/config-manager"

interface ChainsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

const DEFAULT_CHAINS: ChainNode[] = [
  {
    symbol: "EARTH",
    children: [
      { symbol: "MUD", children: [{ symbol: "CLAY", children: [{ symbol: "SAND", children: [{ symbol: "COPPER", children: [{ symbol: "STEEL", children: [{ symbol: "SCREWS", children: [{ symbol: "ACID", children: [] }] }, { symbol: "SULFUR", children: [] }] }, { symbol: "STONE", children: [] }] }, { symbol: "GLASS", children: [{ symbol: "FIBERGLASS", children: [{ symbol: "DYNAMITE", children: [] }] }] }] }, { symbol: "CERAMICS", children: [{ symbol: "CEMENT", children: [{ symbol: "PLASTICS", children: [] }] }] }] }] },
    ],
  },
  { symbol: "FIRE", children: [{ symbol: "HEAT", children: [{ symbol: "LAVA", children: [] }] }] },
  { symbol: "WATER", children: [{ symbol: "SEAWATER", children: [{ symbol: "ALGAE", children: [{ symbol: "OXYGEN", children: [{ symbol: "GAS", children: [{ symbol: "FUEL", children: [{ symbol: "OIL", children: [{ symbol: "ENERGY", children: [] }] }] }] }, { symbol: "STEAM", children: [{ symbol: "HYDROGEN", children: [] }] }] }] }] }] },
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

// ---- Recipe CRUD Form ----
function RecipeForm({ initial, onSave, onCancel }: {
  initial?: RecipeConfig
  onSave: (recipe: RecipeConfig) => void
  onCancel: () => void
}) {
  const [output, setOutput] = useState(initial?.output ?? "")
  const [level, setLevel] = useState(initial?.level ?? 1)
  const [inputs, setInputs] = useState<{ resource: string; quantity: number }[]>(
    initial?.inputs ?? [{ resource: "", quantity: 1 }]
  )

  const addInput = () => {
    if (inputs.length < 3) setInputs([...inputs, { resource: "", quantity: 1 }])
  }

  const removeInput = (i: number) => {
    setInputs(inputs.filter((_, idx) => idx !== i))
  }

  const updateInput = (i: number, field: "resource" | "quantity", value: string | number) => {
    setInputs(inputs.map((inp, idx) => idx === i ? { ...inp, [field]: field === "resource" ? String(value).toUpperCase() : Number(value) } : inp))
  }

  const isValid = output.trim() && inputs.every(inp => inp.resource.trim() && inp.quantity > 0)

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Recurso Produzido</Label>
            <Input
              value={output}
              onChange={(e) => setOutput(e.target.value.toUpperCase())}
              placeholder="STEEL"
              className="bg-background border-border h-8 text-xs font-mono"
              disabled={!!initial}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Level</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
              className="bg-background border-border h-8 text-xs font-mono"
            />
          </div>
          <div className="flex items-end">
            <span className="text-xs text-muted-foreground">Inputs: {inputs.length}/3</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground font-semibold">Materias-Primas (ate 3)</Label>
          {inputs.map((inp, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={inp.resource}
                onChange={(e) => updateInput(i, "resource", e.target.value)}
                placeholder="EARTH"
                className="bg-background border-border h-7 text-xs font-mono flex-1"
              />
              <Input
                type="number"
                min={1}
                value={inp.quantity}
                onChange={(e) => updateInput(i, "quantity", e.target.value)}
                className="bg-background border-border h-7 text-xs font-mono w-16"
              />
              <span className="text-[10px] text-muted-foreground w-4">x</span>
              {inputs.length > 1 && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeInput(i)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {inputs.length < 3 && (
            <Button variant="outline" size="sm" onClick={addInput} className="text-xs gap-1.5 self-start">
              <Plus className="h-3 w-3" /> Adicionar Input
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">Cancelar</Button>
          <Button size="sm" onClick={() => onSave({ output: output.trim(), inputs: inputs.filter(i => i.resource.trim()), level })} disabled={!isValid} className="text-xs gap-1.5">
            <Check className="h-3 w-3" />
            {initial ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Recipe Display Card ----
function RecipeCard({ recipe, onEdit, onDelete, onMove, isFirst, isLast }: {
  recipe: RecipeConfig
  onEdit: () => void
  onDelete: () => void
  onMove: (dir: "up" | "down") => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 transition-all hover:border-primary/30">
      {/* Inputs */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
        {recipe.inputs.map((inp, i) => (
          <div key={inp.resource} className="flex items-center gap-0.5">
            {i > 0 && <span className="text-[10px] text-muted-foreground font-bold">+</span>}
            <span className="text-[10px] font-mono font-bold text-primary">{inp.quantity}x</span>
            <ResourceIcon symbol={inp.resource} size={20} />
            <span className="text-[10px] font-mono text-muted-foreground">{inp.resource}</span>
          </div>
        ))}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

      {/* Output */}
      <div className="flex items-center gap-1.5 shrink-0">
        <ResourceIcon symbol={recipe.output} size={24} />
        <span className="text-xs font-mono font-bold text-card-foreground">{recipe.output}</span>
      </div>

      <Badge variant="outline" className="text-[8px] px-1 h-3.5 font-mono shrink-0">L{recipe.level}</Badge>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove("up")} disabled={isFirst}>
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove("down")} disabled={isLast}>
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
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
            <ResourceIcon symbol={node.symbol} size={20} />
            <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">{node.symbol}</Badge>
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
  const [jsonText, setJsonText] = useState(JSON.stringify(config.productionChains ?? [], null, 2))
  const [error, setError] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Receitas: do DB se existir, senao fallback para hardcoded
  const [recipes, setRecipes] = useState<RecipeConfig[]>(
    config.recipes?.length ? config.recipes : RECIPES.map(r => ({ output: r.output, inputs: r.inputs, level: r.level }))
  )

  // CRUD state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingOutput, setEditingOutput] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(JSON.stringify(config.productionChains ?? [], null, 2))
    setRecipes(config.recipes?.length ? config.recipes : RECIPES.map(r => ({ output: r.output, inputs: r.inputs, level: r.level })))
    setHasChanges(false)
    setError("")
  }, [config.productionChains, config.recipes])

  const handleAddRecipe = (recipe: RecipeConfig) => {
    if (recipes.some(r => r.output === recipe.output)) return
    setRecipes(prev => [...prev, recipe])
    setShowAddForm(false)
    setHasChanges(true)
  }

  const handleEditRecipe = (recipe: RecipeConfig) => {
    setRecipes(prev => prev.map(r => r.output === recipe.output ? recipe : r))
    setEditingOutput(null)
    setHasChanges(true)
  }

  const handleDeleteRecipe = (output: string) => {
    setRecipes(prev => prev.filter(r => r.output !== output))
    setHasChanges(true)
  }

  const handleMoveRecipe = (output: string, dir: "up" | "down") => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.output === output)
      if (idx < 0) return prev
      const newIdx = dir === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setError("")
    try {
      if (mode === "json") {
        const parsed = JSON.parse(jsonText)
        if (!Array.isArray(parsed)) { setError("Deve ser um array JSON valido"); return }
        await onUpdate("productionChains", parsed)
      }
      const success = await onUpdate("recipes", recipes)
      if (success) setHasChanges(false)
    } catch {
      setError("JSON invalido")
    }
  }

  const handleReset = () => {
    if (mode === "json") {
      setJsonText(JSON.stringify(DEFAULT_CHAINS, null, 2))
    } else {
      setRecipes(RECIPES.map(r => ({ output: r.output, inputs: r.inputs, level: r.level })))
    }
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
              <CardDescription>Gerir receitas e arvore de dependencias. Custos calculados automaticamente via pools.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode(mode === "visual" ? "json" : "visual")} className="gap-1.5">
                {mode === "visual" ? <><Code className="h-3.5 w-3.5" /> JSON</> : <><Eye className="h-3.5 w-3.5" /> Visual</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {saving ? "..." : "Guardar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "visual" ? (
            <div className="flex flex-col gap-4">
              {/* Receitas CRUD */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    Receitas
                    <Badge variant="secondary" className="text-[10px]">{recipes.length}</Badge>
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => { setShowAddForm(!showAddForm); setEditingOutput(null) }} className="gap-1.5 text-xs">
                    <Plus className="h-3 w-3" /> Nova Receita
                  </Button>
                </div>

                {/* Add form */}
                {showAddForm && (
                  <RecipeForm onSave={handleAddRecipe} onCancel={() => setShowAddForm(false)} />
                )}

                {/* Recipe list */}
                <div className="flex flex-col gap-1.5">
                  {recipes.map((recipe, idx) => (
                    editingOutput === recipe.output ? (
                      <RecipeForm
                        key={recipe.output}
                        initial={recipe}
                        onSave={handleEditRecipe}
                        onCancel={() => setEditingOutput(null)}
                      />
                    ) : (
                      <RecipeCard
                        key={recipe.output}
                        recipe={recipe}
                        onEdit={() => { setEditingOutput(recipe.output); setShowAddForm(false) }}
                        onDelete={() => handleDeleteRecipe(recipe.output)}
                        onMove={(dir) => handleMoveRecipe(recipe.output, dir)}
                        isFirst={idx === 0}
                        isLast={idx === recipes.length - 1}
                      />
                    )
                  ))}
                </div>

                {recipes.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma receita configurada. Clique em "Nova Receita" ou "Reset" para usar as default.
                  </div>
                )}
              </div>

              {/* Arvore de Dependencias */}
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-card-foreground">Arvore de Dependencias</h3>
                <div className="rounded-lg border border-border bg-secondary/50 p-4 max-h-[400px] overflow-y-auto">
                  <ChainTreePreview nodes={config.productionChains ?? []} />
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
