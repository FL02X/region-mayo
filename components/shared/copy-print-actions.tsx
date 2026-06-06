"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Printer } from "lucide-react";

interface CopyPrintActionsProps {
  copyText: string;
  copyLabel: string;
  printLabel: string;
  onCopied: () => void;
  onPrint: () => void;
}

export function CopyPrintActions({
  copyText,
  copyLabel,
  printLabel,
  onCopied,
  onPrint,
}: CopyPrintActionsProps) {
  const [isCopyActive, setIsCopyActive] = useState(false);
  const [isCopyHovered, setIsCopyHovered] = useState(false);
  const [isPrintHovered, setIsPrintHovered] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setIsCopyActive(true);
    onCopied();
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (
        copyButtonRef.current &&
        target instanceof Node &&
        !copyButtonRef.current.contains(target)
      ) {
        setIsCopyActive(false);
        setIsCopyHovered(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="mt-2 inline-flex flex-wrap items-center gap-[5px]">
      <button
        ref={copyButtonRef}
        onClick={handleCopy}
        onMouseEnter={() => setIsCopyHovered(true)}
        onMouseLeave={() => setIsCopyHovered(false)}
        className="inline-flex h-10 w-fit items-center gap-1.5 rounded-l-sm rounded-r-none border px-3 text-sm font-medium text-brand-ink transition-[background-color,border-color] duration-150"
        style={{
          backgroundColor: isCopyActive || isCopyHovered
            ? "color-mix(in oklch, var(--primary) 10%, var(--surface-pane) 90%)"
            : "var(--surface-pane)",
          borderColor: isCopyActive ? "var(--brand-ink)" : "var(--border)",
        }}
        aria-label={copyLabel}
      >
        <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Copiar</span>
      </button>

      <button
        onClick={onPrint}
        onMouseEnter={() => setIsPrintHovered(true)}
        onMouseLeave={() => setIsPrintHovered(false)}
        className="inline-flex h-10 w-fit items-center gap-1.5 rounded-l-none rounded-r-sm border px-3 text-sm font-medium text-brand-ink transition-[background-color,border-color] duration-150"
        style={{
          backgroundColor: isPrintHovered
            ? "color-mix(in oklch, var(--primary) 10%, var(--surface-pane) 90%)"
            : "var(--surface-pane)",
          borderColor: "var(--border)",
        }}
        aria-label={printLabel}
      >
        <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Imprimir invitacion</span>
      </button>
    </div>
  );
}

export function CopyToast({ visible }: { visible: boolean }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] pointer-events-none -translate-x-1/2 sm:bottom-6">
      <div
        className={`inline-flex min-w-[168px] items-center gap-2 rounded-sm bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
        <span>Copiado</span>
      </div>
    </div>
  );
}

export interface PrintableInfoSection {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface PrintableInfoSheetProps {
  title: string;
  imageUrl?: string;
  imageAlt: string;
  fallbackIcon: ReactNode;
  sections: PrintableInfoSection[];
}

export function PrintableInfoSheet({
  title,
  imageUrl,
  imageAlt,
  fallbackIcon,
  sections,
}: PrintableInfoSheetProps) {
  return (
    <div className="rm-print-sheet">
      <article className="rm-print-card">
        <div className="rm-print-media">
          {imageUrl ? (
            <img className="rm-print-photo" src={imageUrl} alt={imageAlt} />
          ) : (
            <div className="rm-print-placeholder">{fallbackIcon}</div>
          )}
        </div>
        <div>
          <h1 className="rm-print-title">{title}</h1>
          <div className="rm-print-sections">
            {sections.map((section) => (
              <section key={section.id} className="rm-print-section">
                {section.icon}
                <div>
                  <p className="rm-print-label">{section.label}</p>
                  <div className="rm-print-text">{section.content}</div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export const waitForImageReady = (src?: string) => {
  if (!src) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(resolve, 2500);
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };

    image.onload = async () => {
      try {
        if (image.decode) {
          await image.decode();
        }
      } catch {
        // Loading is enough for print; decode can fail on some browsers.
      }
      finish();
    };
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      finish();
    }
  });
};

export const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
