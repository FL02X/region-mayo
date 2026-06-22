export function vibrateForMenuTap() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(60);
  }
}

export function addFlickFeedback(element: HTMLElement) {
  element.classList.add("flick-feedback");

  const handleAnimationEnd = () => {
    element.classList.remove("flick-feedback");
    element.removeEventListener("animationend", handleAnimationEnd);
  };

  element.addEventListener("animationend", handleAnimationEnd);
}
