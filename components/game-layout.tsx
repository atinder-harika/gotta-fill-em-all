"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, BookOpen, Settings, Plus, Send, Mic } from "lucide-react"
import { PokedexTab } from "@/components/pokedex-tab"
import { SettingsTab } from "@/components/settings-tab"
import { BattleArena } from "@/components/battle-arena"
import { useGame } from "@/context/game-context"

export interface ChatMessage {
  id: string
  text: string
  sender: "ashly" | "user"
  isImportant?: boolean
}

export function GameLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTab, setMenuTab] = useState<"pokedex" | "settings">("pokedex")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hey there, Trainer! I'm Ashly, your guide. Drop a document or ask me anything!",
      sender: "ashly",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const { xp, level, addXp } = useGame()

  // Listen for extension messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "FIELD_FILLED") {
        addXp(10)
        const audio = new Audio("/coin.mp3")
        audio.play().catch(() => {})
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [addXp])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    if (!hasInteracted) setHasInteracted(true)
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), text: inputValue, sender: "user" }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")

    // Simulate Ashly response with important info detection
    setTimeout(() => {
      const isImportantQuery = inputValue.toLowerCase().includes("uci") || 
                               inputValue.toLowerCase().includes("dli") ||
                               inputValue.toLowerCase().includes("number")
      const ashlyMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: isImportantQuery 
          ? "Your UCI Number is: 1234-5678-9012. I've highlighted it for you!"
          : "Got it! Let me help you with that. You can also drop a document using the + button!",
        sender: "ashly",
        isImportant: isImportantQuery,
      }
      setMessages((prev) => [...prev, ashlyMsg])
    }, 1000)
  }

  const toggleMic = () => {
    if (!hasInteracted) setHasInteracted(true)
    
    setIsListening((prev) => !prev)
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        const ashlyMsg: ChatMessage = {
          id: crypto.randomUUID(),
          text: "I heard you! Voice commands are ready for the demo.",
          sender: "ashly",
        }
        setMessages((prev) => [...prev, ashlyMsg])
      }, 2000)
    }
  }

  // Get latest Ashly message for voice bubble
  const latestAshlyMessage = [...messages].reverse().find((m) => m.sender === "ashly")

  // XP Progress calculation
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

  return (
    <div className="relative w-full max-w-[420px] mx-auto h-screen overflow-hidden">
      {/* Full Screen Background Container */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        animate={{ y: hasInteracted ? "-25%" : "0%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Sky Background - Full height */}
        <div
          className="absolute top-0 left-0 right-0 h-full bg-cover bg-center pixel-art"
          style={{ backgroundImage: `url('/images/sky.png')` }}
        />
        
        {/* Ground Background - Positioned at bottom, extends down */}
        <div
          className="absolute left-0 right-0 bg-repeat-x bg-top pixel-art"
          style={{
            backgroundImage: `url('/images/ground.png')`,
            backgroundSize: "auto 100%",
            top: "100%",
            height: "60vh",
          }}
        />
      </motion.div>

      {/* Characters Container - Moves with parallax */}
      <motion.div 
        className="absolute left-0 right-0 z-10 flex items-end justify-center"
        style={{ bottom: "10%" }}
        animate={{ 
          bottom: hasInteracted ? "48%" : "10%",
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Ashly - Large (Trainer) */}
        <motion.div
          className="relative"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          {/* Voice Bubble - Appears on right side for important info */}
          <AnimatePresence>
            {latestAshlyMessage?.isImportant && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="absolute -right-[140px] -top-[20px] w-[150px] z-30"
              >
                <div className="relative">
                  <img
                    src="/images/voice-bubble.png"
                    alt=""
                    className="w-full h-auto pixel-art"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-3 pb-5">
                    <p className="text-[8px] font-mono text-gray-800 leading-tight text-center font-bold">
                      {latestAshlyMessage.text.slice(0, 60)}...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <img
            src="/images/ashly.png"
            alt="Ashly the Trainer"
            className="w-[220px] h-auto pixel-art"
            style={{
              filter: "drop-shadow(2px 0 0 #000) drop-shadow(-2px 0 0 #000) drop-shadow(0 2px 0 #000) drop-shadow(0 -2px 0 #000)"
            }}
          />
        </motion.div>

        {/* Pikaboo - Small (Pet) */}
        <motion.div
          className="relative -ml-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
        >
          <img
            src="/images/pikaboo.png"
            alt="Pik-A-Boo"
            className="w-[120px] h-auto pixel-art"
            style={{
              filter: "drop-shadow(2px 0 0 #000) drop-shadow(-2px 0 0 #000) drop-shadow(0 2px 0 #000) drop-shadow(0 -2px 0 #000)"
            }}
          />
        </motion.div>
      </motion.div>

      {/* Chat Area with Ground Background - Slides up from bottom */}
      <AnimatePresence>
        {hasInteracted && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute bottom-[72px] left-0 right-0 h-[40%] z-10"
          >
            {/* Ground texture background */}
            <div 
              className="absolute inset-0 bg-repeat pixel-art opacity-90"
              style={{ 
                backgroundImage: `url('/images/ground.png')`,
                backgroundSize: "cover",
              }}
            />
            
            {/* Chat messages overlay */}
            <div
              ref={chatRef}
              className="absolute inset-0 overflow-y-auto px-4 py-3 nes-scrollbar"
            >
              <div className="space-y-3">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ashly" ? (
                      <div className="nes-balloon from-left max-w-[85%]">
                        <p className="text-[10px] font-mono leading-relaxed">{msg.text}</p>
                      </div>
                    ) : (
                      <div className="nes-container is-dark is-rounded max-w-[85%] !p-2 !border-2">
                        <p className="text-[10px] font-mono leading-relaxed">{msg.text}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== FLOATING NES HUD ELEMENTS ====== */}
      
      {/* Top Left - Menu Button (Floating) */}
      <motion.button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 left-4 z-30 nes-btn animate-float-slow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </motion.button>

      {/* Top Center - XP Bar (Floating) */}
      <motion.div 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-float-slow"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="nes-container is-rounded !p-2 !border-2 bg-[#212529] min-w-[180px] nes-shadow">
          <div className="flex items-center justify-between mb-1">
            <span 
              className="text-xs font-mono text-[#f7d51d] font-bold"
              style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
            >
              LVL {level}
            </span>
            <span 
              className="text-xs font-mono text-white"
              style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}
            >
              {xp}/{getNextMilestone()}
            </span>
          </div>
          <div className="relative h-3 bg-[#212529] border-2 border-white overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#f7d51d]"
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ====== BOTTOM FLOATING CONTROLS ====== */}
      <div className="absolute bottom-4 left-0 right-0 z-30 px-4">
        <div className="flex items-center justify-center gap-3">
          {/* Plus Button (Floating) */}
          <motion.button
            onClick={() => setShowScanner(true)}
            className="nes-btn is-warning animate-float"
            style={{ animationDelay: "0.2s" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Add document"
          >
            <Plus className="w-5 h-5" />
          </motion.button>

          {/* Chat Input (Floating) */}
          <motion.div 
            className="flex-1 max-w-[200px] animate-float-slow"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask Ashly..."
                className="nes-input is-dark w-full !py-2 !px-3 !text-[10px] !border-2 resize-none"
                rows={2}
              />
              <button
                onClick={handleSend}
                className="absolute right-2 bottom-2 text-[#f7d51d] hover:text-white transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Mic Button (Floating) */}
          <motion.button
            onClick={toggleMic}
            className={`nes-btn animate-float ${isListening ? "is-error" : ""}`}
            style={{ animationDelay: "0.6s" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : ""}`} />
          </motion.button>
        </div>
      </div>

      {/* ====== MENU SIDEBAR ====== */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center p-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="w-full h-full flex flex-col nes-container !p-0 !border-4">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-3 bg-[#212529] border-b-4 border-[#212529]">
                  <h2 className="text-xs font-mono font-bold text-[#f7d51d]">MENU</h2>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="nes-btn !p-1 !m-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Menu Tabs */}
                <div className="flex border-b-4 border-[#212529]">
                  <button
                    onClick={() => setMenuTab("pokedex")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs transition-colors ${
                      menuTab === "pokedex"
                        ? "bg-[#f7d51d] text-[#212529]"
                        : "bg-[#f8f9fa] text-[#212529] hover:bg-[#e0e0e0]"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Pokedex
                  </button>
                  <button
                    onClick={() => setMenuTab("settings")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs transition-colors ${
                      menuTab === "settings"
                        ? "bg-[#f7d51d] text-[#212529]"
                        : "bg-[#f8f9fa] text-[#212529] hover:bg-[#e0e0e0]"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-hidden bg-[#f8f9fa]">
                {menuTab === "pokedex" ? <PokedexTab /> : <SettingsTab />}
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Document Scanner Modal */}
      <BattleArena
        latestMessage={latestAshlyMessage?.text}
        chatRef={chatRef}
        messages={messages}
        showScanner={showScanner}
        setShowScanner={setShowScanner}
      />
    </div>
  )
}
