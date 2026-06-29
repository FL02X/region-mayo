"use client"

// Donde: home con ?debug=hero-ranking en localhost. 
// Viewports: desktop. 
// Funcion: inspecciona por que se eligio el hero.
import { useEffect, useState } from "react"
import type { RankedCandidate } from "@/lib/ranker"
import {
  HeroCandidateDebugCard,
  HeroDebugHeader,
  SelectedHeroDebugSummary,
} from "@/components/sections/home/hero-debug/hero-debug-pieces"

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
      <HeroDebugHeader onClose={() => setIsVisible(false)} />
      <SelectedHeroDebugSummary heroReason={debugData.heroReason} />

      <div className="mb-4">
        <div className="text-green-400 font-bold mb-2">Candidatos:</div>
        <div className="space-y-2">
          {debugData.allCandidates.map((candidate, idx) => (
            <HeroCandidateDebugCard
              key={`${candidate.item.type}-${candidate.item.id}`}
              candidate={candidate}
              index={idx}
            />
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
