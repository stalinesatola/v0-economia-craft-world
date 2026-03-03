"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, Plus, Trash2, ChevronUp, ChevronDown, Pencil, X, Check } from "lucide-react"
import type { AppConfig, CategoryConfig } from "@/lib/config-manager"

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: "mine", label: "Mineracao", color: "#f59e0b", icon: "pickaxe", enabled: true, order: 0 },
  { id: "factory", label: "Fabrica", color: "#3b82f6", icon: "factory", enabled: true, order: 1 },
  { id: "token", label: "Token", color: "#8b5cf6", icon: "coins", enabled: true, order: 2 },
  { id: "base", label: "Base", color: "#10b981", icon: "layers", enabled: true, order: 3 },
  { id: "advanced", label: "Avancado", color: "#ef4444", icon: "zap", enabled: true, order: 4 },
  { id: "defi", label: "DeFi", color: "#ec4899", icon: "trending-up", enabled: true, order: 5 },
]

const ICON_OPTIONS = [
  { value: "pickaxe", label: "Pickaxe" },
  { value: "factory", label: "Factory" },
  { value: "coins", label: "Coins" },
  { value: "layers", label: "Layers" },
  { value: "zap", label: "Zap" },
  { value: "trending-up", label: "Trending Up" },
  { value: "gem", label: "Gem" },
  { value: "flame", label: "Flame" },
  { value: "droplet", label: "Droplet" },
  { value: "star", label: "Star" },
  { value: "shield", label: "Shield" },
  { value: "box", label: "Box" },
]

interface CategoriesTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function CategoriesTab({ config, onUpdate, saving }: CategoriesTabProps) {
  const [categories, setCategories] = useState<CategoryConfig[]>(
    config.categories?.length ? config.categories : DEFAULT_CATEGORIES
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newId, setNewId] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [newIcon, setNewIcon] = useState("layers")

  useEffect(() => {
    setCategories(config.categories?.length ? config.categories : DEFAULT_CATEGORIES)
    setHasChanges(false)
  }, [config.categories])

  const handleAdd = () => {
    const id = newId.trim().toLowerCase().replace(/\s+/g, "-")
    if (!id || !newLabel.trim()) return
    if (categories.some((c) => c.id === id)) return

    const newCat: CategoryConfig = {
      id,
      label: newLabel.trim(),
      color: newColor,
      icon: newIcon,
      enabled: true,
      order: categories.length,
    }
    setCategories((prev) => [...prev, newCat])
    setNewId("")
    setNewLabel("")
    setNewColor("#6366f1")
    setNewIcon("layers")
    setShowAddForm(false)
    setHasChanges(true)
  }

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })))
    setHasChanges(true)
  }

  const handleToggle = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    )
    setHasChanges(true)
  }

  const handleMove = (id: string, direction: "up" | "down") => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx < 0) return prev
      const newIdx = direction === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next.map((c, i) => ({ ...c, order: i }))
    })
    setHasChanges(true)
  }

  const handleUpdate = (id: string, field: keyof CategoryConfig, value: string | boolean | number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    const success = await onUpdate("categories", categories)
    if (success) setHasChanges(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-card-foreground">Categorias de Recursos</h2>
          <p className="text-xs text-muted-foreground">
            Gerir categorias usadas em pools e no dashboard ({categories.length} categorias)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3 w-3" />
            Nova
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-1.5 text-xs"
          >
            <Save className="h-3 w-3" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">ID (unico)</Label>
                <Input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="ex: nft"
                  className="bg-background border-border h-8 text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="ex: NFT"
                  className="bg-background border-border h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Cor</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-8 w-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="bg-background border-border h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Icone</Label>
                <Select value={newIcon} onValueChange={setNewIcon}>
                  <SelectTrigger className="bg-background border-border h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={!newId.trim() || !newLabel.trim()} className="text-xs gap-1.5">
                <Check className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories list */}
      <div className="flex flex-col gap-1.5">
        {categories.map((cat, idx) => (
          <Card
            key={cat.id}
            className={`transition-all ${!cat.enabled ? "opacity-50" : ""}`}
          >
            <CardContent className="p-3">
              {editingId === cat.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">ID</Label>
                      <Input value={cat.id} disabled className="bg-muted h-7 text-xs font-mono" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">Nome</Label>
                      <Input
                        value={cat.label}
                        onChange={(e) => handleUpdate(cat.id, "label", e.target.value)}
                        className="bg-background border-border h-7 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">Cor</Label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="color"
                          value={cat.color}
                          onChange={(e) => handleUpdate(cat.id, "color", e.target.value)}
                          className="h-7 w-8 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={cat.color}
                          onChange={(e) => handleUpdate(cat.id, "color", e.target.value)}
                          className="bg-background border-border h-7 text-xs font-mono flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] text-muted-foreground">Icone</Label>
                      <Select value={cat.icon} onValueChange={(v) => handleUpdate(cat.id, "icon", v)}>
                        <SelectTrigger className="bg-background border-border h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="text-xs gap-1.5">
                      <Check className="h-3 w-3" />
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-3">
                  {/* Color dot */}
                  <div
                    className="h-5 w-5 rounded-full shrink-0 border border-border"
                    style={{ backgroundColor: cat.color }}
                  />
                  {/* Label + ID */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-card-foreground leading-tight truncate">
                      {cat.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground leading-tight">
                      {cat.id} / {cat.icon}
                    </span>
                  </div>
                  {/* Toggle */}
                  <Switch
                    checked={cat.enabled}
                    onCheckedChange={() => handleToggle(cat.id)}
                    className="shrink-0"
                  />
                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(cat.id, "up")}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(cat.id, "down")}
                      disabled={idx === categories.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(cat.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground">
          Nenhuma categoria configurada. Clique em "Nova" para adicionar.
        </div>
      )}
    </div>
  )
}
