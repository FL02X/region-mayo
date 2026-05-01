"use client";

import { useLayoutEffect } from "react";
import type { RefObject } from "react";

type UseEqualizeCardRowHeadsOptions = {
  cardSelector?: string;
  headSelector?: string;
  rowTolerancePx?: number;
};

function groupKeyForTop(
  rows: number[],
  top: number,
  tolerance: number,
): number {
  for (const existing of rows) {
    if (Math.abs(existing - top) <= tolerance) return existing;
  }
  rows.push(top);
  return top;
}

export function useEqualizeCardRowHeads(
  containerRef: RefObject<HTMLElement | null>,
  options: UseEqualizeCardRowHeadsOptions = {},
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cardSelector = options.cardSelector ?? "[data-eq-card]";
    const headSelector = options.headSelector ?? "[data-eq-head]";
    const rowTolerancePx = options.rowTolerancePx ?? 2;

    let pending = false;

    const scheduleMicrotask = (fn: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(fn);
        return;
      }
      Promise.resolve().then(fn);
    };

    const schedule = () => {
      if (pending) return;
      pending = true;
      scheduleMicrotask(() => {
        pending = false;
        equalize();
      });
    };

    const equalize = () => {
      const cards = Array.from(
        container.querySelectorAll<HTMLElement>(cardSelector),
      );

      const pairs: Array<{ rowTop: number; head: HTMLElement }> = [];

      for (const card of cards) {
        const head = card.querySelector<HTMLElement>(headSelector);
        if (!head) continue;

        // Reset to natural size for measurement (done before paint via layout effect / microtasks).
        head.style.minHeight = "";
        pairs.push({ rowTop: card.offsetTop, head });
      }

      const rowTops: number[] = [];
      const rows = new Map<number, { heads: HTMLElement[]; max: number }>();

      for (const { rowTop, head } of pairs) {
        const key = groupKeyForTop(rowTops, rowTop, rowTolerancePx);
        const row = rows.get(key) ?? { heads: [], max: 0 };
        const height = head.getBoundingClientRect().height;
        row.heads.push(head);
        row.max = Math.max(row.max, height);
        rows.set(key, row);
      }

      for (const row of rows.values()) {
        for (const head of row.heads) {
          const next = `${row.max}px`;
          if (head.style.minHeight !== next) head.style.minHeight = next;
        }
      }
    };

    // Initial run before first paint.
    equalize();

    const mutationObserver = new MutationObserver(() => {
      // Only re-run when cards are added/removed/reordered (e.g. search filtering).
      // Avoid subtree to prevent expand/collapse from triggering extra work and flicker.
      schedule();
    });

    mutationObserver.observe(container, { childList: true });

    const onResize = () => schedule();
    window.addEventListener("resize", onResize);

    // If fonts load async, text metrics can change.
    document.fonts?.ready.then(schedule).catch(() => {});

    return () => {
      window.removeEventListener("resize", onResize);
      mutationObserver.disconnect();
    };
  }, [containerRef, options.cardSelector, options.headSelector, options.rowTolerancePx]);
}
