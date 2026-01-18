"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useGame } from "@/context/game-context"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Sparkles, Check } from "lucide-react"

interface PokedexScannerProps {
  onCapture?: () => void
}

export function PokedexScanner({ onCapture }: PokedexScannerProps) {
  const { addXp, addDocument } = useGame()
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedFile, setScannedFile] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const processFile = (file: File) => {
    setScannedFile(file.name)
    setIsScanning(true)

    setTimeout(() => {
      setIsScanning(false)
      const fileType = file.type.includes("pdf")
        ? "pdf"
        : file.type.includes("text") || file.name.endsWith(".txt")
          ? "text"
          : "image"
      addDocument({
        name: file.name,
        type: fileType,
        extractedData: {
          "Sample Field": "Sample Value",
        },
      })
      addXp(10)

      setTimeout(() => {
        setScannedFile(null)
        onCapture?.()
      }, 1500)
    }, 2000)
  }

  return (
    <motion.div
      className={`relative h-full min-h-[200px] border-4 border-dashed transition-colors ${
        isDragging
          ? "border-[#f7d51d] bg-[#f7d51d]/10"
          : isScanning
            ? "border-[#209cee]/50 bg-[#209cee]/5"
            : "border-[#212529] bg-[#f8f9fa]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{ scale: isDragging ? 1.02 : 1 }}
    >
      {/* Scanning overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#209cee]/20 via-transparent to-[#209cee]/20 animate-scan" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-[#209cee] mx-auto mb-2 animate-spin" />
                <p className="text-[12px] font-mono text-[#209cee] font-bold">SCANNING...</p>
                <p className="text-[10px] text-[#212529]">{scannedFile}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {scannedFile && !isScanning && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-[#f8f9fa]/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                <Check className="w-12 h-12 text-[#92cc41] mx-auto mb-2" />
              </motion.div>
              <p className="text-[12px] font-mono text-[#92cc41] font-bold">CAPTURED!</p>
              <p className="text-[10px] text-[#f7d51d] font-bold">+10 XP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default state */}
      {!isScanning && !scannedFile && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <div className="nes-container is-rounded !p-3 !border-2 mb-3">
            <Upload className="w-8 h-8 text-[#212529]" />
          </div>
          <p className="text-[12px] font-mono text-[#212529] text-center mb-1 font-bold">
            Drop document to capture
          </p>
          <p className="text-[10px] text-gray-500 text-center mb-3">
            PDF, Images, TXT accepted
          </p>
          <label>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,image/*,.txt,text/plain" 
              onChange={handleFileSelect} 
            />
            <span className="nes-btn is-primary !text-[10px] cursor-pointer">
              <FileText className="w-4 h-4 inline mr-1" />
              BROWSE FILES
            </span>
          </label>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 border-4 border-[#f7d51d] pointer-events-none animate-pulse" />
      )}
    </motion.div>
  )
}
