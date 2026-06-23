// Donde: cada tarjeta informativa de home. Viewports: desktop y mobile. Funcion: pinta una tarjeta y su accion opcional.
import { ChevronRight } from "lucide-react";
import type { HomeInfoCardItem } from "@/components/sections/home/home-info-cards/home-info-copy";
import { HOME_INFO_DOWNLOAD_COPY } from "@/components/sections/home/home-info-cards/home-info-copy";

export function HomeInfoCard({
  card,
  isDownloading,
  isOnline,
  onDownload,
}: {
  card: HomeInfoCardItem;
  isDownloading: boolean;
  isOnline: boolean;
  onDownload: () => void;
}) {
  const Icon = card.icon;
  const isHymnalCard = card.id === "hymnal";

  return (
    <div className="bg-paper-highlight border border-[#E5E7EB] overflow-hidden h-full flex flex-col">
      <div className="p-4 md:p-5 h-full flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <div className="shrink-0 flex items-center justify-center">
            <Icon
              className="h-5 w-5 md:h-6 md:w-6"
              style={{ color: "#2f5e93" }}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-medium uppercase tracking-wider mb-1"
              style={{ color: "#6B7280" }}
            >
              {card.eyebrow}
            </p>
            <p className="text-sm font-medium text-foreground leading-tight mb-2">
              {card.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              {card.subtitle}
              {isHymnalCard && isDownloading && HOME_INFO_DOWNLOAD_COPY.downloadingSuffix}
              {isHymnalCard && !isOnline && HOME_INFO_DOWNLOAD_COPY.offlineSuffix}
            </p>

            <div className="mt-2">
              {card.href ? (
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5e93] hover:text-[#284e79] transition-colors"
                >
                  {card.actionLabel}
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : isHymnalCard ? (
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={!isOnline}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#2f5e93] hover:text-[#284e79] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {card.actionLabel}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
