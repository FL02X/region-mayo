"use client";

import { FirstVisitInfoMobile } from "@/components/sections/home/first-visit-info.mobile";
import { RecentVideosFeed } from "@/components/sections/home/recent-videos-feed";
import { Newsreader } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Album } from "@/lib/types";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

interface DesktopHomeInfoWrapperProps {
  albums?: Album[];
}

interface SiteLinkCardProps {
  href: string;
  title: string;
  description: string;
  buttonLabel: string;
  visual: ReactNode;
}

function SiteLinkCard({
  href,
  title,
  description,
  buttonLabel,
  visual,
}: SiteLinkCardProps) {
  return (
    <article className="min-w-0 px-3 py-8 first:pl-0 last:pr-0 mt-5 lg:px-6">
      <div className="flex items-start gap-4 lg:gap-6">
        {visual}

        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className={`${editorialFont.className} text-[22px] font-bold leading-[1.18]`}>
            {title}
          </h2>
          <p className="mt-2.5 text-[15px] font-normal leading-[1.5] text-[#071329]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-0.5 pt-5">
        <Link
          href={href}
          className="ml-[66px] inline-flex min-h-[34px] w-fit max-w-[calc(100%-58px)] items-center justify-start gap-2 border border-brand bg-transparent px-3 py-1 text-left text-[17px] font-normal leading-tight text-brand hover:bg-brand-hover hover:text-white lg:ml-[70px] [&>span]:min-w-0"
        >
          <span>{buttonLabel}</span>
          <ChevronRight className="h-6 w-6 shrink-0 stroke-[1.4]" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function TemplosVisual() {
  return (
    <div className="relative mt-1.5 flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden">
      <Image
        src="/images/iglesias2.png"
        alt=""
        fill
        sizes="50px"
        className="object-contain scale-110"
      />
    </div>
  );
}

function AlbumVisual() {
  return (
    <div className="relative mt-1.5 flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden bg-[#1d3765]">
      <div className="absolute h-8 w-9 rotate-[-5deg] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
        <div className="h-5 w-full bg-[#c8d8ea]" />
        <div className="mt-1 h-0.5 w-4 bg-[#b6beca]" />
      </div>
      <div className="absolute h-8 w-9 rotate-[6deg] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
        <div className="h-5 w-full bg-[linear-gradient(135deg,#1d3765_0%,#2f6ba3_55%,#d8e5f3_55%,#f4f7fb_100%)]" />
        <div className="mt-1 h-0.5 w-5 bg-[#b6beca]" />
      </div>
    </div>
  );
}

export function DesktopHomeInfoWrapper({
  albums,
}: DesktopHomeInfoWrapperProps) {
  return (
    <div className="hidden desktop-content-pane md:flex md:flex-col-2 max-w-[1150px] mx-auto grid-cols-2 border-x border-[#dce2e9] bg-white">
      <div className="w-5/8 border-r md:border-b-2 border-border mt-5 pb-8">
        <FirstVisitInfoMobile
          cardClassName="border-0 bg-white px-8 mb-1 lg:px-17"
          hiddenNoticeClassName="border-0 bg-white px-5 py-8"
        />

        <div className="mx-8 grid grid-cols-2 divide-x divide-[#dce2e9] border-t border-[#dce2e9] lg:mx-17">
          <SiteLinkCard
            href="/templos"
            title="Encuentra un templo"
            description="Consulta direcciones, horarios y datos de contacto de los templos de la Región Mayo."
            buttonLabel="Ver templos"
            visual={<TemplosVisual />}
          />

          <SiteLinkCard
            href="/album"
            title="Explora los álbumes"
            description="Revive galerías, fotos y recuerdos de las actividades regionales."
            buttonLabel="Ver álbumes"
            visual={<AlbumVisual />}
          />
        </div>
      </div>

      <div className="w-3/8">
        <RecentVideosFeed
          album={albums}
          className="h-full bg-[#050505] px-6 py-20 lg:px-10"
        />
      </div>
    </div>
  );
}
