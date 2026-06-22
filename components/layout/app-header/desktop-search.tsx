// Donde: barra superior dentro de AppHeader. 
// Viewports: desktop/tablet md+. 
// Funcion: envia busquedas a /buscar.
import type { FormEvent } from "react";
import { Search } from "lucide-react";

interface DesktopSearchProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function DesktopSearch({ onSubmit }: DesktopSearchProps) {
  return (
    <div className="w-[180px] shrink-0 h-full items-center flex">
      <form
        className="relative w-full h-[32px] max-[914px]:h-[40px] bg-[#f7f7f7] rounded-[2px] flex items-center overflow-hidden border border-[#9aa1ab] focus-within:border-[#6c8fbc] transition-colors"
        onSubmit={onSubmit}
      >
        <input
          type="search"
          name="q"
          placeholder="Buscar"
          className="flex-1 min-w-0 h-full bg-transparent border-none text-[12px] leading-none text-[#222] placeholder-[#6f7480] pl-2.5 pr-2 focus:outline-none focus:ring-0"
          aria-label="Búsqueda"
        />
        <div className="h-[20px] w-px bg-[#b2b8c1] shrink-0" aria-hidden="true" />
        <button
          type="submit"
          className="desktop-search-button w-[36px] max-[914px]:w-[44px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"
          aria-label="Ejecutar búsqueda"
        >
          <Search className="desktop-search-icon h-[16px] w-[16px] text-[#4a4a4a]" strokeWidth={1.6} />
        </button>
      </form>
    </div>
  );
}
