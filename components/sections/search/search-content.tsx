"use client";
// Donde: ruta /buscar. Viewports: desktop y mobile. Funcion: coordina busqueda global, filtros y estados de resultados.
import { useMemo, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import {
  SEARCH_EMPTY_SUGGESTIONS,
  SEARCH_FILTERS,
} from "@/components/sections/search/search-copy";
import {
  filterSearchResults,
  getSearchFilterCounts,
  getSearchResults,
} from "@/components/sections/search/search-helpers";
import { SearchResultCard } from "@/components/sections/search/search-result-card";
import type {
  SearchContentData,
  SearchFilterKey,
} from "@/components/sections/search/search-types";

interface SearchContentProps {
  data: SearchContentData;
}

function SearchContentInner({ data }: SearchContentProps) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SearchFilterKey>("all");
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

  const allResults = useMemo(() => {
    return getSearchResults(data, localQuery);
  }, [localQuery, data]);

  const filteredResults = useMemo(() => {
    return filterSearchResults(allResults, activeFilter);
  }, [allResults, activeFilter]);

  const filterCounts = useMemo(() => {
    return getSearchFilterCounts(allResults);
  }, [allResults]);

  const hasActiveQuery = localQuery.trim().length > 0;

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
              {SEARCH_FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                const count = filterCounts[filter.key as keyof typeof filterCounts];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
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
                {SEARCH_EMPTY_SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          ) : hasActiveQuery && !isRefreshingResults ? (
            <div className="flex flex-col gap-5">
              {filteredResults.map((result, index) => (
                <SearchResultCard
                  key={`${result.type}-${result.item.id}-${index}`}
                  result={result}
                  index={index}
                  query={localQuery}
                />
              ))}
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
