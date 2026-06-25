// Donde: bloque mobile de primera visita en home.
//  Viewports: mobile. 
// Funcion: centraliza textos, preguntas, storage keys y duraciones.
export type FirstVisitQuestion = {
  question: string;
  answer: string;
};

export const FIRST_VISIT_QUESTIONS: FirstVisitQuestion[] = [
  {
    question: "¿Puedo asistir aunque no sea miembro?",
    answer: "¡Sí! Todos son bienvenidos.",
  },
  {
    question: "¿Necesito registrarme?",
    answer: "¡No es necesario! Puedes asistir directamente.",
  },
  {
    question: "¿Que ropa permiten llevar?",
    answer:
      "Puedes asistir con cualquier ropa respetuosa. ¡Algunos miembros usan uniforme en ciertos eventos!",
  },
  {
    question: "¿Tiene costo?",
    answer: "No. La entrada es gratuita.",
  },
  {
    question: "¿Qué habrá en la reunión?",
    answer:
      "Alabanza, agradecimiento a Dios por parte de los hermanos, predicación y convivencia al terminar.",
  },
  {
    question: "¿Cómo llego?",
    answer: "Puedes usar el botón de Maps dentro de cada evento o templo. ¡Te esperamos!",
  },
];

export const INITIAL_OPEN_QUESTION = FIRST_VISIT_QUESTIONS[0]?.question ?? null;

export const FIRST_VISIT_DISMISSED_STORAGE_KEY = "rm-first-visit-info-dismissed";
export const DEBUG_DISMISS_PARAM = "debugFirstVisitDismiss";
export const RESET_DISMISS_PARAM = "resetFirstVisitDismiss";

export const FIRST_VISIT_TIMING = {
  modalCloseMs: 180,
  cardHideDelayMs: 120,
  cardFadeMs: 200,
  cardCollapseMs: 250,
};

export const CARD_COLLAPSE_DELAY_MS =
  FIRST_VISIT_TIMING.cardHideDelayMs + FIRST_VISIT_TIMING.cardFadeMs;

export const FIRST_VISIT_COPY = {
  hiddenSectionLabel: "InformaciÃ³n de primera visita ocultada",
  hiddenText: "Seccion ocultada",
  restoreLabel: "Revertir",
  sectionLabel: "Información para primera visita",
  modalCloseLabel: "Cerrar información",
  modalTitle: "¿Vienes por primera vez?",
  cardTitle: "¿Vienes por primera vez? 👋",
  cardDescription:
    "Todos son bienvenidos. Resuelva sus dudas antes de asistir a cualquier de nuestros cultos. ",
  cardButtonLabel: "Qué esperar al asistir",
};
