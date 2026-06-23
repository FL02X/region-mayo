// Donde: hero desktop cuando el spotlight es muro de oraciones. Viewports: desktop. Funcion: muestra CTA de oracion o carrusel de peticiones.
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
} from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import type { PrayerWallConfig } from "@/lib/types";

type HeroPrayer = NonNullable<PrayerWallConfig["selectedPrayers"]>[number];

export function HeroPrayerCard({
  mode,
  prayers = [],
  editorialFontClassName,
  onCollect,
}: {
  mode: "collect" | "show";
  prayers?: HeroPrayer[];
  editorialFontClassName: string;
  onCollect?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const prayerTextRef = useRef<HTMLParagraphElement | null>(null);

  const currentPrayer = prayers[index];
  const canNavigate = prayers.length > 1;
  const prayerText = currentPrayer?.text ?? "";
  const textSize =
    prayerText.length <= 70
      ? "text-[20px]"
      : prayerText.length <= 135
        ? "text-[18px]"
        : "text-[17px]";
  const maxVisibleLines = 5;

  useLockBodyScroll(showFullPrayerModal);

  useLayoutEffect(() => {
    const textEl = prayerTextRef.current;
    if (!textEl || mode !== "show") return;

    const updateOverflow = () => {
      window.requestAnimationFrame(() => {
        const needsMoreSpace = textEl.scrollHeight > textEl.clientHeight + 1;
        setIsOverflowing(needsMoreSpace);
      });
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [mode, prayerText, textSize]);

  const goToPrayer = (direction: "previous" | "next") => {
    setIndex((current) => {
      if (direction === "previous") return (current - 1 + prayers.length) % prayers.length;
      return (current + 1) % prayers.length;
    });
  };

  return (
    <article className="desktop-next-event-lift relative flex min-h-[270px] w-full flex-col overflow-hidden rounded-[2px] bg-white/93 p-4 backdrop-blur-[1px]">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2d6a4f]">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            Peticiones de oracion
          </span>
        </div>

        {mode === "collect" ? (
          <>
            <h3 className={`${editorialFontClassName} type-human-title mb-2 text-[22px] font-bold leading-snug`}>
              Muro de oraciones · comparte tu petición
            </h3>
            <p className="type-system mb-5 text-[15px] leading-relaxed">
              Tu mensaje es anónimo y será revisado por el equipo.
            </p>
            <button
              type="button"
              onClick={onCollect}
              className="mt-auto inline-flex w-fit items-center gap-1 text-[17px] font-semibold leading-tight text-[#2d6a4f] transition-colors hover:text-[#24573f] hover:underline underline-offset-2"
            >
              Pedir oración
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <div className="mt-0 flex min-h-0 flex-1 items-center justify-center">
              {currentPrayer ? (
                <div className="w-full">
                  <p
                    ref={prayerTextRef}
                    className={`${editorialFontClassName} type-human ${textSize} text-center font-normal italic leading-[1.62]`}
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: maxVisibleLines,
                      overflow: "hidden",
                    }}
                  >
                    <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">“</span>
                    {currentPrayer.text}
                    <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">”</span>
                  </p>
                  {isOverflowing && (
                    <button
                      type="button"
                      onClick={() => setShowFullPrayerModal(true)}
                      className="mx-auto ml-2 mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-normal leading-tight text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2"
                    >
                      Leer completo...
                    </button>
                  )}
                </div>
              ) : (
                <p className={`${editorialFontClassName} type-human text-center text-[18px] leading-relaxed`}>
                  La comunidad está orando · únete
                </p>
              )}
            </div>

            {canNavigate && (
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => goToPrayer("previous")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
                  aria-label="Ver oración anterior"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="flex items-center justify-center gap-1.5" aria-label={`Oración ${index + 1} de ${prayers.length}`}>
                  {prayers.map((prayer, idx) => (
                    <span
                      key={prayer._id ?? `${prayer.submittedAt}-${idx}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === index ? "w-7 bg-[#2d6a4f]" : "w-2 bg-[#c9d2d8]"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToPrayer("next")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
                  aria-label="Ver siguiente oración"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showFullPrayerModal && currentPrayer
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Oración completa"
            >
              <button
                type="button"
                className="absolute inset-0"
                aria-label="Cerrar oración completa"
                onClick={() => setShowFullPrayerModal(false)}
              />
              <div
                className="relative max-h-[80vh] w-full max-w-md overflow-hidden border border-black bg-white shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex h-16 items-center justify-between bg-[#757575] pl-5">
                  <h3 className="text-[17px] font-bold text-white">Oración completa</h3>
                  <button
                    type="button"
                    onClick={() => setShowFullPrayerModal(false)}
                    className="flex h-full w-14 items-center justify-center bg-[#434343] text-white transition-colors hover:bg-[#2f2f2f]"
                    aria-label="Cerrar"
                  >
                    <span className="text-3xl leading-none">×</span>
                  </button>
                </div>
                <div className="max-h-[calc(80vh-64px)] overflow-y-auto p-6">
                  <p className={`${editorialFontClassName} type-human text-[16px] italic leading-relaxed`}>
                    “{currentPrayer.text}”
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}
