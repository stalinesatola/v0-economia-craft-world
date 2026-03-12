'use client'

import { useEffect } from 'react'
import { applyTheme, type UITheme } from '@/lib/themes'

export function useTheme(theme?: UITheme) {
  useEffect(() => {
    if (!theme) return
    applyTheme(theme)
  }, [theme])
}

export function useThemeLoader() {
  useEffect(() => {
    // Load theme preference from localStorage on mount
    const saved = localStorage.getItem('ui-theme') as UITheme
    if (saved) {
      applyTheme(saved)
    }
  }, [])
}
