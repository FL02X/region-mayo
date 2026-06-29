// Donde: no renderiza UI directo. 
// Viewports: afecta todas las vistas de album. 
// Funcion: formatos, rutas y helpers simples.
import type { Album, AlbumGalleryItem, AlbumVideo } from "@/lib/types";

export function formatAlbumDate(startDate: Date, endDate: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} - ${end}`;
}

export function formatAlbumPreviewDate(startDate: Date) {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return formatter.format(startDate);
}

export function formatMediaCount(count: number, isVideo: boolean) {
  if (isVideo) {
    return `${count} ${count === 1 ? "video" : "videos"}`;
  }
  return `${count} ${count === 1 ? "foto" : "fotos"}`;
}

export function getAlbumMediaItems(album: Album): AlbumGalleryItem[] {
  return album.media?.length > 0 ? album.media : album.images;
}

export function formatGalleryMediaCount(album: Album) {
  const mediaItems = getAlbumMediaItems(album);
  const photoCount = mediaItems.filter((item) => item.type === "image").length;
  const videoCount = mediaItems.filter((item) => item.type === "video").length;

  if (videoCount === 0) return formatMediaCount(photoCount, false);
  if (photoCount === 0) return formatMediaCount(videoCount, true);

  return `${photoCount} ${photoCount === 1 ? "foto" : "fotos"} / ${videoCount} ${
    videoCount === 1 ? "video" : "videos"
  }`;
}

export function getGalleryItemPreviewUrl(item: AlbumGalleryItem): string | undefined {
  return item.type === "video" ? item.posterUrl : item.url;
}

export function getAlbumSectionPath(albumType: Album["albumType"]) {
  return albumType === "youtube" ? "/album/grabaciones" : "/album/galerias";
}

export function getAlbumDetailPath(album: Album) {
  return `${getAlbumSectionPath(album.albumType)}/${album.slug}`;
}

export function getAlbumTypeLabel(albumType: Album["albumType"]) {
  return albumType === "youtube" ? "Grabacion" : "Galeria";
}

export function formatHubRecentContext(album: Album) {
  const isYoutubeAlbum = album.albumType === "youtube";
  const itemLabel = isYoutubeAlbum
    ? formatMediaCount(album.videos.length, true)
    : formatGalleryMediaCount(album);
  return `${getAlbumTypeLabel(album.albumType)} · ${itemLabel}`;
}

export function getRecentAlbums(albums: Album[], limit = 5) {
  return [...albums]
    .filter((album) => !album.hidden)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .slice(0, limit);
}

export function getAlbumYear(album: Album) {
  return album.startDate.getUTCFullYear().toString();
}

export function filterAlbumsByChip(albums: Album[], activeFilter: string) {
  if (activeFilter === "all") {
    return albums;
  }

  const [filterType, filterValue] = activeFilter.split(":");

  if (filterType === "year") {
    return albums.filter((album) => getAlbumYear(album) === filterValue);
  }

  if (filterType === "category") {
    return albums.filter((album) => album.category === filterValue);
  }

  return albums;
}

export function getVideoDurationLabel(video?: AlbumVideo) {
  if (!video) return undefined;

  const videoWithDuration = video as AlbumVideo & {
    duration?: string;
    durationLabel?: string;
    durationSeconds?: number;
  };

  if (videoWithDuration.durationLabel) {
    return videoWithDuration.durationLabel;
  }

  if (videoWithDuration.duration) {
    return videoWithDuration.duration;
  }

  if (typeof videoWithDuration.durationSeconds === "number") {
    const totalSeconds = Math.max(0, Math.floor(videoWithDuration.durationSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return undefined;
}
