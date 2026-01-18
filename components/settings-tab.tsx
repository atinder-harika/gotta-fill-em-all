"use client"

import { useGame } from "@/context/game-context"
import { useUser, useClerk } from "@clerk/nextjs"
import { User, Volume2, Palette, LogOut } from "lucide-react"

export function SettingsTab() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const {
    trainerName,
    accent,
    speakingSpeed,
    highContrastMode,
    setTrainerName,
    setAccent,
    setSpeakingSpeed,
    setHighContrastMode,
    resetQuest,
  } = useGame()

  const displayName = user?.firstName || user?.username || trainerName
  const userEmail = user?.primaryEmailAddress?.emailAddress

  return (
    <div className="h-full overflow-y-auto p-3 nes-scrollbar">
      <div className="space-y-4">
        {/* Trainer Profile */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#209cee]" />
            <h3 className="text-[10px] font-mono font-bold text-[#212529]">TRAINER PROFILE</h3>
          </div>
          <div className="nes-container is-rounded !p-3 !border-2 space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#209cee] flex items-center justify-center text-white text-xl font-bold border-2 border-[#212529] overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-mono font-bold text-[#212529]">{displayName}</p>
                {userEmail && <p className="text-[8px] text-gray-500">{userEmail}</p>}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-gray-500">TRAINER NAME</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder={displayName}
                className="nes-input w-full !py-1 !px-2 !text-[10px] !border-2"
              />
            </div>
          </div>
        </section>

        {/* Voice Settings */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#92cc41]" />
            <h3 className="text-[10px] font-mono font-bold text-[#212529]">VOICE SETTINGS</h3>
          </div>
          <div className="nes-container is-rounded !p-3 !border-2 space-y-3">
            {/* Accent */}
            <div className="space-y-1">
              <label className="text-[8px] font-mono text-gray-500">ASHLY&apos;S ACCENT</label>
              <div className="flex gap-1 flex-wrap">
                {[
                  { value: "canadian", label: "CA" },
                  { value: "indian", label: "IN" },
                  { value: "filipino", label: "PH" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAccent(opt.value as typeof accent)}
                    className={`nes-btn !text-[8px] !py-1 !px-2 !m-0 ${
                      accent === opt.value ? "is-primary" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[8px] font-mono text-gray-500">SPEED</label>
                <span className="text-[8px] font-mono text-[#f7d51d] font-bold">{speakingSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speakingSpeed}
                onChange={(e) => setSpeakingSpeed(parseFloat(e.target.value))}
                className="w-full h-4 accent-[#f7d51d]"
              />
              <div className="flex justify-between text-[8px] text-gray-500">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#f7d51d]" />
            <h3 className="text-[10px] font-mono font-bold text-[#212529]">ACCESSIBILITY</h3>
          </div>
          <div className="nes-container is-rounded !p-3 !border-2 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-[#212529]">High Contrast</p>
              </div>
              <button
                onClick={() => setHighContrastMode(!highContrastMode)}
                className={`nes-btn !text-[8px] !py-1 !px-2 !m-0 ${
                  highContrastMode ? "is-success" : ""
                }`}
              >
                {highContrastMode ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </section>

        {/* Reset Quest */}
        <button 
          className="nes-btn is-warning w-full !text-[10px]" 
          onClick={resetQuest}
        >
          RESET QUEST
        </button>

        {/* Logout */}
        <button 
          className="nes-btn is-error w-full !text-[10px]" 
          onClick={() => signOut()}
        >
          <LogOut className="w-3 h-3 inline mr-1" />
          LOGOUT
        </button>
      </div>
    </div>
  )
}
