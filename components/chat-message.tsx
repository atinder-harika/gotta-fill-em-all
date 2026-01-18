"use client"

interface ChatMessageProps {
  message: string
  sender: "ashly" | "system"
}

export function ChatMessage({ message, sender }: ChatMessageProps) {
  if (sender === "ashly") {
    return (
      <div className="relative px-6 py-4 min-h-[60px] flex items-center voice-bubble">
        <p className="font-[var(--font-pixel)] text-xs font-bold leading-relaxed text-gray-800">{message}</p>
      </div>
    )
  }

  // System messages
  return (
    <div className="px-3 py-2 bg-black/40 border-2 border-neon-green">
      <p className="font-[var(--font-pixel)] text-sm font-bold leading-relaxed text-neon-green">{message}</p>
    </div>
  )
}
