"use client"

import type React from "react"

import { useState } from "react"
import { Mic, Send } from "lucide-react"

interface ControlDeckProps {
  onSend: (message: string) => void
  onVoice: () => void
  isListening?: boolean
}

export function ControlDeck({ onSend, onVoice, isListening = false }: ControlDeckProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSend(input.trim())
      setInput("")
    }
  }

  return (
    <div className="p-3 bg-metallic-dark border-t-4 border-metallic-light">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type command..."
            className="w-full px-3 py-2 bg-metallic border-2 border-metallic-light font-[var(--font-pixel)] text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-green"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          className="p-2 bg-metallic border-2 border-metallic-light hover:bg-metallic-light hover:border-neon-green transition-colors"
          aria-label="Send message"
        >
          <Send className="w-5 h-5 text-neon-green" />
        </button>

        {/* Microphone Button */}
        <button
          type="button"
          onClick={onVoice}
          className={`p-2 border-2 transition-colors ${
            isListening
              ? "bg-neon-green border-neon-green animate-pulse-green"
              : "bg-metallic border-metallic-light hover:bg-metallic-light hover:border-neon-green"
          }`}
          aria-label="Voice input"
        >
          <Mic className={`w-5 h-5 ${isListening ? "text-metallic-dark" : "text-neon-green"}`} />
        </button>
      </form>
    </div>
  )
}
