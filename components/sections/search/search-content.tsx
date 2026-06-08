"use client";

import { useMemo, Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Music, UserCircle, Church, Calendar, Search, ChevronRight, Loader2 } from "lucide-react";
import { highlightText, normalizeText, getNestedValue } from "@/lib/search-utils";
import { formatRegionLongDate } from "@/lib/region-date";
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

const SEARCH_STOPWORDS = new Set([
  "de", "del", "la", "el", "las", "los", "y", "en", "a", "por", "para", "con", "sin", "que",
  "the", "of", "and", "in", "on", "for", "to", "from", "by", "at", "is", "are",
]);

function tokenizeSearchQuery(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !SEARCH_STOPWORDS.has(token));
}

function collectSearchableText(item: Record<string, any>, fields: string[]): string {
  const parts: string[] = [];

  for (const field of fields) {
    const value = getNestedValue(item, field);
    if (value == null) continue;

    if (Array.isArray(value)) {
      parts.push(value.join(" "));
    } else {
      parts.push(String(value));
    }
  }

  return normalizeText(parts.join(" "));
}

function SearchContentInner({ data }: SearchContentProps) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchResultType | "all">("all");
  const [isRefreshingResults, setIsRefreshingResults] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setLocalQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const matchesMobile = window.matchMedia("(max-width: 767px)").matches;
    setIsMobile(matchesMobile);

    if (!matchesMobile) {
      setIsEntering(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsEntering(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!localQuery.trim()) {
      setIsRefreshingResults(false);
      return;
    }

    setIsRefreshingResults(true);
    const timer = window.setTimeout(() => {
      setIsRefreshingResults(false);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [localQuery]);

  // Global search function with relevance scoring
  const allResults = useMemo(() => {
    if (!localQuery.trim()) return [] as SearchResultItem[];

    const normQuery = normalizeText(localQuery);
    const queryTokens = tokenizeSearchQuery(localQuery);

    const scoreTextMatch = (text: string, fieldIndex: number, isPrimaryField: boolean) => {
      if (!text) return 0;

      // Fall back to exact substring behavior if the query only has stopwords.
      if (queryTokens.length === 0) {
        if (!text.includes(normQuery)) return 0;

        let score = 50;
        if (text === normQuery) score = 140;
        else if (text.startsWith(normQuery)) score = 100;
        else if (text.includes(` ${normQuery}`)) score = 80;

        score += Math.max(0, 20 - fieldIndex * 4);
        if (isPrimaryField) score += 20;

        return score;
      }

      if (!queryTokens.every((token) => text.includes(token))) return 0;

      const exactSequence = queryTokens.join(" ");
      const matchedTokenCount = queryTokens.filter((token) => text.includes(token)).length;
      const coverage = matchedTokenCount / queryTokens.length;

      let score = 60 + Math.round(coverage * 40);
      if (text === exactSequence) score += 30;
      if (isPrimaryField) score += 20;
      score += Math.max(0, 16 - fieldIndex * 3);

      return score;
    };

    const searchMatches = <T extends Record<string, any>>(
      items: T[], 
      fields: string[], 
      type: SearchResultType,
      label: string,
      pathPrefix: string,
      primaryField: string,
    ): SearchResultItem[] => {
      return items
      .map((item): SearchResultItem | null => {
        let bestScore = 0;

        const combinedText = collectSearchableText(item, fields);

        fields.forEach((field, index) => {
          const val = getNestedValue(item, field);
          if (val == null) return;
          const str = Array.isArray(val) ? val.join(" ") : String(val);
          const score = scoreTextMatch(normalizeText(str), index, field === primaryField);
          bestScore = Math.max(bestScore, score);
        });

        bestScore = Math.max(bestScore, scoreTextMatch(combinedText, 0, primaryField === fields[0]));

        if (bestScore <= 0) return null;

        return { item, type, label, pathPrefix, score: bestScore };
      })
      .filter((entry): entry is SearchResultItem => entry !== null);
    };

    const pastoresMatches = searchMatches(
      data.pastores, 
      ["fullName", "temploName", "phone", "address"], 
      "pastor", "PASTOR", "/pastores", "fullName"
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

  const hasActiveQuery = localQuery.trim().length > 0;

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

  if (isEntering && isMobile) {
    return (
      <div className="w-full relative bg-[#f1f1f1]" id="main-content">
        <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] focus:outline-none">
          <div className="max-w-4xl mx-auto">
            <div className="py-14 flex items-center justify-center" aria-live="polite" aria-label="Cargando resultados">
              <Loader2 className="h-16 w-16 text-[#9ca3af] animate-spin" strokeWidth={2.25} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative bg-[#f1f1f1]" id="main-content">
      <div className="desktop-content-pane max-w-[950px] mx-auto px-4 md:px-8 py-8 pt-[82px] md:pt-[88px] bg-[#ffffff] md:border-x border-[#dce2e9] dark:border-[#27272a] focus:outline-none">
        
        <div className="max-w-4xl mx-auto md:pl-4 md:pr-4 md:pt-1">
          <div className="mb-4 space-y-3 rounded-[2px] border border-[#d7dbe1] bg-[#e9eaec] px-2.5 py-2.5">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full h-[42px] bg-paper-highlight rounded-[2px] flex items-center overflow-hidden border border-[#b8c1cc]"
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
                className="w-[42px] h-full flex items-center justify-center bg-[#2f5e93] hover:bg-[#284e79] transition-colors"
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
                      "shrink-0 border px-3 py-1.5 text-[17px] transition-colors rounded-[2px]",
                      isActive
                        ? "bg-[#2f5e93] text-white border-[#2f5e93]"
                        : "bg-white text-[#2f5e93] border-[#d2d6dc] hover:bg-[#f6f8fb]",
                    ].join(" ")}
                    aria-pressed={isActive}
                    aria-label={`Filtrar por ${filter.label}`}
                  >
                    {filter.label}
                    {hasActiveQuery ? <span className="opacity-80">({count})</span> : null}
                  </button>
                );
              })}
            </div>

          </div>

          {hasActiveQuery && !isRefreshingResults && (
            <p className="mb-7 px-0.5 text-[13px] text-[#6f7480] leading-tight" aria-live="polite">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} obtenido{filteredResults.length !== 1 ? "s" : ""}
            </p>
          )}

          {hasActiveQuery && isRefreshingResults && (
            <div className="py-14 flex items-center justify-center" aria-live="polite" aria-label="Actualizando resultados">
              <Loader2 className="h-16 w-16 text-[#9ca3af] animate-spin" strokeWidth={2.25} />
            </div>
          )}

          {hasActiveQuery && !isRefreshingResults && filteredResults.length === 0 ? (
            <div className="py-10 text-foreground">
              <p className="text-lg mb-6">Lamentablemente no se encontró ningún resultado.</p>
              <p className="text-xl mb-2">Sugerencias:</p>
              <ul className="list-disc pl-7 space-y-1 text-lg">
                <li>Asegúrese de que las palabras estén escritas correctamente.</li>
                <li>Escriba palabras menos específicas.</li>
                <li>Use menos palabras para la búsqueda.</li>
              </ul>
            </div>
          ) : hasActiveQuery && !isRefreshingResults ? (
            <div className="flex flex-col gap-5">
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
                            photo = (t.photos && t.photos.length > 0) ? t.photos[0] : "";
                            Icon = Church;
                          } else if (type === "evento") {
                const e = item as Event;
                title = e.title;
                subtitle = e.location || "";
                description = e.date ? formatRegionLongDate(new Date(e.date)) : "";
                photo = e.image || "";
                Icon = Calendar;
              }

              return (
                <Link 
                  key={`${type}-${item.id}-${idx}`}
                  href={`${pathPrefix}#${item.id}`}
                  className="desktop-card-lift group flex flex-col sm:flex-row bg-card border border-border/80 overflow-hidden hover:border-[#2f5e93] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all duration-200 relative active:scale-[0.997]"
                >
                  <div className="offline-hide-when-offline w-full sm:w-[120px] h-[160px] sm:h-auto bg-muted shrink-0 relative flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border pointer-events-none">
                    {photo ? (
                      <Image 
                        src={photo} 
                        alt={title} 
                        fill 
                        className="object-cover object-center pointer-events-none select-none" 
                        draggable={false}
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 sm:pr-4 pointer-events-none">
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-[#2f5e93] mb-1 uppercase">
                      {label}
                    </span>
                    <h3 className="text-[20px] sm:text-[21px] font-semibold text-[#222b35] dark:text-gray-100 sm:group-hover:text-[#2f5e93] transition-colors leading-snug mb-1 tracking-tight">
                      <ResultHighlightedText text={title} />
                    </h3>
                    {subtitle && (
                      <p className="text-[16px] font-medium text-foreground mb-1">
                        <ResultHighlightedText text={subtitle} />
                      </p>
                    )}
                    {description && (
                      <p className="text-[16px] text-muted-foreground">
                        <ResultHighlightedText text={description} />
                      </p>
                    )}
                    <div className="mt-4 sm:hidden flex items-center justify-end gap-1 text-[13px] uppercase tracking-wide text-[#2f5e93]">
                      <span className="font-semibold">Toca para ver</span>
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
            ) : hasActiveQuery ? null : (
            <div className="py-7 ml-2 text-foreground">
              <p className="text-lg text-[15px] text-muted-foreground">Escriba en el campo "Buscar"</p>
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
      <div className="w-full relative pb-16 pt-[78px] md:pt-[84px] bg-[#f1f1f1] text-center py-12">
        <p className="text-muted-foreground">Cargando resultados...</p>
      </div>
    }>
      <SearchContentInner {...props} />
    </Suspense>
  );
}
