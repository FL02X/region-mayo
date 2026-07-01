"use client";

import { Newsreader } from "next/font/google";
import { Info, Archive, CirclePlay, ChevronRight } from "lucide-react";
import type { Album } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/components/sections/album/shared/album-copy";
import {
  formatAlbumPreviewDate,
  formatGalleryMediaCount,
  getAlbumDetailPath,
  getAlbumMediaItems,
  getVideoDurationLabel,
} from "@/components/sections/album/shared/album-utils";
import { markAlbumTransition } from "../album/shared/album-transition";

interface RecentVideosFeedProps {
  album?: Album[];
}

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

function RecordingAlbumListItem({ album }: { album: Album }) {
  const previewVideo = album.videos[0];
  const thumbnailUrl = previewVideo?.thumbnailUrl || album.coverImage;
  const durationLabel = getVideoDurationLabel(previewVideo);

  return (
    <Link
      href={getAlbumDetailPath(album)}
      onClick={markAlbumTransition}
      className="group block active:bg-brand-active"
      aria-label="Abrir grabacion"
    >
      <div className="flex flex-row gap-3 pt-4 pb-4 w-full h-auto items-center group-active:bg-brand-active">
        <div className="relative w-24 min-h-20 aspect-video shrink-0 rounded-md overflow-hidden group-active:bg-transparent">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={album.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black-20 text-white">
            <CirclePlay
              className="w-8 h-8 translate-x-[0.5px] bg-gray-600/80 rounded-full"
              aria-hidden="true"
            />
          </div>
          {durationLabel && (
            <span className="absolute bottom-1 right-1 rounded-[2px] bg-black/85 px-1 py-0.5 text-[9px] font-bold text-white">
              {durationLabel}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 justify-center py-1 min-h-[5rem] pr-10">
          <p className="text-ink-white/70 uppercase text-xs mb-0.5">
            {formatAlbumPreviewDate(album.startDate)}
          </p>
          <p
            className={`${editorialFont.className} text-ink-white font-bold line-clamp-3 text-sm break-words`}
          >
            {album.title}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function RecentVideosFeed({ album }: RecentVideosFeedProps) {
  const allAlbums = album || [];
  const videoAlbums = allAlbums.filter((item) => item.albumType === "youtube");
  const sortedVideos = videoAlbums.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const recentVideos = sortedVideos.slice(0, 3);

  return (
    <div className="md:hidden bg-[#050505] pt-10 pb-10 px-4">
      <div className="mx-auto max-w bg-[#050505]">
        <div className="flex flex-row mb-5 items-center justify-between w-full">
          <div>
            <h2
              className={`${editorialFont.className} font-semibold text-lg  text-ink-white`}
            >
              Grabaciones recientes
            </h2>
          </div>
          <div>
            <Link
              href="/album/grabaciones"
              aria-label="Ver archivo de grabaciones"
              className="mb-0.5 flex flex-row items-center text-center gap-2 text-ink-white text-sm active:bg-brand-active"
            >
              <Archive className="w-4 h-4" />
              <span className="tracking-tighter">Ver archivo</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col">
          {recentVideos.length > 0 ? (
            recentVideos.map((item, index) => (
              <div
                key={index}
                className="border-b border-border last:border-none"
              >
                <RecordingAlbumListItem album={item} />
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm py-4">
              No hay videos recientes disponibles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
