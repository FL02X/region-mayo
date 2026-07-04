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

          <div className="mt-0.5 pt-5">
            <Link
              href={href}
              className="inline-flex min-h-[34px] w-fit max-w-full items-center justify-start gap-2 border border-brand bg-transparent px-3 py-1 text-left text-[17px] font-normal leading-tight text-brand hover:bg-brand-hover hover:text-white [&>span]:min-w-0"
            >
              <span>{buttonLabel}</span>
              <ChevronRight className="h-6 w-6 shrink-0 stroke-[1.4]" aria-hidden="true" />
            </Link>
          </div>
        </div>
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
        className=""
      />
    </div>
  );
}

function AlbumVisual() {
  return (
    <div className="relative mt-1.5 flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden">
      <div className="absolute h-12 w-13 rotate-[-5deg] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
        <div className="h-5 w-full bg-[#c8d8ea]" />
        <div className="mt-1 h-0.5 w-4 bg-[#b6beca]" />
      </div>
      <div className="absolute h-12 w-13 rotate-[6deg] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
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
      <div className="relative w-5/8 border-r border-border mt-5 pb-8">
        <FirstVisitInfoMobile
          cardClassName="border-0 bg-white px-8 mb-3 lg:px-16"
          hiddenNoticeClassName="border-0 bg-white px-5 py-8"
        />

        <div className="mx-8 grid grid-cols-2 divide-x divide-[#dce2e9] border-t border-[#dce2e9] lg:mx-16">
          <SiteLinkCard
            href="/templos"
            title="Encuentra una congregación"
            description="Consulta direcciones, horarios y datos de contacto de los templos de la Región Mayo."
            buttonLabel="Ver templos"
            visual={<TemplosVisual />}
          />

          <SiteLinkCard
            href="/album"
            title="Explora fotos de nuestras actividades"
            description="Recuerdos de de las actividades regionales y generales de la Iglesia Gentil de Cristo."
            buttonLabel="Ver álbumes"
            visual={<AlbumVisual />}
          />
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-8 right-8 border-b-2 border-border lg:left-17 lg:right-17"
          aria-hidden="true"
        />
      </div>

      <div className="flex w-3/8 justify-center bg-[#050505]">
        <RecentVideosFeed
          album={albums}
          className="h-full w-[82%] min-w-0 bg-[#050505] py-20"
        />
      </div>
    </div>
  );
}
