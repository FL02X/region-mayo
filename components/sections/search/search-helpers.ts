// Donde: no renderiza UI directo. Viewports: afecta /buscar en desktop y mobile. Funcion: calcula resultados, puntajes y conteos de filtros.
import { getNestedValue, normalizeText } from "@/lib/search-utils";
import type { DirectivaGeneration, DirectivaMember } from "@/lib/types";
import type {
  SearchContentData,
  SearchFilterKey,
  SearchResultItem,
  SearchResultType,
} from "@/components/sections/search/search-types";

const TYPE_PRIORITY: Record<SearchResultType, number> = {
  evento: 0,
  templo: 1,
  pastor: 2,
  coro: 3,
  directiva: 4,
};

const SEARCH_STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "las",
  "los",
  "y",
  "en",
  "a",
  "por",
  "para",
  "con",
  "sin",
  "que",
  "the",
  "of",
  "and",
  "in",
  "on",
  "for",
  "to",
  "from",
  "by",
  "at",
  "is",
  "are",
]);

export function getLatestDirectivaMembers(
  generations: DirectivaGeneration[],
): DirectivaMember[] {
  const seenNames = new Set<string>();

  return [...generations]
    .sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return Number(b.isCurrent) - Number(a.isCurrent);
      return (b.startYear ?? 0) - (a.startYear ?? 0);
    })
    .flatMap((generation) => generation.members)
    .filter((member) => {
      const key = normalizeText(member.fullName);
      if (seenNames.has(key)) return false;

      seenNames.add(key);
      return true;
    });
}

export function getSearchQueryTokens(query: string): string[] {
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

function getTextMatchScore({
  text,
  fieldIndex,
  isPrimaryField,
  normQuery,
  queryTokens,
}: {
  text: string;
  fieldIndex: number;
  isPrimaryField: boolean;
  normQuery: string;
  queryTokens: string[];
}) {
  if (!text) return 0;

  // Si la busqueda solo trae conectores como "de" o "la", conserva el match simple anterior.
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
}

function searchMatches<T extends Record<string, any>>({
  items,
  fields,
  type,
  label,
  pathPrefix,
  primaryField,
  normQuery,
  queryTokens,
}: {
  items: T[];
  fields: string[];
  type: SearchResultType;
  label: string;
  pathPrefix: string;
  primaryField: string;
  normQuery: string;
  queryTokens: string[];
}): SearchResultItem[] {
  return items
    .map((item): SearchResultItem | null => {
      let bestScore = 0;
      let bestFieldScore = 0;
      let matchedField: string | undefined;

      const combinedText = collectSearchableText(item, fields);

      fields.forEach((field, index) => {
        const value = getNestedValue(item, field);
        if (value == null) return;

        const text = Array.isArray(value) ? value.join(" ") : String(value);
        const score = getTextMatchScore({
          text: normalizeText(text),
          fieldIndex: index,
          isPrimaryField: field === primaryField,
          normQuery,
          queryTokens,
        });
        bestScore = Math.max(bestScore, score);
        if (score > bestFieldScore) {
          bestFieldScore = score;
          matchedField = field;
        }
      });

      bestScore = Math.max(
        bestScore,
        getTextMatchScore({
          text: combinedText,
          fieldIndex: 0,
          isPrimaryField: primaryField === fields[0],
          normQuery,
          queryTokens,
        }),
      );

      if (bestScore <= 0) return null;

      return { item, type, label, pathPrefix, score: bestScore, matchedField };
    })
    .filter((entry): entry is SearchResultItem => entry !== null);
}

export function getSearchResults(data: SearchContentData, query: string) {
  if (!query.trim()) return [] as SearchResultItem[];

  const normQuery = normalizeText(query);
  const queryTokens = getSearchQueryTokens(query);

  const pastoresMatches = searchMatches({
    items: data.pastores,
    fields: ["fullName", "temploName", "phone", "address"],
    type: "pastor",
    label: "PASTOR",
    pathPrefix: "/pastores",
    primaryField: "fullName",
    normQuery,
    queryTokens,
  });

  const corosMatches = searchMatches({
    items: data.coros,
    fields: ["coroName", "presidentName", "temploName"],
    type: "coro",
    label: "CORO",
    pathPrefix: "/coros",
    primaryField: "coroName",
    normQuery,
    queryTokens,
  });

  const directivaMatches = searchMatches({
    items: data.directiva,
    fields: ["fullName", "role", "temploName"],
    type: "directiva",
    label: "DIRECTIVA JUVENIL",
    pathPrefix: "/directiva",
    primaryField: "fullName",
    normQuery,
    queryTokens,
  });

  const directivaDorcasMatches = searchMatches({
    items: data.directivaDorcas,
    fields: ["fullName", "role", "temploName"],
    type: "directiva",
    label: "DIRECTIVA DE DORCAS",
    pathPrefix: "/directiva-dorcas",
    primaryField: "fullName",
    normQuery,
    queryTokens,
  });

  const directivaVaronesMatches = searchMatches({
    items: data.directivaVarones,
    fields: ["fullName", "role", "temploName"],
    type: "directiva",
    label: "DIRECTIVA DE VARONES",
    pathPrefix: "/directiva-varones",
    primaryField: "fullName",
    normQuery,
    queryTokens,
  });

  const templosMatches = searchMatches({
    items: data.templos,
    fields: ["temploName", "address", "pastores.fullName", "coros.coroName"],
    type: "templo",
    label: "TEMPLO",
    pathPrefix: "/templos",
    primaryField: "temploName",
    normQuery,
    queryTokens,
  });

  const eventosMatches = searchMatches({
    items: data.eventos,
    fields: [
      "title",
      "location",
      "address",
      "description",
      "speakers.pastorMensaje",
      "speakers.jovenPreside",
    ],
    type: "evento",
    label: "EVENTO",
    pathPrefix: "/",
    primaryField: "title",
    normQuery,
    queryTokens,
  });

  return [
    ...eventosMatches,
    ...templosMatches,
    ...pastoresMatches,
    ...corosMatches,
    ...directivaMatches,
    ...directivaDorcasMatches,
    ...directivaVaronesMatches,
  ].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
  });
}

export function filterSearchResults(
  results: SearchResultItem[],
  activeFilter: SearchFilterKey,
) {
  if (activeFilter === "all") return results;
  return results.filter((result) => result.type === activeFilter);
}

export function getSearchFilterCounts(results: SearchResultItem[]) {
  return {
    all: results.length,
    evento: results.filter((result) => result.type === "evento").length,
    templo: results.filter((result) => result.type === "templo").length,
    pastor: results.filter((result) => result.type === "pastor").length,
    coro: results.filter((result) => result.type === "coro").length,
    directiva: results.filter((result) => result.type === "directiva").length,
  };
}
