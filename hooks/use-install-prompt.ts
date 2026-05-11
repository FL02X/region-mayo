"use client";

import { useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPromptState = {
  deferredPrompt: BeforeInstallPromptEvent | null;
};

declare global {
  interface Window {
    __rmInstallPromptState?: InstallPromptState;
    __rmPwaInstalled?: boolean;
  }
}

const listeners = new Set<() => void>();

function getInstallPromptState(): InstallPromptState {
  if (typeof window === "undefined") {
    return { deferredPrompt: null };
  }
  if (!window.__rmInstallPromptState) {
    window.__rmInstallPromptState = { deferredPrompt: null };
  }
  return window.__rmInstallPromptState;
}

export function setDeferredInstallPrompt(event: BeforeInstallPromptEvent | null) {
  const state = getInstallPromptState();
  state.deferredPrompt = event;
  listeners.forEach((listener) => listener());
}

export function markPwaInstalled() {
  if (typeof window !== "undefined") {
    window.__rmPwaInstalled = true;
  }
  listeners.forEach((listener) => listener());
}

function checkStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return isStandaloneDisplay || isIosStandalone;
}

function checkIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPromptState] = useState<BeforeInstallPromptEvent | null>(
    () => getInstallPromptState().deferredPrompt,
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkStandalone());
  const [isIos, setIsIos] = useState<boolean>(() => checkIos());

  useEffect(() => {
    const handleChange = () => {
      setDeferredPromptState(getInstallPromptState().deferredPrompt);
      setIsStandalone(checkStandalone());
      setIsIos(checkIos());
    };

    listeners.add(handleChange);

    const mql = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => handleChange();
    mql.addEventListener?.("change", onDisplayChange);
    window.addEventListener("appinstalled", onDisplayChange);

    return () => {
      listeners.delete(handleChange);
      mql.removeEventListener?.("change", onDisplayChange);
      window.removeEventListener("appinstalled", onDisplayChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredInstallPrompt(null);
    return choice;
  };

  return {
    canInstall: Boolean(deferredPrompt),
    promptInstall,
    isInstalled: isStandalone,
    isStandalone,
    isIos,
  };
}
