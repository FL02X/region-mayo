export type FontScale = "normal" | "large" | "xlarge";

type PreferenceChangeDetail = {
  key: string;
  value: string;
};

export const PREFERENCE_KEYS = {
  fontScale: "rm-font-scale",
} as const;

export const FONT_SCALE_VALUES: Record<FontScale, number> = {
  normal: 1,
  large: 1.08,
  xlarge: 1.16,
};

export function readFontScale(): FontScale {
  if (typeof window === "undefined") return "normal";
  const stored = window.localStorage.getItem(PREFERENCE_KEYS.fontScale);
  if (stored === "large" || stored === "xlarge") return stored;
  return "normal";
}

export function writeFontScale(value: FontScale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFERENCE_KEYS.fontScale, value);
  notifyPreferenceChange(PREFERENCE_KEYS.fontScale, value);
}

export function applyFontScale(value: FontScale) {
  if (typeof document === "undefined") return;
  const numericValue = FONT_SCALE_VALUES[value] ?? 1;
  document.documentElement.style.setProperty("--app-font-scale", String(numericValue));
}

function notifyPreferenceChange(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PreferenceChangeDetail>("rm:pref-change", {
      detail: { key, value },
    }),
  );
}

export function onPreferenceChange(handler: (detail: PreferenceChangeDetail) => void) {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<PreferenceChangeDetail>;
    if (!customEvent.detail) return;
    handler(customEvent.detail);
  };
  window.addEventListener("rm:pref-change", listener);
  return () => window.removeEventListener("rm:pref-change", listener);
}
