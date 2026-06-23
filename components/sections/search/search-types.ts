// Donde: no renderiza UI directo. Viewports: afecta /buscar en desktop y mobile. Funcion: tipos compartidos entre busqueda, helpers y tarjetas.
import type { Coro, DirectivaMember, Event, Pastor, Templo } from "@/lib/types";

export interface SearchContentData {
  pastores: Pastor[];
  coros: Coro[];
  directiva: DirectivaMember[];
  templos: Templo[];
  eventos: Event[];
}

export type SearchResultType = "evento" | "templo" | "pastor" | "coro" | "directiva";

export type SearchResultItem = {
  item: Record<string, any>;
  type: SearchResultType;
  label: string;
  pathPrefix: string;
  score: number;
};

export type SearchFilterKey = SearchResultType | "all";
