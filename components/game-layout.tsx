"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, BookOpen, Settings, Plus, Send, Mic, MessageSquare, Upload } from "lucide-react"
import { PokedexTab } from "@/components/pokedex-tab"
import { SettingsTab } from "@/components/settings-tab"
import { BattleArena } from "@/components/battle-arena"
import { PokedexScanner } from "@/components/pokedex-scanner"
import { useGame } from "@/context/game-context"

export interface ChatMessage {
  id: string
  text: string
  sender: "ashly" | "user"
  isImportant?: boolean
}

export type GameMode = "landing" | "chat" | "voice" | "upload"

export function GameLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTab, setMenuTab] = useState<"pokedex" | "settings">("pokedex")
  const [activeMode, setActiveMode] = useState<GameMode>("landing")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])
  const [voiceBubbleText, setVoiceBubbleText] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const { xp, level, addXp, accent } = useGame()

  // Sync activeMode with hasInteracted
  useEffect(() => {
    if (activeMode === "chat") {
      setHasInteracted(true)
    } else {
      setHasInteracted(false)
    }
  }, [activeMode])

  // Initial greeting on mount
  useEffect(() => {
    const greetingText = "Hello fellow trainer! Ready to fill 'em all?"
    setVoiceBubbleText(greetingText)
    playVoiceResponse(greetingText)
    
    // Clear bubble after 8 seconds
    const timer = setTimeout(() => setVoiceBubbleText(""), 8000)
    return () => clearTimeout(timer)
  }, [])

  // Persist active mode
  useEffect(() => {
    const saved = localStorage.getItem("activeMode")
    if (saved && saved !== "landing") {
      setActiveMode(saved as GameMode)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("activeMode", activeMode)
  }, [activeMode])

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

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    
    if (!hasInteracted) setHasInteracted(true)
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), text: inputValue, sender: "user" }
    setMessages((prev) => [...prev, userMsg])
    
    // Update conversation history
    const newHistory = [...conversationHistory, { role: "user", content: inputValue }]
    setConversationHistory(newHistory)
    
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      // Call the chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          history: newHistory.slice(-10), // Keep last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status === "success") {
        const ashlyResponse = data.data.response
        
        // Check if response contains important info (numbers, codes)
        const isImportant = /\*\*Found:/.test(ashlyResponse) || 
                           /\d{4,}/.test(ashlyResponse)
        
        const ashlyMsg: ChatMessage = {
          id: crypto.randomUUID(),
          text: ashlyResponse,
          sender: "ashly",
          isImportant,
        }
        
        setMessages((prev) => [...prev, ashlyMsg])
        
        // Update conversation history with Ashly's response
        setConversationHistory((prev) => [...prev, { role: "assistant", content: ashlyResponse }])
        
        // Play voice response only in voice mode
        if (ashlyResponse && activeMode === "voice") {
          playVoiceResponse(ashlyResponse)
          setVoiceBubbleText(ashlyResponse)
        }
      } else {
        throw new Error(data.error?.message || "Chat API returned an error")
      }
    } catch (error) {
      console.error("Chat API error:", error)
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Oops! I'm having trouble connecting. Let me try again in a moment!",
        sender: "ashly",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const playVoiceResponse = async (text: string) => {
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 500), // Limit to first 500 chars for speed
          accent,
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play().catch(() => {
          console.log("Audio playback failed (user interaction may be required)")
        })
      }
    } catch (error) {
      console.error("Voice API error:", error)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }
    
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Sorry, voice recording isn't supported in your browser. Try Chrome or Edge!",
        sender: "ashly",
      }
      setMessages((prev) => [...prev, errorMsg])
      return
    }
    
    // Start recording
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      console.log('Voice recognition started')
      setIsRecording(true)
    }
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log('Transcript:', transcript)
      
      // Send transcript as a message with quotes to indicate voice mode
      setInputValue(transcript)
      
      // Simulate pressing send button
      setTimeout(() => {
        const userMsg: ChatMessage = { id: crypto.randomUUID(), text: `"${transcript}"`, sender: "user" }
        setMessages((prev) => [...prev, userMsg])
        
        const newHistory = [...conversationHistory, { role: "user", content: transcript }]
        setConversationHistory(newHistory)
        
        // Send to API and play voice response
        handleChatAPI(transcript, newHistory, true)
      }, 100)
    }
    
    recognition.onerror = (event: any) => {
      console.log('Recognition ended:', event.error)
      setIsRecording(false)
      
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Oops! I couldn't hear that clearly. Try again?",
        sender: "ashly",
      }
      setMessages((prev) => [...prev, errorMsg])
    }
    
    recognition.onend = () => {
      console.log('Voice recognition ended')
      setIsRecording(false)
    }
    
    recognitionRef.current = recognition
    recognition.start()
  }
  
  const handleChatAPI = async (message: string, history: Array<{ role: string; content: string }>, playVoice: boolean = false) => {
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
        }),
      })
      
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      
      const data = await response.json()
      
      if (data.status === "success") {
        const ashlyResponse = data.data.response
        const isImportant = /\*\*Found:/.test(ashlyResponse) || /\d{4,}/.test(ashlyResponse)
        
        const ashlyMsg: ChatMessage = {
          id: crypto.randomUUID(),
          text: playVoice ? `"${ashlyResponse}"` : ashlyResponse,
          sender: "ashly",
          isImportant,
        }
        
        setMessages((prev) => [...prev, ashlyMsg])
        setConversationHistory((prev) => [...prev, { role: "assistant", content: ashlyResponse }])
        
        // Play voice response if requested (from voice recording)
        if (ashlyResponse && playVoice) {
          playVoiceResponse(ashlyResponse)
          setVoiceBubbleText(ashlyResponse)
        }
      } else {
        throw new Error(data.error?.message || "Chat API returned an error")
      }
    } catch (error) {
      console.error("Chat API error:", error)
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Oops! I'm having trouble connecting. Let me try again in a moment!",
        sender: "ashly",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
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
      {/* Single Scrolling Background - scenery.png */}
      <motion.div 
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={() => hasInteracted && setActiveMode("landing")}
      >
        <motion.div
          className="absolute w-full h-[200vh] pixel-art"
          style={{ 
            backgroundImage: `url('/images/scenery.png')`,
            backgroundSize: "100% auto",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top center",
            left: 0,
            right: 0,
          }}
          animate={{ 
            y: hasInteracted ? "-22.2%" : "0%"
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
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
          {/* Voice Bubble - Appears on right side for important info or voice mode */}
          <AnimatePresence>
            {((latestAshlyMessage?.isImportant && activeMode !== "voice") || (voiceBubbleText && activeMode === "voice")) && (
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
                      {activeMode === "voice" ? voiceBubbleText.slice(0, 60) : latestAshlyMessage?.text.slice(0, 60)}...
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

      {/* Chat Area - No background, uses scenery.png */}
      <AnimatePresence>
        {hasInteracted && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute bottom-[72px] left-0 right-0 h-[40%] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Above everything */}
            <button
              onClick={() => setActiveMode("landing")}
              className="nes-btn is-error !p-1 !m-0"
              style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 999 }}
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Chat messages overlay */}
            <div
              ref={chatRef}
              className="absolute inset-0 overflow-y-auto px-4 py-12 pb-3 nes-scrollbar"
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
                        <p className="text-[10px] font-mono leading-relaxed break-words">{msg.text}</p>
                      </div>
                    ) : (
                      <div className="nes-container is-dark is-rounded max-w-[85%] !p-2 !border-2">
                        <p className="text-[10px] font-mono leading-relaxed break-words">{msg.text}</p>
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
          {/* Plus Button - Upload Document */}
          <motion.button
            onClick={() => setShowScanner(true)}
            className="nes-btn is-warning animate-float"
            style={{ animationDelay: "0.2s" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Upload document"
          >
            <Plus className="w-5 h-5" />
          </motion.button>

          {/* Chat Input - Chat Mode */}
          <motion.div 
            onClick={() => activeMode !== "chat" && setActiveMode("chat")}
            className={`cursor-pointer animate-float-slow`}
            style={{ animationDelay: "0.4s" }}
            layout
            animate={{
              width: activeMode === "chat" ? "240px" : "auto",
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              {activeMode === "chat" ? (
                <motion.div 
                  key="textarea"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="relative w-full"
                >
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={isLoading ? "Ashly is thinking..." : "Ask Ashly..."}
                    disabled={isLoading}
                    className="nes-input is-dark w-full !py-2 !pr-12 !pl-3 !text-[10px] !border-2 resize-none disabled:opacity-50"
                    rows={2}
                    autoFocus
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="nes-btn is-success !p-1 !m-0 disabled:opacity-50"
                    style={{ position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)' }}
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="nes-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Open chat"
                >
                  <MessageSquare className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mic Button - Voice Recording with Melody Bars */}
          <motion.div
            onClick={toggleRecording}
            className="cursor-pointer"
            layout
            animate={{
              width: isRecording ? "240px" : "auto",
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="melody-bars"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="nes-btn is-error w-full h-[52px] px-3"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-full"
                      style={{ width: '6px' }}
                      animate={{
                        height: ["8px", "28px", "8px"],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.button
                  key="mic-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="nes-btn animate-float"
                  style={{ animationDelay: "0.6s" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Start voice recording"
                >
                  <Mic className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
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
                    aria-label="Close menu"
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
