"use client"

// Donde: home con ?debug=hero-ranking en localhost. Viewports: desktop. Funcion: inspecciona por que se eligio el hero.
import { useEffect, useState } from "react"
import { Code2, X } from "lucide-react"
import type { RankedCandidate } from "@/lib/ranker"

export function HeroDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [debugData, setDebugData] = useState<{
    allCandidates: RankedCandidate[]
    heroReason: string
  } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"

    if (!isLocalhost) return

    const params = new URLSearchParams(window.location.search)
    if (params.get("debug") === "hero-ranking") {
      setIsVisible(true)

      // El ranking publica este evento solo en debug para no cargar estado extra en la home normal.
      const handleMessage = (event: CustomEvent) => {
        setDebugData(event.detail)
      }

      window.addEventListener("hero-ranking-debug" as any, handleMessage)

      return () => {
        window.removeEventListener("hero-ranking-debug" as any, handleMessage)
      }
    }
  }, [])

  if (!isVisible || !debugData) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-black/95 text-white rounded-lg border border-green-500 p-4 font-mono text-xs overflow-y-auto">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-500">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-green-400" />
          <span className="font-bold">Debug: Hero Ranking</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-green-400 hover:text-green-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 p-2 bg-green-900/20 border border-green-700 rounded">
        <div className="text-green-400 font-bold mb-1">Hero seleccionado:</div>
        <div className="text-gray-300">{debugData.heroReason}</div>
      </div>

      <div className="mb-4">
        <div className="text-green-400 font-bold mb-2">Candidatos:</div>
        <div className="space-y-2">
          {debugData.allCandidates.map((candidate, idx) => (
            <div
              key={`${candidate.item.type}-${candidate.item.id}`}
              className={`p-2 rounded border ${
                idx === 0
                  ? "bg-green-900/40 border-green-600"
                  : "bg-gray-900/40 border-gray-600"
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold">
                  {idx + 1}. {candidate.item.type.toUpperCase()}
                </span>
                <span className="text-green-400">{candidate.score} pts</span>
              </div>
              <div className="text-gray-400 text-[10px]">
                {candidate.item.type === "custom" && `ID: ${candidate.item.id}`}
                {candidate.item.type === "prayer" && `Phase: ${candidate.item.phase}`}
                {candidate.item.type === "event" && `Date: ${new Date(candidate.item.date).toLocaleString()}`}
                {candidate.item.type === "social" && `Network: ${candidate.item.network}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-gray-500 text-[10px] mt-4">
        <div className="border-t border-gray-600 pt-2">
          Tip: recarga la pagina para actualizar el ranking.
        </div>
      </div>
    </div>
  )
}
