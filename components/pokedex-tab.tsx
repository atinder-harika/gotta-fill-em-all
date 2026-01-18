"use client"

import { useGame, type Document } from "@/context/game-context"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, ImageIcon, FolderOpen, Calendar, ChevronRight } from "lucide-react"
import { useState } from "react"

export function PokedexTab() {
  const { documents } = useGame()
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  return (
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-[#92cc41]" />
        <h2 className="text-[10px] font-mono font-bold text-[#212529]">MY DOCUMENTS</h2>
        <span className="ml-auto text-[8px] font-mono text-gray-500">{documents.length} captured</span>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto nes-scrollbar">
        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-48 text-center"
            >
              <div className="nes-container is-rounded !p-4 !border-2 mb-3">
                <FolderOpen className="w-8 h-8 text-gray-400 mx-auto" />
              </div>
              <p className="text-[10px] font-mono text-[#212529] mb-1">No Documents Yet</p>
              <p className="text-[8px] font-mono text-gray-500">Use + to scan docs!</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full nes-container is-rounded !p-2 !border-2 flex items-center gap-2 hover:bg-gray-100 transition-colors text-left"
                >
                  {/* File Icon */}
                  <div
                    className={`w-8 h-8 flex items-center justify-center ${
                      doc.type === "pdf" ? "text-[#e76e55]" : "text-[#209cee]"
                    }`}
                  >
                    {doc.type === "pdf" ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-[#212529] truncate font-bold">{doc.name}</p>
                    <div className="flex items-center gap-1 text-[8px] text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(doc.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] z-50 nes-container !p-0 !border-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-2 bg-[#212529] border-b-4 border-[#212529]">
                <h3 className="text-[10px] font-mono font-bold text-[#f7d51d] truncate">{selectedDoc.name}</h3>
              </div>
              <div className="p-3 bg-[#f8f9fa]">
                <h4 className="text-[8px] font-mono text-gray-500 mb-2">EXTRACTED DATA</h4>
                {selectedDoc.extractedData ? (
                  <div className="space-y-1">
                    {Object.entries(selectedDoc.extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[10px] text-gray-500">{key}:</span>
                        <span className="text-[10px] font-mono text-[#209cee] font-bold">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">No data extracted</p>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="nes-btn is-primary w-full mt-3 !text-[8px]"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
