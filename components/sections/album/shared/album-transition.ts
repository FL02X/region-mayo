// Donde: no renderiza UI directo. 
// Viewports: mobile. 
// Funcion: marca transiciones decorativas entre selector y detalle.
export const ALBUM_TRANSITION_STORAGE_KEY = "rm-album-transition-next";

export function markAlbumTransition() {
  try {
    // Esta marca solo activa una animacion visual al entrar al album; si storage falla, la navegacion sigue igual.
    sessionStorage.setItem(ALBUM_TRANSITION_STORAGE_KEY, "true");
  } catch {
    // La transicion es decorativa; ignoramos storage en modo privado o navegadores restrictivos.
  }
}

export function consumeAlbumTransition() {
  try {
    const shouldAnimateNext =
      sessionStorage.getItem(ALBUM_TRANSITION_STORAGE_KEY) === "true";
    sessionStorage.removeItem(ALBUM_TRANSITION_STORAGE_KEY);
    return shouldAnimateNext;
  } catch {
    return false;
  }
}
