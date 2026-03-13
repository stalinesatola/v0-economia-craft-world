"use client"

import { Github, MessageCircle, X } from "lucide-react"

interface FooterProps {
  credits?: string
  links?: string
  disclaimer?: string
  socialLinks?: {
    github?: string
    telegram?: string
    twitter?: string
  }
  bannerAd?: {
    enabled?: boolean
    imageUrl?: string
    linkUrl?: string
    altText?: string
    adScript?: string
  }
}

export function Footer({ 
  credits, 
  links, 
  disclaimer,
  socialLinks = {
    github: "https://github.com",
    telegram: "https://telegram.org",
    twitter: "https://x.com",
  },
  bannerAd
}: FooterProps) {
  return (
    <footer className="border-t border-border mt-8 pt-6 pb-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Banner Ad (if enabled) */}
        {bannerAd?.enabled && (
          <div className="mb-6">
            {bannerAd.adScript ? (
              <div className="flex items-center justify-center w-full bg-secondary/20 border border-border rounded-lg p-4 min-h-20">
                <span className="text-xs text-muted-foreground">Ad Space</span>
              </div>
            ) : bannerAd.imageUrl ? (
              <a 
                href={bannerAd.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer nofollow"
                className="block relative group rounded-lg overflow-hidden"
              >
                <img
                  src={bannerAd.imageUrl}
                  alt={bannerAd.altText || "Advertisement"}
                  className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                  crossOrigin="anonymous"
                />
                <span className="absolute top-2 right-2 rounded bg-background/70 px-2 py-1 text-xs text-muted-foreground font-medium">
                  AD
                </span>
              </a>
            ) : null}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          {/* Social Links */}
          <div className="flex gap-4 items-center justify-center">
            {socialLinks?.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="GitHub"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {socialLinks?.telegram && (
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Telegram"
                aria-label="Telegram"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
            {socialLinks?.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                title="X (Twitter)"
                aria-label="X (Twitter)"
              >
                <X className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-col items-center gap-1 text-center">
            {credits && (
              <p className="text-xs text-muted-foreground">
                {credits}
              </p>
            )}
            {links && (
              <p className="text-xs text-muted-foreground">
                {links}
              </p>
            )}
            {disclaimer && (
              <p className="mt-2 text-xs text-muted-foreground/60">
                {disclaimer}
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
