"use client"

import { useGame } from "@/context/game-context"
import { X, Volume2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    trainerName,
    setTrainerName,
    accent,
    setAccent,
    speakingSpeed,
    setSpeakingSpeed,
    highContrastMode,
    setHighContrastMode,
    resetQuest,
  } = useGame()

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 bg-metallic-dark/95 z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-4 border-metallic-light">
        <h2 className="font-[var(--font-pixel)] text-[12px] text-neon-green">SETTINGS</h2>
        <button
          onClick={onClose}
          className="p-2 border-2 border-metallic-light hover:border-neon-green transition-colors"
          aria-label="Close settings"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Trainer Name */}
        <div className="flex flex-col gap-2">
          <label className="font-[var(--font-pixel)] text-[8px] text-neon-green">TRAINER NAME</label>
          <input
            type="text"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
            className="px-3 py-2 bg-metallic border-2 border-metallic-light font-[var(--font-pixel)] text-[10px] text-foreground focus:outline-none focus:border-neon-green"
          />
        </div>

        {/* Voice Accent */}
        <div className="flex flex-col gap-2">
          <label className="font-[var(--font-pixel)] text-[8px] text-neon-green">VOICE ACCENT</label>
          <div className="flex flex-col gap-2">
            {(["canadian", "indian", "filipino"] as const).map((acc) => (
              <button
                key={acc}
                onClick={() => setAccent(acc)}
                className={`px-3 py-2 border-2 font-[var(--font-pixel)] text-[10px] transition-colors ${
                  accent === acc
                    ? "bg-neon-green border-neon-green text-metallic-dark"
                    : "bg-metallic border-metallic-light text-foreground hover:border-neon-green"
                }`}
              >
                {acc.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Speaking Speed */}
        <div className="flex flex-col gap-2">
          <label className="font-[var(--font-pixel)] text-[8px] text-neon-green flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            SPEED: {speakingSpeed.toFixed(1)}x
          </label>
          <Slider
            value={[speakingSpeed]}
            onValueChange={([val]) => setSpeakingSpeed(val)}
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <label className="font-[var(--font-pixel)] text-[8px] text-neon-green">HIGH CONTRAST</label>
          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`w-12 h-6 border-2 transition-colors relative ${
              highContrastMode ? "bg-neon-green border-neon-green" : "bg-metallic border-metallic-light"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-foreground transition-transform ${
                highContrastMode ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Reset Quest */}
        <button
          onClick={resetQuest}
          className="mt-auto px-4 py-3 bg-destructive border-2 border-destructive font-[var(--font-pixel)] text-[10px] text-destructive-foreground hover:opacity-80 transition-opacity"
        >
          RESET QUEST
        </button>
      </div>
    </div>
  )
}
