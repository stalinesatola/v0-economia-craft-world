'use client'

import { useEffect } from 'react'
import { applyTheme, getStoredTheme } from '@/lib/themes'

export function ThemeLoader() {
  useEffect(() => {
    // Load saved theme preference or default to 'craft'
    const savedTheme = getStoredTheme()
    applyTheme(savedTheme)
  }, [])

  return null
}
