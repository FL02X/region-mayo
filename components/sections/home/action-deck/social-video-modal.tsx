// Donde: modal al tocar un reel/video social en action deck. Viewports: desktop y mobile. Funcion: embebe videos de Instagram o Facebook.
import { useEffect } from "react";
import { X } from "lucide-react";
import type { DeckItem } from "@/components/sections/home/action-deck/action-deck-types";
import { BADGE_META } from "@/components/sections/home/action-deck/action-deck-types-copy";
import { getSocialEmbedUrl } from "@/components/sections/home/action-deck/action-deck-utils";

export function SocialVideoModal({
  item,
  onClose,
}: {
  item: Extract<DeckItem, { type: "instagram" | "facebook" }>;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const embedUrl = getSocialEmbedUrl(item);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Video de ${BADGE_META[item.type].label}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#111827] shadow-lg transition-colors hover:bg-[#f3f4f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Cerrar video"
      >
        <X className="h-7 w-7" aria-hidden="true" />
      </button>

      <div
        className="h-full max-h-[92vh] w-full max-w-[520px] overflow-hidden rounded-[6px] bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <iframe
          title={`Video de ${BADGE_META[item.type].label}`}
          src={embedUrl}
          className="h-full w-full border-0"
          allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
