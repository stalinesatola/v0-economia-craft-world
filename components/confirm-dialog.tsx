"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  isDangerous: boolean
  onConfirm: () => void | Promise<void>
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
    isDangerous: false,
    onConfirm: () => {},
  })

  const confirm = useCallback(
    (options: {
      title: string
      description: string
      confirmLabel?: string
      cancelLabel?: string
      isDangerous?: boolean
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel || "Confirmar",
          cancelLabel: options.cancelLabel || "Cancelar",
          isDangerous: options.isDangerous ?? false,
          onConfirm: () => {
            setState((prev) => ({ ...prev, isOpen: false }))
            resolve(true)
          },
        })
      })
    },
    []
  )

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return { state, confirm, cancel }
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDangerous,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  isDangerous: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in">
      <Card className="w-full max-w-sm mx-4 shadow-lg animate-in slide-in-from-bottom-4">
        <CardHeader className={isDangerous ? "bg-destructive/10" : ""}>
          <div className="flex items-center gap-3">
            {isDangerous && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
            <div>
              <CardTitle className={isDangerous ? "text-destructive" : ""}>{title}</CardTitle>
              <CardDescription className="mt-1.5">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDangerous ? "destructive" : "default"}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
