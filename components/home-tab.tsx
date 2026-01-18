"use client"

import { DuoDisplay } from "@/components/duo-display"
import { PokedexScanner } from "@/components/pokedex-scanner"

export function HomeTab() {
  return (
    <div className="flex flex-col h-full">
      {/* Battle Arena - Top Half */}
      <DuoDisplay />

      {/* Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Scanner - Bottom Half */}
      <PokedexScanner />
    </div>
  )
}
