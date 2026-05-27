"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  rightAction?: ReactNode;
}

export function SearchBar({
  onSearchChange,
  placeholder = "Buscar...",
  autoFocus = false,
  rightAction,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clearButtonPosition = rightAction ? "right-12" : "right-3";

  useEffect(() => {
    setIsMounted(true);
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the visual state has settled before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearchChange(newQuery);
  };

  const handleClear = () => {
    setQuery("");
    onSearchChange("");
  };

  return (
    <div className="rounded-[0px] border border-[#d7dbe1] bg-[#f1f1f1] px-2.5 py-2" suppressHydrationWarning>
      <div className="relative" suppressHydrationWarning>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full h-[42px] pl-10 ${rightAction ? "pr-16" : "pr-10"} bg-white border border-[#b8c1cc] rounded-[5px] text-[15px] text-foreground focus:outline-none focus:ring-1 focus:ring-[#2f5e93] focus:ring-offset-0`}
          aria-label="Buscador"
          suppressHydrationWarning
        />
        {isMounted && query && (
          <button
            onClick={handleClear}
            className={`absolute ${clearButtonPosition} top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-[5px] transition-colors`}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}
        {rightAction && (
          <div className="absolute right-0 top-0 bottom-0 md:hidden">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
}

