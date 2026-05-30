"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft,
  Church,
  Copy,
  Image as ImageIcon,
  Music,
  Share2,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

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

  const qrUrl = useMemo(() => {
    if (!currentUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=10&data=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

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

  const modal =
    isMounted && isShareOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Compartir sección"
          >
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Cerrar compartir"
              onClick={() => setIsShareOpen(false)}
            />
            <div
              className="relative w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-14 items-center justify-between bg-[#757575] pl-5">
                <h3 className="text-[17px] font-bold text-white">Compartir</h3>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-3 border border-border bg-[#f7f7f7] p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{currentLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">{currentUrl}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {copied ? "Enlace copiado" : "Copiar enlace"}
                  </button>

                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`Código QR para ${currentLabel}`}
                      className="h-28 w-28 border border-border bg-white"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="mt-[51px] bg-[#f1f1f1] md:mt-[45px]">
        <div className="mx-auto flex h-11 max-w-[950px] md:max-w-[952px] items-center justify-between md:border-x-2 border-b border-[#d6d0c5] bg-[#f1f1f1] px-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)] md:px-8">
          <div className="min-w-0">
            {parentHref && parentLabel ? (
              <Button asChild variant="ghost" className="h-9 rounded-none px-0 text-sm">
                <Link href={parentHref}>
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  {parentLabel}
                </Link>
              </Button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-none px-2 text-sm md:px-3"
            onClick={() => setIsShareOpen(true)}
            aria-label="Compartir"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2 hidden md:inline">Compartir</span>
          </Button>
        </div>
      </div>
      {modal}
    </>
  );
}
