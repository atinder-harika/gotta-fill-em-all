"use client"

import { useRef, useEffect } from "react"
import { ChatMessage } from "./chat-message"

interface Message {
  id: string
  text: string
  sender: "ashly" | "system"
}

interface ChatAreaProps {
  messages: Message[]
}

export function ChatArea({ messages }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-3 flex flex-col gap-3"
      style={{
        backgroundImage: `url('/images/ground.jpeg')`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg.text} sender={msg.sender} />
      ))}
    </div>
  )
}
