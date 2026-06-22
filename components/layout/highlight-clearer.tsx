"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function HighlightClearer() {
  const pathname = usePathname();
  const attachedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
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
    
    const detachInteractionListeners = () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, eventOptions);
      });
      attachedRef.current = false;
    };

    const handleInteraction = () => {
      if (typeof document !== "undefined") {
        document.body.setAttribute("data-user-interacted", "true");
      }
      // Los highlights por hash deben desaparecer cuando el usuario ya interactuo con la pagina.
      const highlightedElements = document.querySelectorAll('.global-highlight');
      highlightedElements.forEach(el => el.classList.remove('global-highlight'));
      
      // Limpiamos el hash sin navegar para que :target deje de aplicar estilos sin mover el scroll.
      if (window.location.hash) {
        history.replaceState(
          null, 
          "", 
          window.location.pathname + window.location.search
        );
      }

      detachInteractionListeners();
    };

    const armInteractionClearer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      detachInteractionListeners();
      document.body.removeAttribute("data-user-interacted");

      // Esperamos para que el click o scroll que abrio el target no borre el highlight inmediatamente.
      timerRef.current = window.setTimeout(() => {
        attachedRef.current = true;
        events.forEach(event => {
          window.addEventListener(event, handleInteraction, eventOptions);
        });
        timerRef.current = null;
      }, 1000);
    };

    armInteractionClearer();
    window.addEventListener("hashchange", armInteractionClearer);
    window.addEventListener("rm-highlight-applied", armInteractionClearer);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      detachInteractionListeners();
      window.removeEventListener("hashchange", armInteractionClearer);
      window.removeEventListener("rm-highlight-applied", armInteractionClearer);
    };
  }, [pathname]);

  return null;
}
