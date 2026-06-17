"use client";

import { useEffect, useRef, useState } from "react";
import { Newsreader } from "next/font/google";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Undo2 } from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const QUESTIONS = [
  {
    question: "¿Puedo asistir aunque no sea miembro?",
    answer: "¡Sí! Todos son bienvenidos.",
  },
  {
    question: "¿Necesito registrarme?",
    answer: "¡No es necesario! Puedes asistir directamente.",
  },
  {
    question: "¿Que ropa permiten llevar?",
    answer:
      "Puedes asistir con cualquier ropa respetuosa. ¡Algunos miembros usan uniforme en ciertos eventos!",
  },
  {
    question: "¿Tiene costo?",
    answer: "No. La entrada es gratuita.",
  },
  {
    question: "¿Qué habrá en la reunión?",
    answer: "Alabanza, agradecimiento a Dios por parte de los hermanos, predicación y convivencia al terminar.",
  },
  {
    question: "¿Cómo llego?",
    answer: "Puedes usar el botón de Maps dentro de cada evento o templo. ¡Te esperamos!",
  },
];

const INITIAL_OPEN_QUESTION = QUESTIONS[0]?.question ?? null;
const DISMISSED_STORAGE_KEY = "rm-first-visit-info-dismissed";
const DEBUG_DISMISS_PARAM = "debugFirstVisitDismiss";
const RESET_DISMISS_PARAM = "resetFirstVisitDismiss";
const MODAL_CLOSE_DURATION_MS = 180;
const CARD_HIDE_DELAY_MS = 120;
const CARD_FADE_DURATION_MS = 200;
const CARD_COLLAPSE_DELAY_MS = CARD_HIDE_DELAY_MS + CARD_FADE_DURATION_MS;
const CARD_COLLAPSE_DURATION_MS = 250;
const CARD_EXPANDED_MAX_HEIGHT_FALLBACK = 280;

