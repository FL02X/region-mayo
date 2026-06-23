// Donde: countdown mobile cuando el spotlight es muro de oraciones. Viewports: mobile. Funcion: muestra CTA de oracion o peticiones seleccionadas.
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
import { MOBILE_FLOATING_CARD_CLASS } from "@/components/sections/home/countdown-section/countdown-utils";

type MobilePrayer = NonNullable<PrayerWallConfig["selectedPrayers"]>[number];

export function MobilePrayerSpotlightCard({
  mode,
  prayers = [],
  editorialFontClassName,
  onCollect,
}: {
  mode: "collect" | "show";
  prayers?: MobilePrayer[];
  editorialFontClassName: string;
  onCollect?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showFullPrayerModal, setShowFullPrayerModal] = useState(false);
  const prayerTextRef = useRef<HTMLParagraphElement | null>(null);

  const currentPrayer = prayers[index];
  const prayerText = currentPrayer?.text ?? "";
  const canNavigate = prayers.length > 1;
  const textSize =
    prayerText.length <= 70
      ? "text-[20px]"
      : prayerText.length <= 135
        ? "text-[18px]"
        : "text-[17px]";

  useLockBodyScroll(showFullPrayerModal);

  useLayoutEffect(() => {
    const textEl = prayerTextRef.current;
    if (!textEl || mode !== "show") return;

    const updateOverflow = () => {
      window.requestAnimationFrame(() => {
        const clone = textEl.cloneNode(true) as HTMLParagraphElement;
        const parent = textEl.parentElement;

        if (!parent) return;

        clone.style.position = "absolute";
        clone.style.visibility = "hidden";
        clone.style.pointerEvents = "none";
        clone.style.display = "block";
        clone.style.webkitLineClamp = "unset";
        clone.style.overflow = "visible";
        clone.style.maxHeight = "none";
        clone.style.height = "auto";
        clone.style.width = `${textEl.clientWidth}px`;
        clone.style.left = "0";
        clone.style.top = "0";

        parent.appendChild(clone);
        const needsMoreSpace =
          clone.getBoundingClientRect().height >
          textEl.getBoundingClientRect().height + 1;
        clone.remove();
        setIsOverflowing(needsMoreSpace);
      });
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [mode, prayerText, textSize]);

  const goToPrayer = (direction: "previous" | "next") => {
    setIndex((current) => {
      if (direction === "previous") {
        return (current - 1 + prayers.length) % prayers.length;
      }

      return (current + 1) % prayers.length;
    });
  };

  return (
    <div
      className={`desktop-card-lift bg-card border border-border overflow-hidden mb-3 ${MOBILE_FLOATING_CARD_CLASS}`}
    >
      <div className="h-[3px] bg-[#2d6a4f]" aria-hidden="true" />
      <div className="flex min-h-[270px] flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2d6a4f]">
            <HeartHandshake className="h-3 w-3" aria-hidden="true" />
            Oraciones
          </span>
        </div>

        {mode === "collect" ? (
          <>
            <h3
              className={`${editorialFontClassName} type-human-title mb-2 text-[22px] font-bold leading-snug`}
            >
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
            <div className="flex min-h-0 flex-1 items-center justify-center">
              {currentPrayer ? (
                <div className="w-full mt-3.5 px-[3px] ml-[-15px]">
                  <p
                    ref={prayerTextRef}
                    className={`${editorialFontClassName} type-human ${textSize} text-justify font-normal italic leading-[1.62] px-[2px]`}
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 7,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      className="block"
                      style={{
                        paddingLeft: "0.75em",
                        textIndent: "-0.75em",
                      }}
                    >
                      <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">
                        “
                      </span>
                      <span>{currentPrayer.text}</span>
                      <span className="ml-0.5 font-serif text-[1.35em] leading-none text-[#9aa3ad]">
                        ”
                      </span>
                    </span>
                  </p>
                  {isOverflowing && (
                    <div className="pl-[0.75em]">
                      <button
                        type="button"
                        onClick={() => setShowFullPrayerModal(true)}
                        className="mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-normal leading-tight text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2"
                      >
                        Leer más
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p
                  className={`${editorialFontClassName} type-human text-center text-[18px] leading-relaxed`}
                >
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

                <div
                  className="flex items-center justify-center gap-1.5"
                  aria-label={`Oración ${index + 1} de ${prayers.length}`}
                >
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
                  <h3 className="text-[17px] font-bold text-white">
                    Oración completa
                  </h3>
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
                  <p
                    className={`${editorialFontClassName} type-human text-[16px] italic leading-relaxed`}
                  >
                    “{currentPrayer.text}”
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
