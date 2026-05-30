"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

const QUESTIONS = [
  {
    question: "¿Puedo ir aunque no sea miembro?",
    answer: "Sí. Todos son bienvenidos.",
  },
  {
    question: "¿Necesito registrarme?",
    answer: "No. Puedes asistir directamente.",
  },
  {
    question: "¿Cómo debo vestir?",
    answer:
      "Puedes asistir con ropa adecuada. Algunos miembros usan uniforme en ciertos eventos.",
  },
  {
    question: "¿Tiene costo?",
    answer: "No. La entrada es gratuita.",
  },
  {
    question: "¿Qué habrá en la reunión?",
    answer: "Alabanza, predicación y convivencia cristiana.",
  },
  {
    question: "¿Cómo llego?",
    answer: "Puedes usar el botón de Maps dentro de cada evento o templo.",
  },
];

export function FirstVisitInfoMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (isStandalonePwa) {
    return null;
  }

  const modal = mounted && isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden sm:p-4">
          <button
            type="button"
            aria-label="Cerrar información"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
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
            <div className="z-10 flex items-center justify-between bg-[#21252b] px-4 py-3">
              <h3
                id="first-visit-title"
                className="m-0 text-base font-bold uppercase text-white"
              >
                ¿Vienes por primera vez?
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar información"
                className="flex h-10 w-10 items-center justify-center text-white"
              >
                <span className="text-[22px] leading-none">×</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#f9fafb] px-5 py-5 text-left text-[#111827]">
              <div className="mx-auto max-w-[520px] space-y-5">
                {QUESTIONS.map((item) => (
                  <div
                    key={item.question}
                    className=" last:border-b-0 last:pb-0"
                  >
                    <h4 className="mb-1.5 text-[17px] font-semibold leading-snug text-[#1d3765]">
                      {item.question}
                    </h4>
                    <p className="text-[16px] leading-7 text-[#1f2937]">
                      {item.answer}
                    </p>
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
      className="md:hidden border-t bg-white px-[20px] pb-[22px] pt-0"
    >
      <div className="pt-8">
        <div className="flex items-start gap-3">
          <div className="relative mt-1.5 pr-12 h-[50px] w-[50px] shrink-0 overflow-hidden bg-[#1d3765]">
            <Image
              src="/images/faq3.png"
              alt=""
              fill
              sizes="50px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[19px] font-bold leading-[1.18]">
              ¿Vienes por primera vez?
            </h2>
            <p className="mt-2.5 text-[15px] font-normal leading-[1.5] text-[#071329]">
              Todos son bienvenidos. Conoce qué esperar
              y resuelve tus dudas antes de asistir.
            </p>
          </div>
        </div>

        <div className="mt-0.5 pt-5">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="ml-14.5 flex h-8.5 items-center justify-between bg-[#005998] px-3 text-left text-[17px] font-normal leading-none text-white"
          >
            <span>Ver información</span>
            <ChevronRight className="h-6 w-6 stroke-[1.4]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {modal}
    </section>
  );
}
