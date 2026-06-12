import { notFound, redirect } from "next/navigation";
import { getAlbumBySlug } from "@/lib/api";

interface AlbumLegacyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LegacyAlbumDetailPage({ params }: AlbumLegacyPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug, "region-mayo");

  if (!album) notFound();

  redirect(
    album.albumType === "youtube"
      ? `/album/grabaciones/${slug}`
      : `/album/galerias/${slug}`,
  );
}
