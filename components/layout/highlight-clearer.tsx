"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function HighlightClearer() {
  const pathname = usePathname();
  const attachedRef = useRef(false);

  useEffect(() => {
    // Reset ref on path change
    attachedRef.current = true;
    if (typeof document !== "undefined") {
      document.body.removeAttribute("data-user-interacted");
    }
    
    const events = [
      "pointerdown",
      "touchstart",
      "touchmove",
      "keydown",
      "wheel",
      "scroll",
    ];
    const eventOptions: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };
    
    // Only bind globally and clear immediately on user intent
    const handleInteraction = () => {
      if (typeof document !== "undefined") {
        document.body.setAttribute("data-user-interacted", "true");
      }
      // 1. Remove manually added JS highlight class
      const highlightedElements = document.querySelectorAll('.global-highlight');
      highlightedElements.forEach(el => el.classList.remove('global-highlight'));
      
      // 2. Clear hash from URL quietly to remove CSS :target natively without scrolling
      if (window.location.hash) {
        history.replaceState(
          null, 
          "", 
          window.location.pathname + window.location.search
        );
      }

      // 3. Remove listeners: only needed once per navigation
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, eventOptions);
      });
      attachedRef.current = false;
    };

    // We add a tiny delay before attaching listeners just to avoid 
    // immediately firing on the event that triggered the page navigation.
    const timer = setTimeout(() => {
      if (attachedRef.current) {
        events.forEach(event => {
          window.addEventListener(event, handleInteraction, eventOptions);
        });
      }
    }, 1000); // 1-second grace period before an interaction kills the highlight

    return () => {
      attachedRef.current = false;
      clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, eventOptions);
      });
    };
  }, [pathname]);

  return null;
}
