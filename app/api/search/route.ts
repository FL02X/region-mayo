import { NextRequest, NextResponse } from "next/server";
import {
  getCoros,
  getDirectivaDorcasGenerations,
  getDirectivaGenerations,
  getDirectivaVaronesGenerations,
  getEvents,
  getPastors,
  getTemplos,
} from "@/lib/api";
import { getDirectivaRoleLabel } from "@/components/sections/directiva/directiva-helpers";
import { getLatestDirectivaMembers, getSearchQueryTokens, getSearchResults } from "@/components/sections/search/search-helpers";
import type { SearchContentData, SearchResultItem, SearchSuggestion } from "@/components/sections/search/search-types";
import { sanityImageVariantUrl } from "@/sanity/lib/image";
import type { Coro, DirectivaMember, Event, Pastor, Templo } from "@/lib/types";
import { normalizeText } from "@/lib/search-utils";

const MIN_QUERY_LENGTH = 4;

function getThumbnail(source?: string) {
  if (!source) return undefined;

  return sanityImageVariantUrl(source, {
    width: 96,
    height: 96,
    quality: 58,
    format: "webp",
    fit: "crop",
  });
}

function findMatchedText(values: Array<string | undefined>, query: string) {
  const tokens = getSearchQueryTokens(query);
  const normalizedQuery = normalizeText(query);

  return values.find((value) => {
    if (!value) return false;
    const normalizedValue = normalizeText(value);
    return tokens.length > 0
      ? tokens.every((token) => normalizedValue.includes(token))
      : normalizedValue.includes(normalizedQuery);
  }) ?? values.find(Boolean);
}

function toSearchSuggestion(result: SearchResultItem, query: string): SearchSuggestion {
  const { item, label, matchedField, pathPrefix, type } = result;

  if (type === "coro") {
    const coro = item as Coro;
    return {
      id: coro.id,
      type,
      label,
      path: pathPrefix,
      title: coro.coroName,
      subtitle: matchedField === "presidentName"
        ? `Presidente: ${coro.presidentName}`
        : matchedField === "temploName" && coro.temploName
          ? `Templo: ${coro.temploName}`
          : undefined,
      image: getThumbnail(coro.photo),
    };
  }

  if (type === "directiva") {
    const member = item as DirectivaMember;
    const role = getDirectivaRoleLabel(member.role);
    return {
      id: member.id,
      type,
      label,
      path: pathPrefix,
      title: member.fullName,
      subtitle: matchedField === "role" && role
        ? `Cargo: ${role}`
        : matchedField === "temploName" && member.temploName
          ? `Templo: ${member.temploName}`
          : undefined,
      image: getThumbnail(member.photo),
    };
  }

  if (type === "pastor") {
    const pastor = item as Pastor;
    return {
      id: pastor.id,
      type,
      label,
      path: pathPrefix,
      title: pastor.fullName,
      subtitle: matchedField === "temploName" && pastor.temploName
        ? `Templo: ${pastor.temploName}`
        : matchedField === "phone" && pastor.phone
          ? `Teléfono: ${pastor.phone}`
          : matchedField === "address" && pastor.address
            ? `Dirección: ${pastor.address}`
            : undefined,
      truncateSubtitle: matchedField === "address",
      image: getThumbnail(pastor.photo),
    };
  }

  if (type === "templo") {
    const templo = item as Templo;
    return {
      id: templo.id,
      type,
      label,
      path: pathPrefix,
      title: templo.temploName,
      subtitle: matchedField === "address" && templo.address
        ? `Dirección: ${templo.address}`
        : matchedField === "pastores.fullName"
          ? (() => {
              const pastorName = findMatchedText(
                templo.pastores.map((pastor) => pastor.fullName),
                query,
              );
              return pastorName ? `Pastor: ${pastorName}` : undefined;
            })()
          : matchedField === "coros.coroName"
            ? (() => {
                const coroName = findMatchedText(
                  templo.coros.map((coro) => coro.coroName),
                  query,
                );
                return coroName ? `Coro: ${coroName}` : undefined;
              })()
            : undefined,
      truncateSubtitle: matchedField === "address",
      image: getThumbnail(templo.photos?.[0]),
    };
  }

  const event = item as Event;
  return {
    id: event.id,
    type,
    label,
    path: pathPrefix,
    title: event.title,
    subtitle: matchedField === "location" && event.location
      ? `Lugar: ${event.location}`
      : matchedField === "address" && event.address
        ? `Dirección: ${event.address}`
        : matchedField === "speakers.pastorMensaje" && event.speakers?.pastorMensaje
          ? `Pastor: ${event.speakers.pastorMensaje}`
          : matchedField === "speakers.jovenPreside" && event.speakers?.jovenPreside
            ? `Preside: ${event.speakers.jovenPreside}`
            : matchedField === "description" && event.description
              ? `Descripción: ${event.description}`
              : undefined,
    truncateSubtitle: matchedField === "address",
    image: getThumbnail(event.image),
  };
}

async function getPublicSearchData(): Promise<SearchContentData> {
  const [
    pastores,
    coros,
    directivaGenerations,
    directivaDorcasGenerations,
    directivaVaronesGenerations,
    templos,
    eventos,
  ] = await Promise.all([
    getPastors("region-mayo"),
    getCoros("region-mayo"),
    getDirectivaGenerations("region-mayo"),
    getDirectivaDorcasGenerations("region-mayo"),
    getDirectivaVaronesGenerations("region-mayo"),
    getTemplos("region-mayo"),
    getEvents("region-mayo"),
  ]);

  return {
    pastores,
    coros,
    directiva: getLatestDirectivaMembers(directivaGenerations),
    directivaDorcas: getLatestDirectivaMembers(directivaDorcasGenerations),
    directivaVarones: getLatestDirectivaMembers(directivaVaronesGenerations),
    templos,
    eventos,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (Array.from(query).length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] satisfies SearchSuggestion[] });
  }

  const data = await getPublicSearchData();
  const results = getSearchResults(data, query).map((result) =>
    toSearchSuggestion(result, query),
  );

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
  );
}
