"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    // Redirecionar para /admin que tem a lógica de login
    redirect("/admin")
  }, [])

  // Este componente nunca será renderizado pois redirect ocorre no useEffect
  return null
}
