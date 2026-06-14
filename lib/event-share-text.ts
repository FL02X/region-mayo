import { formatRegionDayMonth } from "@/lib/region-date";
import type { Event } from "@/lib/types";

const buildGoogleMapsSearchUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const getEventMapsUrl = (event: Event) => {
  if (event.googleMapsUrl) return event.googleMapsUrl;
  if (event.address) return buildGoogleMapsSearchUrl(event.address);
  return "";
};

export function buildEventShareText(event: Event, eventUrl: string) {
  const schedule =
    Array.isArray(event.schedule) && event.schedule.length > 0
      ? event.schedule
      : [{ date: event.date, time: event.time }];
  const dateLines = schedule.map((occurrence) => {
    const label = `${formatRegionDayMonth(occurrence.date)} | ${occurrence.time}`;
    return occurrence.note ? `${label} - ${occurrence.note}` : label;
  });
  const locationLines = [
    event.location,
    event.address,
    getEventMapsUrl(event),
  ].filter(Boolean);

  return [
    event.title,
    dateLines.join("\n"),
    locationLines.join("\n"),
    eventUrl,
  ]
    .filter(Boolean)
    .join("\n\n");
}
