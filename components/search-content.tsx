"use client";

import { useMemo, Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Music, UserCircle, Church, Calendar, Search } from "lucide-react";
import { highlightText, normalizeText, getNestedValue } from "@/lib/search-utils";
import type { Pastor, Coro, DirectivaMember, Templo, Event } from "@/lib/types";

interface SearchContentProps {
  data: {
    pastores: Pastor[];
    coros: Coro[];
    directiva: DirectivaMember[];
    templos: Templo[];
    eventos: Event[];
  };
}

type SearchResultType = "evento" | "templo" | "pastor" | "coro" | "directiva";

type SearchResultItem = {
  item: Record<string, any>;
  type: SearchResultType;
  label: string;
  pathPrefix: string;
  score: number;
};

const FILTER_ORDER: Array<{ key: SearchResultType | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "evento", label: "Eventos" },
  { key: "templo", label: "Templos" },
  { key: "pastor", label: "Pastores" },
  { key: "coro", label: "Coros" },
  { key: "directiva", label: "Directiva" },
];

const TYPE_PRIORITY: Record<SearchResultType, number> = {
  evento: 0,
  templo: 1,
  pastor: 2,
  coro: 3,
  directiva: 4,
};

function SearchContentInner({ data }: SearchContentProps) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(queryFromUrl);
  const [activeFilter, setActiveFilter] = useState<SearchResultType | "all">("all");

  useEffect(() => {
    setLocalQuery(queryFromUrl);
  }, [queryFromUrl]);

  // Global search function with relevance scoring
  const allResults = useMemo(() => {
    if (!localQuery.trim()) return [] as SearchResultItem[];

    const normQuery = normalizeText(localQuery);

    const scoreFieldMatch = (value: string, fieldIndex: number, isPrimaryField: boolean) => {
      const normValue = normalizeText(value);
      if (!normValue.includes(normQuery)) return 0;

      let score = 50;
      if (normValue === normQuery) score = 140;
      else if (normValue.startsWith(normQuery)) score = 100;
      else if (normValue.includes(` ${normQuery}`)) score = 80;

      // Earlier fields are more important in ranking.
      score += Math.max(0, 20 - fieldIndex * 4);
      if (isPrimaryField) score += 20;

      return score;
    };

    const searchMatches = <T extends Record<string, any>>(
      items: T[], 
      fields: string[], 
      type: SearchResultType,
      label: string,
      pathPrefix: string,
      primaryField: string,
    ) => {
      return items
      .map((item) => {
        let bestScore = 0;

        fields.forEach((field, index) => {
          const val = getNestedValue(item, field);
          if (val == null) return;
          const str = Array.isArray(val) ? val.join(" ") : String(val);
          const score = scoreFieldMatch(str, index, field === primaryField);
          bestScore = Math.max(bestScore, score);
        });

        if (bestScore <= 0) return null;

        return { item, type, label, pathPrefix, score: bestScore };
      })
      .filter((entry): entry is SearchResultItem => entry !== null);
    };

    const pastoresMatches = searchMatches(
      data.pastores, 
      ["fullName", "temploName", "phone", "address"], 
      "pastor", "PASTOR", "/directorio", "fullName"
    );
    
    const corosMatches = searchMatches(
      data.coros, 
      ["coroName", "presidentName", "temploName"], 
      "coro", "CORO", "/coros", "coroName"
    );

    const directivaMatches = searchMatches(
      data.directiva, 
      ["fullName", "role", "temploName"], 
      "directiva", "DIRECTIVA", "/directiva", "fullName"
    );
    
    const templosMatches = searchMatches(
      data.templos, 
      ["temploName", "address", "pastores.fullName", "coros.coroName"], 
      "templo", "TEMPLO", "/templos", "temploName"
    );

    const eventosMatches = searchMatches(
      data.eventos, 
      ["title", "location", "address", "description", "speakers.pastorMensaje", "speakers.jovenPreside"], 
      "evento", "EVENTO", "/", "title"
    );

    return [
      ...eventosMatches,
      ...templosMatches,
      ...pastoresMatches,
      ...corosMatches,
      ...directivaMatches,
    ].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    });
  }, [localQuery, data]);

  const filteredResults = useMemo(() => {
    if (activeFilter === "all") return allResults;
    return allResults.filter((result) => result.type === activeFilter);
  }, [allResults, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: allResults.length,
      evento: allResults.filter((r) => r.type === "evento").length,
      templo: allResults.filter((r) => r.type === "templo").length,
      pastor: allResults.filter((r) => r.type === "pastor").length,
      coro: allResults.filter((r) => r.type === "coro").length,
      directiva: allResults.filter((r) => r.type === "directiva").length,
    };
  }, [allResults]);

  const ResultHighlightedText = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = highlightText(text, localQuery);
    return (
      <span className="break-words">
        {parts.map((p, i) =>
          p.isMatch ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5 no-underline font-semibold">
              {p.text}
            </mark>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="w-full relative pb-16 bg-[#f1f1f1]" id="main-content">
      <div className="max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[84px] bg-background md:border-x border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] dark:shadow-none min-h-screen focus:outline-none">
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resultados de búsqueda</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buscando: <span className="font-semibold text-foreground">&quot;{localQuery || queryFromUrl}&quot;</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="mb-5 space-y-3">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full h-[42px] bg-white rounded-[2px] flex items-center overflow-hidden border border-[#bcc3cc]"
              role="search"
              aria-label="Buscar dentro de resultados"
            >
              <input
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Buscar"
                className="flex-1 min-w-0 h-full bg-transparent border-none text-[14px] text-black placeholder-[#6b7280] pl-3 pr-2 focus:outline-none focus:ring-0"
                aria-label="Buscar"
              />
              <button
                type="submit"
                className="w-[42px] h-full flex items-center justify-center bg-[#4a70a5] hover:bg-[#3f5f8d] transition-colors"
                aria-label="Ejecutar búsqueda"
              >
                <Search className="h-[17px] w-[17px] text-white" strokeWidth={2} />
              </button>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTER_ORDER.map((filter) => {
                const isActive = activeFilter === filter.key;
                const count = filterCounts[filter.key as keyof typeof filterCounts];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key as SearchResultType | "all")}
                    className={[
                      "shrink-0 border px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-[#7f7f7f] text-white border-[#7f7f7f]"
                        : "bg-white text-[#4a70a5] border-[#d2d6dc] hover:bg-[#f6f8fb]",
                    ].join(" ")}
                    aria-pressed={isActive}
                    aria-label={`Filtrar por ${filter.label}`}
                  >
                    {filter.label} <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="py-10 text-foreground">
              <p className="text-lg mb-6">Lamentablemente no se encontró ningún resultado.</p>
              <p className="text-xl mb-2">Sugerencias:</p>
              <ul className="list-disc pl-7 space-y-1 text-lg">
                <li>Asegúrese de que las palabras estén escritas correctamente.</li>
                <li>Escriba palabras menos específicas.</li>
                <li>Use menos palabras para la búsqueda.</li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
            {filteredResults.map((result, idx) => {
              const { item, type, label, pathPrefix } = result;
              
              // Resolve primary display fields based on type
              let title = "";
              let subtitle = "";
              let description = "";
              let photo = "";
              let Icon = Users;

              if (type === "pastor") {
                const p = item as Pastor;
                title = p.fullName;
                subtitle = p.temploName || "";
                description = p.phone || "";
                photo = p.photo || "";
                Icon = Users;
              } else if (type === "coro") {
                const c = item as Coro;
                title = c.coroName;
                subtitle = c.temploName || "";
                description = c.presidentName ? `Presidente: ${c.presidentName}` : "";
                photo = c.photo || "";
                Icon = Music;
              } else if (type === "directiva") {
                const d = item as DirectivaMember;
                title = d.fullName;
                subtitle = d.role || "";
                description = d.temploName || "";
                photo = d.photo || "";
                Icon = UserCircle;
              } else if (type === "templo") {
                const t = item as Templo;
                title = t.temploName;
                subtitle = t.address || "";
                description = t.pastores?.map(p => p.fullName).join(", ") || "";
                photo = t.photo || "";
                Icon = Church;
              } else if (type === "evento") {
                const e = item as Event;
                title = e.title;
                subtitle = e.location || "";
                description = e.date ? new Date(e.date).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' }) : "";
                photo = e.image || "";
                Icon = Calendar;
              }

              return (
                <Link 
                  key={`${type}-${item.id}-${idx}`}
                  href={`${pathPrefix}#${item.id}`}
                  className="group flex flex-col sm:flex-row bg-card border border-border overflow-hidden sm:hover:border-[#4a70a5] sm:hover:shadow-md transition-all duration-200 relative pointer-events-none sm:pointer-events-auto"
                >
                  <div className="w-full sm:w-[120px] h-[160px] sm:h-auto bg-muted shrink-0 relative flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border">
                    {photo ? (
                      <Image 
                        src={photo} 
                        alt={title} 
                        fill 
                        className="object-cover object-center" 
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 sm:pr-4">
                    <span className="text-[10px] font-bold tracking-widest text-[#4a70a5] mb-1">
                      {label}
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold text-[#292929] dark:text-gray-100 sm:group-hover:text-[#4a70a5] transition-colors leading-snug mb-1">
                      <ResultHighlightedText text={title} />
                    </h3>
                    {subtitle && (
                      <p className="text-sm font-medium text-foreground mb-1">
                        <ResultHighlightedText text={subtitle} />
                      </p>
                    )}
                    {description && (
                      <p className="text-xs text-muted-foreground">
                        <ResultHighlightedText text={description} />
                      </p>
                    )}
                    <div className="mt-4 sm:hidden w-full pointer-events-auto">
                      <div className="w-full bg-[#ffffff] text-[#292929] border border-gray-300 text-center text-sm font-semibold py-2 rounded shadow-sm active:bg-gray-200 transition-colors">
                        Ver más información
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export function SearchContent(props: SearchContentProps) {
  return (
    <Suspense fallback={
      <div className="w-full relative pb-16 pt-[78px] md:pt-[84px] bg-background text-center py-12">
        <p className="text-muted-foreground">Cargando resultados...</p>
      </div>
    }>
      <SearchContentInner {...props} />
    </Suspense>
  );
}