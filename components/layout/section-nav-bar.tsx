"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Church,
  Image as ImageIcon,
  Music,
  Share2,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { ShareModal } from "@/components/layout/section-nav/share-modal";

type SectionIconName = "templos" | "pastores" | "coros" | "directiva" | "album";

interface SectionNavBarProps {
  currentLabel: string;
  parentHref?: string;
  parentLabel?: string;
  icon?: SectionIconName;
}

const ICONS: Record<SectionIconName, LucideIcon> = {
  templos: Church,
  pastores: Users,
  coros: Music,
  directiva: UserCircle,
  album: ImageIcon,
};

const sectionNavActionButtonClass =
  "inline-flex h-10 w-fit items-center gap-1.5 rounded-sm border border-transparent bg-transparent px-3 text-sm font-medium text-black transition-[background-color,border-color] duration-150 hover:border-[var(--border)] hover:bg-surface-pane focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005998]";

const ALBUM_TRANSITION_STORAGE_KEY = "rm-album-transition-next";

export function SectionNavBar({
  currentLabel,
  parentHref,
  parentLabel,
  icon = "album",
}: SectionNavBarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[icon];
  useLockBodyScroll(isShareOpen);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!isShareOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsShareOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShareOpen]);

  const qrUrl = currentUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=10&data=${encodeURIComponent(currentUrl)}`
    : "";

  const copyLink = async () => {
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const markAlbumBackTransition = () => {
    if (!parentHref?.startsWith("/album")) return;

    try {
      // Guardamos solo una marca temporal para que el album anime el regreso sin cambiar la URL.
      sessionStorage.setItem(ALBUM_TRANSITION_STORAGE_KEY, "true");
    } catch {
      // La transicion es decorativa; si storage falla, el regreso normal sigue funcionando.
    }
  };

  return (
    <>
      <div className="mt-[51px] bg-[#f1f1f1] md:mt-[45px]">
        <div className="mx-auto flex h-11 max-w-[950px] md:max-w-[952px] items-center justify-between md:border-x-2 border-b border-[#d6d0c5] bg-[#f1f1f1] px-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)] md:px-8">
          <div className="min-w-0">
            {parentHref && parentLabel ? (
              <Link
                href={parentHref}
                className={`${sectionNavActionButtonClass} -ml-[14px]`}
                onClick={markAlbumBackTransition}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {parentLabel}
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            className={sectionNavActionButtonClass}
            onClick={() => setIsShareOpen(true)}
            aria-label="Compartir"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Compartir</span>
          </button>
        </div>
      </div>

      <ShareModal
        isMounted={isMounted}
        isOpen={isShareOpen}
        currentLabel={currentLabel}
        currentUrl={currentUrl}
        qrUrl={qrUrl}
        copied={copied}
        icon={Icon}
        onClose={() => setIsShareOpen(false)}
        onCopyLink={copyLink}
      />
    </>
  );
}
