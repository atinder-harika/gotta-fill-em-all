"use client"

import { useGame } from "@/context/game-context"
import { Menu } from "lucide-react"

interface XpHeaderProps {
  onMenuClick: () => void
}

export function XpHeader({ onMenuClick }: XpHeaderProps) {
  const { xp, level } = useGame()

  // Calculate XP percentage (max 150 for full evolution)
  const xpPercentage = Math.min((xp / 150) * 100, 100)

  return (
    <div className="flex items-center gap-3 p-3 bg-metallic-dark border-b-4 border-metallic-light">
      {/* Hamburger Menu */}
      <button
        onClick={onMenuClick}
        className="p-2 border-2 border-metallic-light bg-metallic hover:bg-metallic-light transition-colors"
        aria-label="Settings menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* XP Bar Container */}
      <div className="flex-1 flex items-center gap-2">
        <span 
          className="font-[var(--font-pixel)] text-base text-neon-green whitespace-nowrap font-bold"
          style={{ 
            textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000"
          }}
        >
          LV{level}
        </span>

        <div className="flex-1 h-8 bg-metallic border-2 border-metallic-light relative overflow-hidden">
          {/* XP Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-neon-green animate-pulse-green transition-all duration-500"
            style={{ width: `${xpPercentage}%` }}
          />

          {/* XP Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="font-[var(--font-pixel)] text-base text-white font-bold"
              style={{ 
                textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000"
              }}
            >
              EXP {xp}/150
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
