"use client";

import { useEffect, useRef } from "react";

export function useModalHistoryClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  const didPushStateRef = useRef(false);
  const didCloseFromPopRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

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
        window.history.back();
      }
    };
  }, [isOpen]);
}