export function FirstVisitInfoMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    INITIAL_OPEN_QUESTION,
  );
  const [mounted, setMounted] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [allowLocalhostDismissal, setAllowLocalhostDismissal] = useState(false);
  const [dismissalChecked, setDismissalChecked] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [undoNoticeVisible, setUndoNoticeVisible] = useState(false);
  const [expandedCardHeight, setExpandedCardHeight] = useState(
    CARD_EXPANDED_MAX_HEIGHT_FALLBACK,
  );
  const cardContentRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const local =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const searchParams = new URLSearchParams(window.location.search);
    // Local-only debug URLs:
    // http://localhost:3000/?debugFirstVisitDismiss=1
    // http://localhost:3000/?resetFirstVisitDismiss=1
    // http://localhost:3000/?debugFirstVisitDismiss=1&resetFirstVisitDismiss=1
    const canDismissOnLocalhost =
      local && searchParams.get(DEBUG_DISMISS_PARAM) === "1";
    const shouldResetDismissal = searchParams.get(RESET_DISMISS_PARAM) === "1";

    setIsLocalhost(local);
    setAllowLocalhostDismissal(canDismissOnLocalhost);

    try {
      if (shouldResetDismissal) {
        window.localStorage.removeItem(DISMISSED_STORAGE_KEY);
      }

      if (!local || canDismissOnLocalhost) {
        setIsDismissed(
          window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true",
        );
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    setDismissalChecked(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const syncStandaloneMode = () => {
      setIsStandalonePwa(
        standaloneQuery.matches ||
          (window.navigator as { standalone?: boolean }).standalone === true,
      );
    };

    syncStandaloneMode();
    standaloneQuery.addEventListener("change", syncStandaloneMode);
    return () => standaloneQuery.removeEventListener("change", syncStandaloneMode);
  }, []);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setModalActive(false);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setModalActive(true);
      return;
    }

    const raf = requestAnimationFrame(() => setModalActive(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeModalTimeoutRef.current) {
        clearTimeout(closeModalTimeoutRef.current);
      }

      if (hideDelayTimeoutRef.current) {
        clearTimeout(hideDelayTimeoutRef.current);
      }

      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDismissed || !undoAvailable) {
      setUndoNoticeVisible(false);
      return;
    }

    const raf = requestAnimationFrame(() => setUndoNoticeVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isDismissed, undoAvailable]);

  useEffect(() => {
    const content = cardContentRef.current;
    if (!content) return;

    const syncExpandedCardHeight = () => {
      setExpandedCardHeight(Math.ceil(content.scrollHeight));
    };

    syncExpandedCardHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(syncExpandedCardHeight);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, []);

  const scrollToQuestion = (question: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        const questionElement = questionRefs.current[question];

        if (!container || !questionElement) return;

        const containerRect = container.getBoundingClientRect();
        const questionRect = questionElement.getBoundingClientRect();
        const top = container.scrollTop + questionRect.top - containerRect.top - 8;

        container.scrollTo({
          top: Math.max(top, 0),
          behavior: "auto",
        });
      });
    });
  };

  const handleQuestionToggle = (question: string) => {
    setOpenQuestion((current) => {
      const nextQuestion = current === question ? null : question;

      if (nextQuestion) {
        scrollToQuestion(nextQuestion);
      }

      return nextQuestion;
    });
  };

  const hideCardAfterModalClose = () => {
    if (isLocalhost && !allowLocalhostDismissal) return;

    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    } catch {
      // Preference persistence is best-effort; the hide animation should still run.
    }

    if (hideDelayTimeoutRef.current) {
      clearTimeout(hideDelayTimeoutRef.current);
    }

    hideDelayTimeoutRef.current = setTimeout(() => {
      setIsHiding(true);
    }, CARD_HIDE_DELAY_MS);

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    dismissTimeoutRef.current = setTimeout(() => {
      setUndoAvailable(true);
      setIsDismissed(true);
    }, CARD_COLLAPSE_DELAY_MS + CARD_COLLAPSE_DURATION_MS);
  };

  const closeModal = () => {
    setModalActive(false);

    if (closeModalTimeoutRef.current) {
      clearTimeout(closeModalTimeoutRef.current);
    }

    closeModalTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      hideCardAfterModalClose();
    }, MODAL_CLOSE_DURATION_MS);
  };

  const restoreCard = () => {
    if (hideDelayTimeoutRef.current) {
      clearTimeout(hideDelayTimeoutRef.current);
    }

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    try {
      window.localStorage.removeItem(DISMISSED_STORAGE_KEY);
    } catch {
      // Preference persistence is best-effort; the card can still be restored.
    }

    setUndoNoticeVisible(false);
    setUndoAvailable(false);
    setIsHiding(false);
    setIsDismissed(false);
    setOpenQuestion(INITIAL_OPEN_QUESTION);
  };

  if (!dismissalChecked || (isStandalonePwa && !isLocalhost)) {
    return null;
  }

  if (isDismissed && !undoAvailable) {
    return null;
  }

  if (isDismissed) {
    return (
      <section
        aria-label="InformaciÃ³n de primera visita ocultada"
        className="md:hidden border-y bg-white px-[20px] py-3"
      >
        <div
          className="flex items-center justify-between gap-3 border border-[#d9dee7] bg-paper-highlight px-3.5 py-3"
          style={{
            opacity: undoNoticeVisible ? 1 : 0,
            transform: undoNoticeVisible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 180ms ease, transform 180ms ease",
          }}
        >
          <p className="min-w-0 text-[14px] font-medium leading-tight text-[#071329]">
            Seccion ocultada
          </p>
          <button
            type="button"
            onClick={restoreCard}
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold leading-none text-brand"
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
            <span>Revertir</span>
          </button>
        </div>
      </section>
    );
  }

  const modal = mounted && isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden sm:p-4">
          <button
            type="button"
            aria-label="Cerrar información"
            className="absolute inset-0 bg-black/60"
            onClick={closeModal}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="first-visit-title"
            className="relative flex h-[100dvh] min-h-[100svh] w-screen flex-col overflow-hidden bg-white font-sans sm:h-auto sm:min-h-0 sm:max-h-[72vh] sm:w-[min(600px,92vw)] sm:rounded-lg"
            style={{
              opacity: modalActive ? 1 : 0,
              transform: modalActive ? "none" : "scale(0.985) translateY(6px)",
              transition: "transform 180ms ease, opacity 180ms ease",
            }}
          >
            <div className="z-10 flex items-center justify-between bg-[#21252b] py-2 pl-4 pr-2">
              <h3
                id="first-visit-title"
                className="m-0 text-base font-semibold uppercase text-white"
              >
                ¿Vienes por primera vez?
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar información"
                className="flex h-[48px] w-[52px] items-center justify-center text-white"
              >
                <span className="flex h-[30px] items-center text-[30px] leading-none mb-1 -translate-y-px">
                  ×
                </span>
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              className={`flex-1 overflow-y-auto bg-paper px-5 py-5 text-left`}
            >
              <div className="mx-auto max-w-[520px]">
                {QUESTIONS.map((item) => (
                  <div
                    key={item.question}
                    ref={(node) => {
                      questionRefs.current[item.question] = node;
                    }}
                    className={`border-b border-[#d9dee7] bg-paper`}
                  >
                    <button
                      type="button"
                      className={`${editorialFont.className} flex min-h-[62px] w-full items-center justify-between gap-4 bg-paper px-3 py-3 text-left text-ink text-[24px] leading-snug ${
                        openQuestion === item.question ? "font-bold" : "font-normal"
                      }`}
                      aria-expanded={openQuestion === item.question}
                      onClick={() => handleQuestionToggle(item.question)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                          openQuestion === item.question ? "rotate-180" : ""
                        }`}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </button>

                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                        openQuestion === item.question
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0">
                        <p className={`px-2 pb-4 pt-0 text-[20px] leading-6 bg-paper-dark text-ink pt-3.5`}>
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <section
      aria-label="Información para primera visita"
      className="md:hidden border-y bg-white px-[20px]"
      style={{
        opacity: isHiding ? 0 : 1,
        maxHeight: isHiding ? 0 : expandedCardHeight,
        marginTop: isHiding ? 0 : undefined,
        marginBottom: isHiding ? 0 : undefined,
        overflow: "hidden",
        transition: `opacity ${CARD_FADE_DURATION_MS}ms ease, max-height ${CARD_COLLAPSE_DURATION_MS}ms ease ${CARD_FADE_DURATION_MS}ms, margin ${CARD_COLLAPSE_DURATION_MS}ms ease ${CARD_FADE_DURATION_MS}ms`,
      }}
    >
      <div ref={cardContentRef} className="py-8">
        <div className="flex items-start gap-3">
          <div className="relative mt-1.5 pr-12 h-[50px] w-[50px] shrink-0 overflow-hidden bg-[#1d3765]">
            <Image
              src="/images/faq4.png"
              alt=""
              fill
              sizes="50px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className={`${editorialFont.className} text-[22px] font-bold leading-[1.18]`}>
              ¿Vienes por primera vez? 👋
            </h2>
            <p className="mt-2.5 text-[15px] font-normal leading-[1.5] text-[#071329]">
              ¡Todos son bienvenidos! Resuelva sus dudas antes de asistir a cualquier de nuestros cultos. 
            </p>
          </div>
        </div>

        <div className="mt-0.5 pt-5">
          <button
            type="button"
            onClick={() => {
              setOpenQuestion(INITIAL_OPEN_QUESTION);
              setIsOpen(true);
            }}
            className={`ml-14.5 flex h-8.5 items-center justify-between bg-brand px-3 text-left text-[17px] font-normal leading-none text-white`}
          >
            <span>Qué esperar al asistir</span>
            <ChevronRight className="h-6 w-6 stroke-[1.4]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {modal}
    </section>
  );
}
