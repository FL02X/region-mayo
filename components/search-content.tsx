"use client";

import { useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users, Music, UserCircle, Church, Calendar, ChevronRight } from "lucide-react";
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

function SearchContentInner({ data }: SearchContentProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  // Global search function optimized for performance across all collections
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const normQuery = normalizeText(query);
    const searchMatches = <T extends Record<string, any>>(
      items: T[], 
      fields: string[], 
      type: "pastor" | "coro" | "directiva" | "templo" | "evento",
      label: string,
      pathPrefix: string
    ) => {
      return items.filter((item) => {
        return fields.some((field) => {
          const val = getNestedValue(item, field);
          if (val == null) return false;
          const str = Array.isArray(val) ? val.join(" ") : String(val);
          return normalizeText(str).includes(normQuery);
        });
      }).map(item => ({ item, type, label, pathPrefix }));
    };

    const pastoresMatches = searchMatches(
      data.pastores, 
      ["fullName", "temploName", "phone", "address"], 
      "pastor", "PASTOR", "/directorio"
    );
    
    const corosMatches = searchMatches(
      data.coros, 
      ["coroName", "presidentName", "temploName"], 
      "coro", "CORO", "/coros"
    );

    const directivaMatches = searchMatches(
      data.directiva, 
      ["fullName", "role", "temploName"], 
      "directiva", "DIRECTIVA", "/directiva"
    );
    
    const templosMatches = searchMatches(
      data.templos, 
      ["temploName", "address", "pastores.fullName", "coros.coroName"], 
      "templo", "TEMPLO", "/templos"
    );

    const eventosMatches = searchMatches(
      data.eventos, 
      ["title", "location", "address", "description", "speakers.pastorMensaje", "speakers.jovenPreside"], 
      "evento", "EVENTO", "/"
    );

    return [...pastoresMatches, ...corosMatches, ...directivaMatches, ...templosMatches, ...eventosMatches];
  }, [query, data]);

  const ResultHighlightedText = ({ text }: { text: string }) => {
    if (!text) return null;
    const parts = highlightText(text, query);
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
    <div className="w-full relative pb-16 bg-[#f3f4f6] dark:bg-[#09090b]" id="main-content">
      <div className="max-w-[950px] mx-auto px-4 md:px-8 py-6 pt-[78px] md:pt-[84px] bg-background md:border-x border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] dark:shadow-none min-h-screen focus:outline-none">
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 pb-4 border-b border-border flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resultados de búsqueda</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Buscando: <span className="font-semibold text-foreground">&quot;{query}&quot;</span>
              </p>
            </div>
            <div className="text-sm text-muted-foreground hidden sm:block">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No se encontraron resultados para su búsqueda.</p>
              <p className="text-sm">Asegúrese de que las palabras estén escritas correctamente o pruebe con palabras distintas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
            {results.map((result, idx) => {
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
                      <div className="w-full bg-[#f3f4f6] text-[#292929] border border-gray-300 text-center text-sm font-semibold py-2 rounded shadow-sm active:bg-gray-200 transition-colors">
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