"use client";

import { FirstVisitInfoMobile } from "@/components/sections/home/first-visit-info.mobile";
import { RecentVideosFeed } from "@/components/sections/home/recent-videos-feed";
import type { Album } from "@/lib/types";

interface DesktopHomeInfoWrapperProps {
  albums?: Album[];
}

export function DesktopHomeInfoWrapper({ albums }: DesktopHomeInfoWrapperProps) {
  return (
    <div className="hidden md:grid max-w-[950px] mx-auto grid-cols-2 border-x border-[#dce2e9] bg-white">
      <div className="min-w-0 border-r border-[#dce2e9]">
        <FirstVisitInfoMobile
          cardClassName="h-full border-0 bg-white px-6"
          hiddenNoticeClassName="h-full border-0 bg-white px-6 py-8"
        />
      </div>

      <div className="min-w-0">
        <RecentVideosFeed
          album={albums}
          className="h-full bg-[#050505] px-6 py-8"
        />
      </div>
    </div>
  );
}
