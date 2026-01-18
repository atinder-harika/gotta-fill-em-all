"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { RefObject } from "react"
import { X } from "lucide-react"
import { PokedexScanner } from "@/components/pokedex-scanner"
import type { ChatMessage } from "@/components/game-layout"

interface BattleArenaProps {
  latestMessage?: string
  chatRef: RefObject<HTMLDivElement | null>
  messages: ChatMessage[]
  showScanner: boolean
  setShowScanner: (show: boolean) => void
}

export function BattleArena({ showScanner, setShowScanner }: BattleArenaProps) {
  return (
    <AnimatePresence>
      {showScanner && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowScanner(false)}
        >
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="w-full h-full max-w-lg max-h-96 flex flex-col nes-container !p-0 !border-4">
              <div className="flex items-center justify-between p-3 bg-[#212529] border-b-4 border-[#212529]">
                <h3 className="text-xs font-mono font-bold text-[#f7d51d]">DOCUMENT SCANNER</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="nes-btn !p-1 !m-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
                <div className="flex-1 p-3 bg-[#f8f9fa] overflow-auto">
                  <PokedexScanner onCapture={() => setShowScanner(false)} />
                </div>
              </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
