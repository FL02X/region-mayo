// Donde: bloque mobile de primera visita en home. 
// Viewports: mobile. 
// Funcion: piezas visuales para card, aviso ocultado y modal FAQ.
import Image from "next/image";
import { ChevronDown, ChevronRight, Undo2 } from "lucide-react";
import type { RefObject } from "react";
import {
  FIRST_VISIT_COPY,
  FIRST_VISIT_QUESTIONS,
  type FirstVisitQuestion,
} from "@/components/sections/home/first-visit/first-visit-copy";

export function FirstVisitHiddenNotice({
  isVisible,
  onRestore,
  className = "md:hidden border-y bg-white px-[20px] py-3",
}: {
  isVisible: boolean;
  onRestore: () => void;
  className?: string;
}) {
  return (
    <section
      aria-label={FIRST_VISIT_COPY.hiddenSectionLabel}
      className={className}
    >
      <div
        className="flex items-center justify-between gap-3 border border-[#d9dee7] bg-paper-highlight px-3.5 py-3"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
      >
        <p className="min-w-0 text-[14px] font-medium leading-tight text-[#071329]">
          {FIRST_VISIT_COPY.hiddenText}
        </p>
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold leading-none text-brand"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          <span>{FIRST_VISIT_COPY.restoreLabel}</span>
        </button>
      </div>
    </section>
  );
}

export function FirstVisitCard({
  contentRef,
  isHiding,
  collapseMaxHeight,
  transitionStyle,
  titleFontClassName,
  onOpen,
  className = "md:hidden border-y bg-white px-[20px]",
}: {
  contentRef: RefObject<HTMLDivElement | null>;
  isHiding: boolean;
  collapseMaxHeight?: string;
  transitionStyle: string;
  titleFontClassName: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <section
      aria-label={FIRST_VISIT_COPY.sectionLabel}
      className={className}
      style={{
        opacity: isHiding ? 0 : 1,
        maxHeight: isHiding ? 0 : collapseMaxHeight,
        marginTop: isHiding ? 0 : undefined,
        marginBottom: isHiding ? 0 : undefined,
        overflow: isHiding ? "hidden" : "visible",
        transition: transitionStyle,
      }}
    >
      <div ref={contentRef} className="pt-8 pb-10 md:pt-12">
        <div className="flex items-start gap-3">
          <div className="relative mt-1.5 pr-12 h-[50px] w-[50px] md:h-[70px] md:w-[70px] shrink-0 overflow-hidden bg-[#1d3765]">
            <Image src="/images/faq4.png" alt="Preguntas frecuentes" fill sizes="50px" className="object-cover" />
          </div>

          <div className="min-w-0 flex-1 pt-0.5 md:pl-5">
            <h2 className={`${titleFontClassName} text-[22px] font-bold leading-[1.18]`}>
              {FIRST_VISIT_COPY.cardTitle}
            </h2>
            <p className="mt-2.5 text-[15px] font-normal leading-[1.5] text-[#071329]">
              {FIRST_VISIT_COPY.cardDescription}
            </p>
          </div>
        </div>

        <div className="mt-0.5 pt-5 md:pl-11">
          <button
            type="button"
            onClick={onOpen}
            className="ml-[58px] inline-flex min-h-[34px] w-fit max-w-[calc(100%-58px)] items-center justify-start gap-2 bg-brand px-3 py-1 text-left text-[17px] font-normal leading-tight text-white [&>span]:min-w-0 hover:bg-brand-active"
          >
            <span>{FIRST_VISIT_COPY.cardButtonLabel}</span>
            <ChevronRight className="h-6 w-6 shrink-0 stroke-[1.4]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function FirstVisitModal({
  isActive,
  openQuestion,
  scrollContainerRef,
  questionRefs,
  questionFontClassName,
  onClose,
  onQuestionToggle,
}: {
  isActive: boolean;
  openQuestion: string | null;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  questionRefs: RefObject<Record<string, HTMLDivElement | null>>;
  questionFontClassName: string;
  onClose: () => void;
  onQuestionToggle: (question: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden sm:p-4">
      <button
        type="button"
        aria-label={FIRST_VISIT_COPY.modalCloseLabel}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-visit-title"
        className="relative flex h-[100dvh] min-h-[100svh] w-screen flex-col overflow-hidden bg-white font-sans sm:h-auto sm:min-h-0 sm:max-h-[72vh] sm:w-[min(600px,92vw)] sm:rounded-lg"
        style={{
          opacity: isActive ? 1 : 0,
          transform: isActive ? "none" : "scale(0.985) translateY(6px)",
          transition: "transform 180ms ease, opacity 180ms ease",
        }}
      >
        <div className="z-10 flex items-center justify-between bg-[#21252b] py-2 pl-4 pr-2">
          <h3 id="first-visit-title" className="m-0 text-base font-semibold uppercase text-white">
            {FIRST_VISIT_COPY.modalTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={FIRST_VISIT_COPY.modalCloseLabel}
            className="flex h-[48px] w-[52px] items-center justify-center text-white"
          >
            <span className="flex h-[30px] items-center text-[30px] leading-none mb-1 -translate-y-px">
              ×
            </span>
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-paper px-5 py-5 text-left">
          <div className="mx-auto max-w-[520px]">
            {FIRST_VISIT_QUESTIONS.map((item) => (
              <FirstVisitQuestionItem
                key={item.question}
                item={item}
                isOpen={openQuestion === item.question}
                questionFontClassName={questionFontClassName}
                onToggle={() => onQuestionToggle(item.question)}
                setQuestionRef={(node) => {
                  questionRefs.current[item.question] = node;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FirstVisitQuestionItem({
  item,
  isOpen,
  questionFontClassName,
  onToggle,
  setQuestionRef,
}: {
  item: FirstVisitQuestion;
  isOpen: boolean;
  questionFontClassName: string;
  onToggle: () => void;
  setQuestionRef: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={setQuestionRef} className="border-b border-[#d9dee7] bg-paper">
      <button
        type="button"
        className={`${questionFontClassName} flex min-h-[62px] w-full items-center justify-between gap-4 bg-paper px-3 py-3 text-left text-ink text-[24px] leading-snug ${
          isOpen ? "font-bold" : "font-normal"
        }`}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span>{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <p className="px-2 pb-4 pt-0 text-[20px] leading-6 bg-paper-dark text-ink pt-3.5">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
