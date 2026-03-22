"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, Copy, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { AppConfig } from "@/lib/config-manager"

interface NFTsTabProps {
  config: AppConfig
  onUpdate: (section: string, data: unknown) => Promise<boolean>
  saving: boolean
}

export function NFTsTab({ config, onUpdate, saving }: NFTsTabProps) {
  const { t } = useI18n()
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const stored = config?.customization?.openSeaApiKey || ""
    setApiKey(stored)
    setHasChanges(false)
  }, [config?.customization?.openSeaApiKey])

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    setHasChanges(true)
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    const customization = {
      ...config?.customization,
      openSeaApiKey: apiKey.trim(),
    }
    const success = await onUpdate("customization", customization)
    if (success) {
      setHasChanges(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>OpenSea API Configuration</CardTitle>
          <CardDescription>Configure your OpenSea API key para acessar dados de NFTs</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* API Key Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="apikey" className="text-card-foreground font-semibold">
              API Key
            </Label>
            <div className="flex gap-2">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="015ce5f1adf34f0fa4d0049bee632f4d"
                className="bg-secondary border-border text-card-foreground font-mono text-xs flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="gap-1.5"
              >
                {showKey ? "Hide" : "Show"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sua chave de API do OpenSea será usada para buscar dados das coleções de NFTs.
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-primary font-medium">
              ℹ️ Obtenha sua chave API em{" "}
              <a
                href="https://docs.opensea.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary/80"
              >
                OpenSea Docs
              </a>
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-1.5 w-full"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Configuração"}
          </Button>
        </CardContent>
      </Card>

      {/* Collections Info */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Collections Monitorizadas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="text-xs space-y-2">
            <p>
              <strong>Fire Dynos:</strong>{" "}
              <code className="bg-secondary px-2 py-1 rounded text-xs">
                angry-dynomites-lab-fire-dynos
              </code>
            </p>
            <p>
              <strong>Water Dynos:</strong>{" "}
              <code className="bg-secondary px-2 py-1 rounded text-xs">
                angry-dynomites-lab-water-dynos
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
