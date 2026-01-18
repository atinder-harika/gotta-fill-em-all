"use client"

import { useGame } from "@/context/game-context"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function XpBar({ compact = false }: { compact?: boolean }) {
  const { xp, level, evolutionStage } = useGame()

  const getProgress = () => {
    if (xp >= 100) return 100
    if (xp >= 50) return ((xp - 50) / 50) * 100
    return (xp / 50) * 100
  }

  const getNextMilestone = () => {
    if (xp >= 100) return "MAX"
    if (xp >= 50) return "100"
    return "50"
  }

  const stageEmoji = {
    egg: "EGG",
    mouse: "MOUSE",
    beaver: "BEAVER",
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-mono text-[#f7d51d] font-bold">{stageEmoji[evolutionStage]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] font-mono text-[#f7d51d] font-bold">LVL {level}</span>
            <span className="text-[8px] font-mono text-white">
              {xp}/{getNextMilestone()}
            </span>
          </div>
          <div className="relative h-2 bg-[#212529] border-2 border-white overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#f7d51d]"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Full version with NES styling
  return (
    <div className="nes-container is-dark is-rounded !p-3 !border-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#f7d51d] font-bold">{stageEmoji[evolutionStage]}</span>
          <span className="text-[10px] font-mono text-[#f7d51d] font-bold">LVL {level}</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#f7d51d]" />
          <span className="text-[10px] font-mono text-white">
            {xp} / {getNextMilestone()}
          </span>
        </div>
      </div>

      <div className="relative h-4 bg-[#212529] border-2 border-white overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#f7d51d]"
          initial={{ width: 0 }}
          animate={{ width: `${getProgress()}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      </div>
    </div>
  )
}
