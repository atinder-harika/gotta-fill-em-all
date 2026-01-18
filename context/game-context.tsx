"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type EvolutionStage = "egg" | "mouse" | "beaver"

export interface Document {
  id: string
  name: string
  type: "pdf" | "image" | "text"
  date: string
  extractedData?: Record<string, string>
}

interface GameContextType {
  xp: number
  level: number
  evolutionStage: EvolutionStage
  documents: Document[]
  trainerName: string
  accent: "canadian" | "indian" | "filipino"
  speakingSpeed: number
  highContrastMode: boolean
  addXp: (amount: number) => void
  addDocument: (doc: Omit<Document, "id" | "date">) => void
  setTrainerName: (name: string) => void
  setAccent: (accent: "canadian" | "indian" | "filipino") => void
  setSpeakingSpeed: (speed: number) => void
  setHighContrastMode: (enabled: boolean) => void
  resetQuest: () => void
  isEvolving: boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

const STORAGE_KEY = "pokedex-game-state"

interface StoredState {
  xp: number
  level: number
  evolutionStage: EvolutionStage
  documents: Document[]
  trainerName: string
  accent: "canadian" | "indian" | "filipino"
  speakingSpeed: number
  highContrastMode: boolean
}

const defaultState: StoredState = {
  xp: 0,
  level: 1,
  evolutionStage: "egg",
  documents: [],
  trainerName: "Trainer",
  accent: "canadian",
  speakingSpeed: 1,
  highContrastMode: false,
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(defaultState)
  const [isEvolving, setIsEvolving] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setState(JSON.parse(stored))
      } catch {
        setState(defaultState)
      }
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isHydrated])

  const getEvolutionStage = (xp: number): EvolutionStage => {
    if (xp >= 100) return "beaver"
    if (xp >= 50) return "mouse"
    return "egg"
  }

  const addXp = useCallback((amount: number) => {
    setState((prev) => {
      const newXp = prev.xp + amount
      const newStage = getEvolutionStage(newXp)
      const newLevel = Math.floor(newXp / 25) + 1

      if (newStage !== prev.evolutionStage) {
        setIsEvolving(true)
        const audio = new Audio("/sounds/coin.mp3")
        audio.play().catch(() => {})
        setTimeout(() => setIsEvolving(false), 1500)
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        evolutionStage: newStage,
      }
    })
  }, [])

  const addDocument = useCallback((doc: Omit<Document, "id" | "date">) => {
    setState((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          ...doc,
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
        },
      ],
    }))
  }, [])

  const setTrainerName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, trainerName: name }))
  }, [])

  const setAccent = useCallback((accent: "canadian" | "indian" | "filipino") => {
    setState((prev) => ({ ...prev, accent }))
  }, [])

  const setSpeakingSpeed = useCallback((speakingSpeed: number) => {
    setState((prev) => ({ ...prev, speakingSpeed }))
  }, [])

  const setHighContrastMode = useCallback((highContrastMode: boolean) => {
    setState((prev) => ({ ...prev, highContrastMode }))
  }, [])

  const resetQuest = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <GameContext.Provider
      value={{
        ...state,
        addXp,
        addDocument,
        setTrainerName,
        setAccent,
        setSpeakingSpeed,
        setHighContrastMode,
        resetQuest,
        isEvolving,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
