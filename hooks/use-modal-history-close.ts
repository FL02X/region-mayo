"use client";

import { useEffect, useRef } from "react";

export function useModalHistoryClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const didPushStateRef = useRef(false);
  const didCloseFromPopRef = useRef(false);
  const cleanupBackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    if (cleanupBackTimerRef.current) {
      window.clearTimeout(cleanupBackTimerRef.current);
      cleanupBackTimerRef.current = null;
    }

    const currentState = window.history.state;
    const nextState =
      currentState && typeof currentState === "object"
        ? { ...currentState, rmModalOpen: true }
        : { rmModalOpen: true };

    try {
      window.history.pushState(nextState, "", window.location.href);
      didPushStateRef.current = true;
      didCloseFromPopRef.current = false;
    } catch {
      didPushStateRef.current = false;
      return;
    }

    const handlePopState = () => {
      if (!didPushStateRef.current) return;

      didCloseFromPopRef.current = true;
      didPushStateRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      if (didPushStateRef.current && !didCloseFromPopRef.current) {
        didPushStateRef.current = false;
        cleanupBackTimerRef.current = window.setTimeout(() => {
          cleanupBackTimerRef.current = null;
          window.history.back();
        }, 0);
      }
    };
  }, [isOpen]);
}
