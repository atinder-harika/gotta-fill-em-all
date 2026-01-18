"use client"

import { useGame } from "@/context/game-context"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function DuoDisplay() {
  const { evolutionStage, isEvolving } = useGame()

  const creatureNames = {
    egg: "Pik-A-Boo (Egg)",
    mouse: "Pik-A-Boo",
    beaver: "Pik-A-Boo (Evolved)",
  }

  return (
    <div className="relative flex-1 flex items-center justify-center gap-6 p-4">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/sky.jpeg')" }}
      />
      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Ashly - The Trainer with pixel art */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <motion.div
            className="w-52 h-52 relative"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Image
              src="/images/ashly.png"
              alt="Ashly the trainer"
              width={208}
              height={208}
              className="object-contain"
              style={{ 
                imageRendering: "pixelated",
                filter: "drop-shadow(2px 0 0 #000) drop-shadow(-2px 0 0 #000) drop-shadow(0 2px 0 #000) drop-shadow(0 -2px 0 #000)"
              }}
            />
          </motion.div>
        </div>
        <div className="mt-2 px-2 py-1 bg-card/90 rounded border border-border backdrop-blur-sm">
          <p className="text-xs font-mono text-primary font-bold">ASHLY</p>
          <p className="text-[10px] text-muted-foreground">Trainer</p>
        </div>
      </motion.div>

      {/* VS Indicator */}
      <motion.div
        className="relative z-10 text-primary font-bold text-lg font-mono drop-shadow-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        ⚡
      </motion.div>

      {/* Pik-A-Boo - The Creature with pixel art */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={evolutionStage}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
          <motion.div
            className={`w-52 h-52 relative ${isEvolving ? "animate-evolution" : ""}`}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
          >
            <Image
              src="/images/pikaboo.png"
              alt="Pik-A-Boo"
              width={208}
              height={208}
              className="object-contain"
              style={{ 
                imageRendering: "pixelated",
                filter: "drop-shadow(2px 0 0 #000) drop-shadow(-2px 0 0 #000) drop-shadow(0 2px 0 #000) drop-shadow(0 -2px 0 #000)"
              }}
            />
            </motion.div>
            {/* Evolution flash effect */}
            {isEvolving && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-2 px-2 py-1 bg-card/90 rounded border border-border backdrop-blur-sm">
          <p className="text-xs font-mono text-primary font-bold">PIK-A-BOO</p>
          <p className="text-[10px] text-muted-foreground">{creatureNames[evolutionStage]}</p>
        </div>
      </motion.div>
    </div>
  )
}
