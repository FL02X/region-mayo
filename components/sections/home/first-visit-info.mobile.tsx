"use client";

// Donde: home, entre action deck mobile y calendario. Viewports: mobile. Funcion: explica la primera visita y puede ocultarse con undo.
import { useEffect, useRef, useState } from "react";
import { Newsreader } from "next/font/google";
import { createPortal } from "react-dom";
import useLockBodyScroll from "@/hooks/use-lock-scroll";
import { useModalHistoryClose } from "@/hooks/use-modal-history-close";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CARD_COLLAPSE_DELAY_MS,
  DEBUG_DISMISS_PARAM,
  FIRST_VISIT_TIMING,
  INITIAL_OPEN_QUESTION,
  RESET_DISMISS_PARAM,
} from "@/components/sections/home/first-visit/first-visit-copy";
import {
  FirstVisitCard,
  FirstVisitHiddenNotice,
  FirstVisitModal,
} from "@/components/sections/home/first-visit/first-visit-pieces";
import {
  clearFirstVisitDismissed,
  readFirstVisitDismissed,
  saveFirstVisitDismissed,
} from "@/components/sections/home/first-visit/first-visit-storage";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

interface FirstVisitInfoMobileProps {
  onDividerVisibilityChange?: (isVisible: boolean) => void;
  cardClassName?: string;
  hiddenNoticeClassName?: string;
}

export function FirstVisitInfoMobile({
  onDividerVisibilityChange,
  cardClassName,
  hiddenNoticeClassName,
}: FirstVisitInfoMobileProps) {
  const isMobileViewport = useIsMobile();
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
  const [cardCollapseMaxHeight, setCardCollapseMaxHeight] = useState<
    string | undefined
  >();
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [undoNoticeVisible, setUndoNoticeVisible] = useState(false);
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
        clearFirstVisitDismissed();
      }

      if (!isMobileViewport) {
        setIsDismissed(false);
      } else if (!local || canDismissOnLocalhost) {
        setIsDismissed(readFirstVisitDismissed());
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    setDismissalChecked(true);
  }, [isMobileViewport]);

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
    if (!isMobileViewport) return;
    if (isLocalhost && !allowLocalhostDismissal) return;

    saveFirstVisitDismissed();

    if (hideDelayTimeoutRef.current) {
      clearTimeout(hideDelayTimeoutRef.current);
    }

    hideDelayTimeoutRef.current = setTimeout(() => {
      const contentHeight = cardContentRef.current?.scrollHeight;
      setCardCollapseMaxHeight(contentHeight ? `${contentHeight}px` : undefined);

      requestAnimationFrame(() => {
        setIsHiding(true);
      });
    }, FIRST_VISIT_TIMING.cardHideDelayMs);

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    dismissTimeoutRef.current = setTimeout(() => {
      setUndoAvailable(true);
      setIsDismissed(true);
    }, CARD_COLLAPSE_DELAY_MS + FIRST_VISIT_TIMING.cardCollapseMs);
  };

  const closeModal = () => {
    setModalActive(false);

    if (closeModalTimeoutRef.current) {
      clearTimeout(closeModalTimeoutRef.current);
    }

    closeModalTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      hideCardAfterModalClose();
    }, FIRST_VISIT_TIMING.modalCloseMs);
  };

  useModalHistoryClose(isOpen, closeModal);

  const restoreCard = () => {
    if (hideDelayTimeoutRef.current) {
      clearTimeout(hideDelayTimeoutRef.current);
    }

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    clearFirstVisitDismissed();

    setUndoNoticeVisible(false);
    setUndoAvailable(false);
    setIsHiding(false);
    setCardCollapseMaxHeight(undefined);
    setIsDismissed(false);
    setOpenQuestion(INITIAL_OPEN_QUESTION);
  };

  const effectiveIsDismissed = isMobileViewport && isDismissed;
  const effectiveIsHiding = isMobileViewport && isHiding;
  const shouldHideForStandalonePwa =
    isMobileViewport && isStandalonePwa && !isLocalhost;
  const hasVisibleDivider =
    dismissalChecked &&
    !shouldHideForStandalonePwa &&
    !(effectiveIsDismissed && !undoAvailable);
  const cardTransition = `opacity ${FIRST_VISIT_TIMING.cardFadeMs}ms ease, max-height ${FIRST_VISIT_TIMING.cardCollapseMs}ms ease ${FIRST_VISIT_TIMING.cardFadeMs}ms, margin ${FIRST_VISIT_TIMING.cardCollapseMs}ms ease ${FIRST_VISIT_TIMING.cardFadeMs}ms`;

  useEffect(() => {
    onDividerVisibilityChange?.(hasVisibleDivider);
  }, [hasVisibleDivider, onDividerVisibilityChange]);

  if (!dismissalChecked || shouldHideForStandalonePwa) {
    return null;
  }

  if (effectiveIsDismissed && !undoAvailable) {
    return null;
  }

  if (effectiveIsDismissed) {
    return (
      <FirstVisitHiddenNotice
        isVisible={undoNoticeVisible}
        onRestore={restoreCard}
        className={hiddenNoticeClassName}
      />
    );
  }

  const modal = mounted && isOpen
    ? createPortal(
        <FirstVisitModal
          isActive={modalActive}
          openQuestion={openQuestion}
          scrollContainerRef={scrollContainerRef}
          questionRefs={questionRefs}
          questionFontClassName={editorialFont.className}
          onClose={closeModal}
          onQuestionToggle={handleQuestionToggle}
        />,
        document.body,
      )
    : null;

  return (
    <>
      <FirstVisitCard
        contentRef={cardContentRef}
        isHiding={effectiveIsHiding}
        collapseMaxHeight={cardCollapseMaxHeight}
        transitionStyle={cardTransition}
        titleFontClassName={editorialFont.className}
        className={cardClassName}
        onOpen={() => {
          setOpenQuestion(INITIAL_OPEN_QUESTION);
          setIsOpen(true);
        }}
      />
      {modal}
    </>
  );
}
