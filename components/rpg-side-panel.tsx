"use client"

import { useState, useCallback } from "react"
import { XpHeader } from "./xp-header"
import { BattleArena } from "./battle-arena"
import { ChatArea } from "./chat-area"
import { ControlDeck } from "./control-deck"
import { SettingsPanel } from "./settings-panel"
import { useGame } from "@/context/game-context"

interface Message {
  id: string
  text: string
  sender: "ashly" | "system"
}

export function RpgSidePanel() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hey there, Trainer! Ready to fill some forms today?", sender: "ashly" },
    { id: "2", text: "+10 XP for logging in!", sender: "system" },
  ])
  const { addXp } = useGame()

  const handleSend = useCallback(
    (message: string) => {
      // Add user command as system message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `> ${message}`,
          sender: "system",
        },
      ])

      // Simulate Ashly response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: "Got it! Let me help you with that form field!",
            sender: "ashly",
          },
        ])
        addXp(5)
      }, 500)
    },
    [addXp],
  )

  const handleVoice = useCallback(() => {
    setIsListening((prev) => !prev)

    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: "Voice command received!",
            sender: "system",
          },
        ])
      }, 2000)
    }
  }, [isListening])

  return (
    <div className="w-[400px] h-[600px] bg-metallic-dark flex flex-col relative overflow-hidden border-4 border-metallic-light">
      {/* Settings Overlay */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Header with XP Bar */}
      <XpHeader onMenuClick={() => setSettingsOpen(true)} />

      {/* Battle Arena */}
      <BattleArena />

      {/* Chat/Action Area */}
      <ChatArea messages={messages} />

      {/* Control Deck */}
      <ControlDeck onSend={handleSend} onVoice={handleVoice} isListening={isListening} />
    </div>
  )
}
