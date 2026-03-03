"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Image, LayoutTemplate, PanelRight, Rows3 } from "lucide-react"
import type { AppConfig, BannerConfig } from "@/lib/config-manager"

interface BannersTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

const positionLabels: Record<string, string> = {
  top: "Topo da Pagina",
  sidebar: "Barra Lateral",
  between: "Entre Seccoes",
}

const positionIcons: Record<string, typeof LayoutTemplate> = {
  top: LayoutTemplate,
  sidebar: PanelRight,
  between: Rows3,
}

const positionDescriptions: Record<string, string> = {
  top: "Banner horizontal no topo do dashboard, abaixo do header",
  sidebar: "Banner na barra lateral direita, ao lado da cadeia de producao",
  between: "Banner horizontal entre as stats cards e os recursos",
}

export function BannersTab({ config, onUpdate, saving }: BannersTabProps) {
  const [banners, setBanners] = useState<BannerConfig[]>(config.banners ?? [])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setBanners(config.banners ?? [])
    setHasChanges(false)
  }, [config.banners])

  const updateBanner = (id: string, field: keyof BannerConfig, value: string | boolean) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    const success = await onUpdate("banners", banners)
    if (success) setHasChanges(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Banners e Publicidade</h2>
          <p className="text-xs text-muted-foreground">
            Configure banners de imagem ou scripts de ad (Google Ads, etc.) para o dashboard publico.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? "A guardar..." : "Guardar Tudo"}
        </Button>
      </div>

      {banners.map((banner) => {
        const Icon = positionIcons[banner.position] ?? Image
        return (
          <Card key={banner.id} className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-sm text-card-foreground">
                      {positionLabels[banner.position] ?? banner.position}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {positionDescriptions[banner.position] ?? ""}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={banner.enabled ? "border-primary text-primary" : "border-muted text-muted-foreground"}
                  >
                    {banner.enabled ? "Ativo" : "Inativo"}
                  </Badge>
                  <Switch
                    checked={banner.enabled}
                    onCheckedChange={(checked) => updateBanner(banner.id, "enabled", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">URL da Imagem</Label>
                  <Input
                    value={banner.imageUrl}
                    onChange={(e) => updateBanner(banner.id, "imageUrl", e.target.value)}
                    placeholder="https://exemplo.com/banner.jpg"
                    className="h-8 text-xs bg-secondary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Link de Destino</Label>
                  <Input
                    value={banner.linkUrl}
                    onChange={(e) => updateBanner(banner.id, "linkUrl", e.target.value)}
                    placeholder="https://exemplo.com"
                    className="h-8 text-xs bg-secondary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Texto Alternativo</Label>
                <Input
                  value={banner.altText}
                  onChange={(e) => updateBanner(banner.id, "altText", e.target.value)}
                  placeholder="Descricao do banner"
                  className="h-8 text-xs bg-secondary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Script de Ad (alternativa a imagem - Google Ads, etc.)
                </Label>
                <Textarea
                  value={banner.adScript}
                  onChange={(e) => updateBanner(banner.id, "adScript", e.target.value)}
                  placeholder={'<ins class="adsbygoogle"...></ins><script>...</script>'}
                  className="min-h-20 text-xs bg-secondary font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Se preenchido, o script substitui a imagem. Use para Google Ads ou outros providers.
                </p>
              </div>

              {/* Preview */}
              {banner.enabled && banner.imageUrl && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Pre-visualizacao</Label>
                  <div className="rounded-lg border border-dashed border-border overflow-hidden max-h-24">
                    <img
                      src={banner.imageUrl}
                      alt={banner.altText || "Preview"}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
