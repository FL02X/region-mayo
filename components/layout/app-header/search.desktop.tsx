"use client";

// Donde: barra superior dentro de AppHeader.
// Viewports: desktop/tablet md+.
// Funcion: muestra coincidencias rápidas y conserva el envío a /buscar.
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Church, Music, Search, UserCircle, Users, X } from "lucide-react";
import type { SearchSuggestion } from "@/components/sections/search/search-types";
import { highlightText } from "@/lib/search-utils";

interface DesktopSearchProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function SearchHighlightedText({ text, query }: { text: string; query: string }) {
  return highlightText(text, query).map((part, index) => (
    part.isMatch ? (
      <mark key={index} className="bg-yellow-200 px-0.5 text-inherit">
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    )
  ));
}

export function DesktopSearch({ onSubmit }: DesktopSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const hasEnoughQuery = Array.from(query.trim()).length >= 4;

  const closeSearch = () => {
    setIsOpen(false);
    setActiveIndex(-1);
    setIsOverlayVisible(false);
  };

  useEffect(() => {
    const closeOnOutsidePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", closeOnOutsidePointer);
    return () => document.removeEventListener("mousedown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    if (!hasEnoughQuery) {
      setResults([]);
      setIsLoading(false);
      setHasError(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);
      setIsOpen(true);
      setActiveIndex(-1);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");

        const data = (await response.json()) as { results?: SearchSuggestion[] };
        setResults(data.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hasEnoughQuery, query]);

  const selectResult = (result: SearchSuggestion) => {
    closeSearch();

    const href = `${result.path}#${encodeURIComponent(result.id)}`;
    if (pathname === result.path) {
      window.location.hash = result.id;
      return;
    }

    router.push(href);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setActiveIndex(-1);

    if (Array.from(nextQuery.trim()).length >= 4) {
      setResults([]);
      setIsLoading(true);
      setHasError(false);
      setIsOpen(true);
    }
  };

  const openSearch = () => {
    setIsOverlayVisible(true);
    if (hasEnoughQuery) setIsOpen(true);
  };

  const clearQuery = () => {
    handleQueryChange("");
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || isLoading || results.length === 0) {
      if (event.key === "Escape") closeSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectResult(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    onSubmit(event);
    closeSearch();
  };

  return (
    <>
    <div ref={rootRef} className="relative z-[3] flex h-full w-[180px] shrink-0 items-center min-[915px]:w-[220px] min-[1101px]:w-[400px]">
      {isOverlayVisible && (
        <button
          type="button"
          className="fixed inset-0 z-0 cursor-default bg-black/35"
          onClick={closeSearch}
          aria-label="Cerrar búsqueda"
        />
      )}
      <form
        className="relative z-10 flex h-[34px] w-full items-center rounded-[4px] border border-border bg-paper-highlight transition-colors focus-within:border-brand min-[1101px]:h-[36px] max-[914px]:h-[40px]"
        onSubmit={handleSubmit}
        role="search"
      >
        <input
          ref={inputRef}
          type="search"
          name="q"
          placeholder="Buscar: iglesia, evento, pastor..."
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onPointerDown={openSearch}
          onFocus={openSearch}
          onKeyDown={handleInputKeyDown}
          className="h-full min-w-0 flex-1 appearance-none border-none bg-transparent pl-2.5 pr-2 text-[14px] leading-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:hidden min-[1101px]:text-[14px]"
          aria-label="Búsqueda"
          aria-autocomplete="list"
          aria-controls="desktop-search-suggestions"
          aria-expanded={isOpen && hasEnoughQuery}
          aria-activedescendant={activeIndex >= 0 ? `desktop-search-result-${activeIndex}` : undefined}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearQuery}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm text-brand transition-colors hover:bg-paper-dark active:bg-brand-soft"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        <div className="h-[20px] w-px shrink-0 bg-border" aria-hidden="true" />
        <button
          type="submit"
          className="desktop-search-button flex h-full w-[36px] cursor-pointer items-center justify-center bg-transparent transition-colors hover:bg-paper-dark active:bg-brand-soft min-[1101px]:w-10 max-[914px]:w-[44px]"
          aria-label="Ejecutar búsqueda"
        >
          <Search className="desktop-search-icon h-[16px] w-[16px] text-brand" strokeWidth={1.2} />
        </button>
      </form>

      {isOpen && hasEnoughQuery && (
        <div
          id="desktop-search-suggestions"
          role="listbox"
          aria-label="Coincidencias de búsqueda"
          className="absolute right-0 top-[calc(100%+2px)] z-10 max-h-[256px] w-full overflow-y-auto border border-brand-border bg-paper shadow-[0_16px_32px_-18px_rgba(15,23,42,0.55)] [scrollbar-gutter:stable] min-[1101px]:max-h-[288px]"
        >
          {isLoading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Buscando coincidencias...</p>
          ) : hasError ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No se pudieron cargar las coincidencias.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No se encontraron coincidencias.</p>
          ) : (
            results.map((result, index) => {
              const FallbackIcon = {
                evento: Calendar,
                templo: Church,
                pastor: Users,
                coro: Music,
                directiva: UserCircle,
              }[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  id={`desktop-search-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectResult(result)}
                  className={`flex min-h-[64px] w-full items-start gap-2 border-b border-border px-2.5 py-2 text-left last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand min-[1101px]:min-h-[72px] min-[1101px]:gap-3 min-[1101px]:px-3 ${
                    activeIndex === index
                      ? "bg-brand-soft text-brand-active"
                      : "bg-paper text-foreground hover:bg-paper-dark active:bg-brand-soft"
                  }`}
                >
                  <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-border bg-paper-dark min-[1101px]:h-12 min-[1101px]:w-12">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt=""
                        fill
                        unoptimized
                        loading={index < 4 ? "eager" : "lazy"}
                        sizes="(min-width: 1101px) 48px, 40px"
                        className="object-cover"
                      />
                    ) : (
                      <FallbackIcon className="h-5 w-5 text-brand/55" aria-hidden="true" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="mb-1 inline-flex w-fit bg-brand px-1.5 pb-0.5 pt-px text-[9px] font-semibold leading-none tracking-[0.08em] text-white min-[1101px]:text-[10px]">
                      {result.label}
                    </span>
                    <span className="block break-words text-[12px] font-semibold leading-tight min-[1101px]:text-[13px]">
                      <SearchHighlightedText text={result.title} query={query} />
                    </span>
                    {result.subtitle && (
                      <span className={`mt-1 block text-[11px] leading-tight text-muted-foreground min-[1101px]:text-[12px] ${
                        result.truncateSubtitle ? "truncate" : "break-words"
                      }`}>
                        <SearchHighlightedText text={result.subtitle} query={query} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
    </>
  );
}
