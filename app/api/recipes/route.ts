import { NextResponse } from "next/server"
import { getConfigSection } from "@/lib/config-manager"
import { RECIPES } from "@/lib/resource-images"

export async function GET() {
  try {
    const dbRecipes = await getConfigSection("recipes")
    // Se existirem receitas no DB, usar essas. Senao, fallback para hardcoded.
    if (dbRecipes && Array.isArray(dbRecipes) && dbRecipes.length > 0) {
      return NextResponse.json(dbRecipes)
    }
    return NextResponse.json(RECIPES)
  } catch {
    return NextResponse.json(RECIPES)
  }
}
