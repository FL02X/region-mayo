// Donde: no renderiza UI directo. Viewports: afecta /buscar en desktop y mobile. Funcion: centraliza labels editables de filtros y textos simples de busqueda.
import type { SearchResultType } from "@/components/sections/search/search-types";

export const SEARCH_FILTERS: Array<{ key: SearchResultType | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "evento", label: "Eventos" },
  { key: "templo", label: "Templos" },
  { key: "pastor", label: "Pastores" },
  { key: "coro", label: "Coros" },
  { key: "directiva", label: "Directiva" },
];

export const SEARCH_EMPTY_SUGGESTIONS = [
  "Asegúrese de que las palabras estén escritas correctamente.",
  "Escriba palabras menos específicas.",
  "Use menos palabras para la búsqueda.",
];
