"use client"

import type React from "react"
import { useState } from "react"
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
  const [showSuccess, setShowSuccess] = useState(false)

  const processFile = async (file: File) => {
    console.log("Processing file:", file.name, file.type, file.size);
    setScannedFile(file.name)
    setIsScanning(true)
    setShowSuccess(false)

    try {
      // Read file content
      console.log("Reading file content...");
      const fileContent = await readFileContent(file)
      console.log("File content read, length:", fileContent.length);
      
      // Upload to RAG
      console.log("Uploading to RAG...");
      const response = await fetch("/api/rag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: fileContent,
          filename: file.name,
        }),
      })

      console.log("Upload response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error("Upload failed")
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      // Scanning animation for 2 seconds
      setTimeout(() => {
        setIsScanning(false)
        setShowSuccess(true)
        
        // Determine file type
        const fileType = file.type.includes("pdf")
          ? "pdf"
          : file.type.includes("text") || file.name.endsWith(".txt")
            ? "text"
            : "image"
        
        console.log("Adding to Pokedex, file type:", fileType);
        
        // Add document to Pokedex
        addDocument({
          name: file.name,
          type: fileType,
          extractedData: {
            "File Size": `${(file.size / 1024).toFixed(1)} KB`,
            "Type": fileType.toUpperCase(),
          },
        })
        
        // Add XP
        addXp(10)
        console.log("Added 10 XP");

        // Show success for 2.5 seconds then close
        setTimeout(() => {
          setScannedFile(null)
          setShowSuccess(false)
          onCapture?.()
        }, 2500)
      }, 2000)
    } catch (error) {
      console.error("File upload failed:", error)
      setIsScanning(false)
      setScannedFile(null)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File select triggered!", e.target.files);
    const files = e.target.files
    if (files && files.length > 0) {
      console.log("File selected:", files[0].name);
      processFile(files[0])
    } else {
      console.log("No files selected");
    }
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
        {showSuccess && (
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
