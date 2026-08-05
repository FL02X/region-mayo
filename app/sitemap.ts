import type { MetadataRoute } from "next";
import { getAlbums } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/templos",
  "/pastores",
  "/coros",
  "/directiva",
  "/directiva-dorcas",
  "/directiva-varones",
  "/album",
  "/album/galerias",
  "/album/grabaciones",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums = await getAlbums("region-mayo");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const albumEntries: MetadataRoute.Sitemap = albums
    .filter((album) => !album.hidden)
    .map((album) => ({
      url: absoluteUrl(
        album.albumType === "youtube"
          ? `/album/grabaciones/${album.slug}`
          : `/album/galerias/${album.slug}`,
      ),
      lastModified: album.endDate ?? album.startDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticEntries, ...albumEntries];
}
