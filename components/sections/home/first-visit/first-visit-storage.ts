// Donde: logica del bloque de primera visita en home. Viewports: mobile. Funcion: lee y guarda si el usuario oculto la tarjeta.
import { FIRST_VISIT_DISMISSED_STORAGE_KEY } from "@/components/sections/home/first-visit/first-visit-copy";

export function readFirstVisitDismissed() {
  try {
    return window.localStorage.getItem(FIRST_VISIT_DISMISSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveFirstVisitDismissed() {
  try {
    window.localStorage.setItem(FIRST_VISIT_DISMISSED_STORAGE_KEY, "true");
  } catch {
    // Preference persistence is best-effort; the hide animation should still run.
  }
}

export function clearFirstVisitDismissed() {
  try {
    window.localStorage.removeItem(FIRST_VISIT_DISMISSED_STORAGE_KEY);
  } catch {
    // Preference persistence is best-effort; the card can still be restored.
  }
}
