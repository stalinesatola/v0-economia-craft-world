"use client"

import { useEffect, useRef } from "react"

interface AdBannerProps {
  position: "top" | "sidebar" | "between"
  imageUrl?: string
  linkUrl?: string
  altText?: string
  adScript?: string
  enabled?: boolean
}

export function AdBanner({ position, imageUrl, linkUrl, altText, adScript, enabled }: AdBannerProps) {
  const scriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adScript && scriptRef.current) {
      try {
        const container = scriptRef.current
        container.innerHTML = ""
        const fragment = document.createRange().createContextualFragment(adScript)
        container.appendChild(fragment)
      } catch {
        // Invalid ad script - fail silently
      }
    }
  }, [adScript])

  if (!enabled) return null

  const positionClasses: Record<string, string> = {
    top: "w-full max-h-24 overflow-hidden rounded-lg",
    sidebar: "w-full max-h-64 overflow-hidden rounded-lg",
    between: "w-full max-h-24 overflow-hidden rounded-lg",
  }

  // Ad script mode
  if (adScript) {
    return (
      <div className={`${positionClasses[position]} bg-secondary/30 border border-border`}>
        <div ref={scriptRef} className="flex items-center justify-center w-full h-full" />
      </div>
    )
  }

  // Image banner mode
  if (imageUrl) {
    const content = (
      <div className={`${positionClasses[position]} relative group`}>
        <img
          src={imageUrl}
          alt={altText || "Publicidade"}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <span className="absolute top-1 right-1 rounded bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          AD
        </span>
      </div>
    )

    if (linkUrl) {
      return (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer nofollow" className="block">
          {content}
        </a>
      )
    }

    return content
  }

  // Placeholder when enabled but no content
  return (
    <div className={`${positionClasses[position]} flex items-center justify-center bg-secondary/20 border border-dashed border-border`}>
      <span className="text-xs text-muted-foreground">Espaco publicitario</span>
    </div>
  )
}
