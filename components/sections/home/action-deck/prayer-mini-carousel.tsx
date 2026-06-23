// Donde: tarjeta de oraciones dentro del action deck. Viewports: desktop y mobile. Funcion: muestra oraciones seleccionadas y permite leer textos largos.
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PrayerMiniCarousel({
  prayers,
  deckLength = 1,
  isDesktop = false,
  editorialFontClassName,
  onOpenModal,
}: {
  prayers: string[];
  deckLength?: number;
  isDesktop?: boolean;
  editorialFontClassName: string;
  onOpenModal?: (text: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const prayerTextRef = useRef<HTMLParagraphElement>(null);

  if (prayers.length === 0) {
    return (
      <p className={`${editorialFontClassName} type-human text-[15px] leading-relaxed`}>
        La comunidad está orando · únete
      </p>
    );
  }

  const currentPrayer = prayers[index];
  const textSize =
    currentPrayer.length <= 70
      ? isDesktop
        ? "text-[19px]"
        : "text-[18px]"
      : currentPrayer.length <= 135
        ? "text-[17px]"
        : "text-[16px]";
  const textAlign = "text-left";
  const minHeight = isDesktop && deckLength === 1 ? "min-h-[184px]" : "min-h-[158px]";
  const canNavigate = prayers.length > 1;
  const maxVisibleLines = isOverflowing ? 6 : 7;

  useLayoutEffect(() => {
    const textEl = prayerTextRef.current;
    if (!textEl) return;

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
          clone.getBoundingClientRect().height > textEl.getBoundingClientRect().height + 1;
        clone.remove();
        setIsOverflowing(needsMoreSpace);
      });
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);
    return () => window.removeEventListener("resize", updateOverflow);
  }, [currentPrayer, textSize, isDesktop, deckLength]);

  const goToPrayer = (direction: "previous" | "next") => {
    setIndex((current) => {
      if (direction === "previous") return (current - 1 + prayers.length) % prayers.length;
      return (current + 1) % prayers.length;
    });
  };

  return (
    <div className="mb-1 flex min-h-0 flex-1 flex-col">
      <div className={`${minHeight} flex min-h-0 flex-1 items-center justify-center`}>
        <div className="w-full">
          <p
            ref={prayerTextRef}
            className={`${editorialFontClassName} type-human ${textSize} italic leading-[1.62] ${textAlign}`}
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: maxVisibleLines,
              overflow: "hidden",
            }}
          >
            <span className="relative block pl-[0.75em]">
              <span className="absolute left-0 top-0 font-serif text-[1.35em] leading-none text-[#9aa3ad]">
                “
              </span>
              <span>{currentPrayer}</span>
              <span className="font-serif text-[1.35em] leading-none text-[#9aa3ad]">”</span>
            </span>
          </p>
          {isOverflowing && onOpenModal ? (
            <div className="pl-[0.75em]">
              <button
                type="button"
                onClick={() => onOpenModal(currentPrayer)}
                className="mt-4 inline-flex w-fit items-center gap-1 text-[15px] font-normal leading-tight text-primary transition-colors hover:text-primary/80 hover:underline underline-offset-2"
              >
                Leer más
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {prayers.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2.5">
          {canNavigate ? (
            <button
              type="button"
              onClick={() => goToPrayer("previous")}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
              aria-label="Ver oración anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          <div
            className="flex items-center justify-center gap-1.5"
            aria-label={`Oración ${index + 1} de ${prayers.length}`}
          >
            {prayers.map((_, prayerIndex) => (
              <span
                key={prayerIndex}
                className={`h-2 rounded-full transition-all duration-300 ${
                  prayerIndex === index ? "w-7 bg-[#2d6a4f]" : "w-2 bg-[#c9d2d8]"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          {canNavigate ? (
            <button
              type="button"
              onClick={() => goToPrayer("next")}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#eef2f5] hover:text-[#2d6a4f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5e93]"
              aria-label="Ver siguiente oración"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
