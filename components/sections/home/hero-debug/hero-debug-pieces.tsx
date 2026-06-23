// Donde: panel debug del hero en home. 
// Viewports: desktop localhost. 
// Funcion: muestra resumen y candidatos del ranking.
import { Code2, X } from "lucide-react";
import type { RankedCandidate } from "@/lib/ranker";

export function HeroDebugHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-500">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-green-400" />
        <span className="font-bold">Debug: Hero Ranking</span>
      </div>
      <button onClick={onClose} className="text-green-400 hover:text-green-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SelectedHeroDebugSummary({ heroReason }: { heroReason: string }) {
  return (
    <div className="mb-4 p-2 bg-green-900/20 border border-green-700 rounded">
      <div className="text-green-400 font-bold mb-1">Hero seleccionado:</div>
      <div className="text-gray-300">{heroReason}</div>
    </div>
  );
}

export function HeroCandidateDebugCard({
  candidate,
  index,
}: {
  candidate: RankedCandidate;
  index: number;
}) {
  const item = candidate.item;

  return (
    <div
      className={`p-2 rounded border ${
        index === 0 ? "bg-green-900/40 border-green-600" : "bg-gray-900/40 border-gray-600"
      }`}
    >
      <div className="flex justify-between mb-1">
        <span className="font-bold">
          {index + 1}. {item.type.toUpperCase()}
        </span>
        <span className="text-green-400">{candidate.score} pts</span>
      </div>
      <div className="text-gray-400 text-[10px]">
        {item.type === "custom" && `ID: ${item.id}`}
        {item.type === "prayer" && `Phase: ${item.phase}`}
        {item.type === "event" && `Date: ${new Date(item.date).toLocaleString()}`}
        {item.type === "social" && `Network: ${item.network}`}
      </div>
    </div>
  );
}
