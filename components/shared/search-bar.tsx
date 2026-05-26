"use client";

import { useState } from "react";
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
  const clearButtonPosition = rightAction ? "right-12" : "right-3";

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
    <div className="rounded-[2px] border border-[#d7dbe1] bg-[#e9eaec] px-2.5 py-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full h-[42px] pl-10 ${rightAction ? "pr-16" : "pr-10"} bg-white border border-[#b8c1cc] rounded-[2px] text-[14px] text-foreground placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#2f5e93] focus:ring-offset-0`}
          aria-label="Buscador"
        />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute ${clearButtonPosition} top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-[2px] transition-colors`}
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
