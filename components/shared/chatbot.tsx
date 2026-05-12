"use client";

/*
Design & Implementation Notes

Philosophy:
- Keep UI simple, restrained and performant.
- Visual inspiration: jw.org (only design principles — spacing, hierarchy,
  conservative color use). Do NOT copy any protected assets or copywriting.
- Prefer subtle geometry: avoid very large radii. Use squared corners or
  small radii (2-8px) to keep elements grounded and legible.
- Generous, consistent whitespace is more valuable than decorative borders.
  Use spacing to separate groups and create readable lines of text.

Accessibility & Motion:
- Respect `prefers-reduced-motion`: animations should be disabled or reduced
  when the user prefers reduced motion. Use motion-safe helpers and media
  queries to gate non-essential motion.
- All interactive controls must have accessible labels (`aria-label`,
  `aria-labelledby`) and keyboard support (buttons, forms).

Performance & Structure:
- Modal content is rendered via a portal to `document.body` to guarantee
  visual stacking above app-level overlays (sheets, toasts). This prevents
  the chatbot overlay interfering with per-page components like mobile menus.
- Avoid adding global layout mounts for per-page UI. Mount the chatbot on
  pages where it's needed so it becomes part of the page stacking context.
- Keep animations cheap: prefer `transform` and `opacity` with `will-change`
  hints when necessary. Avoid layout-triggering properties (width/height).

Styling conventions used in this file:
- Border radius: small values (see inline styles near buttons/modal).
- Colors: header dark blue `#21252b`, action blue `#2b4c7e` (used for send
  button and user bubble). Bot bubbles are light (`#f3f4f6`).
- Fonts: system UI stack for performance and consistent rendering across
  platforms. Font sizes are responsive: larger on mobile for readability.

Behavioral notes for future AIs or maintainers:
- Autoscroll behavior: on modal open we jump to the last message (instant)
  to avoid heavy animation during mount; new messages scroll smoothly.
- Input focus on open is intentionally not automatic (can be added if UX
  requires it), but if implemented prefer `requestAnimationFrame` and a
  short timeout so it doesn't fight mounting animations.
- If you need to hide the chatbot when a mobile sheet opens, prefer a
  lightweight custom event (e.g., `window.dispatchEvent(new CustomEvent('mobile-menu-open', { detail: open }))`)
  to avoid tight coupling between independent components.

Placement:
- This file is intentionally self-contained in terms of documentation so the
  next automated reader has all context here. Do not move these notes to
  external files; the user requested in-file docs only.
*/

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState<any[]>([
    { rol: "bot", texto: "¡Hola! ¿En qué te puedo ayudar hoy?" },
  ]);
  
  // NUEVO: Estado para controlar si se muestra el mensaje flotante de ayuda
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const pathname = usePathname();
  const rutasPermitidas = ["/", "/coros", "/templos", "/directorio", "/directiva", "/album"];

  if (!rutasPermitidas.includes(pathname)) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Si abrimos el chat, ocultamos el mensaje flotante de inmediato
    if (!isOpen) setMostrarAyuda(false);
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    const onResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // NUEVO: Efecto para mostrar y ocultar el mensaje flotante con un temporizador
  useEffect(() => {
    // Aparece después de 1 segundo de entrar a la página
    const timerMostrar = setTimeout(() => {
      if (!isOpen) setMostrarAyuda(true);
    }, 3000);

    // Desaparece después de 7 segundos (6 segundos visible)
    const timerOcultar = setTimeout(() => {
      setMostrarAyuda(false);
    }, 7000);

    return () => {
      clearTimeout(timerMostrar);
      clearTimeout(timerOcultar);
    };
  }, [isOpen]);

  // Auto-scroll: when opening, jump to last message; when receiving new messages keep smooth scroll
  useEffect(() => {
    const el = messagesEndRef.current;
    const container = messagesContainerRef.current;
    const justOpened = !prevIsOpenRef.current && isOpen;

    if (!isOpen) {
      prevIsOpenRef.current = isOpen;
      return;
    }

    if (el) {
      // If modal was just opened, jump to bottom instantly; otherwise smooth
      el.scrollIntoView({ behavior: justOpened ? 'auto' : 'smooth', block: 'end' });
    } else if (container) {
      if (justOpened) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [historial, isOpen]);

  // Lock body scroll while the modal is open (prevents page scroll/jump)
  useLockBodyScroll(isOpen);

  // Modal mount animation: small fade + scale on open, respect prefers-reduced-motion
  useEffect(() => {
    if (!isOpen) {
      setModalActive(false);
      return;
    }

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setModalActive(true);
      return;
    }

    setModalActive(false);
    const raf = requestAnimationFrame(() => setModalActive(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const modalContainerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '100svh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : { position: 'relative', width: 'min(600px, 92vw)', maxHeight: '72vh', backgroundColor: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '0 auto' };

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modalAnimationStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        opacity: modalActive ? 1 : 0,
        transform: modalActive ? 'none' : 'scale(0.985) translateY(6px)',
        transition: 'transform 180ms ease, opacity 180ms ease',
      };
      
  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const textoUsuario = mensaje;
    setHistorial((prev) => [...prev, { rol: "usuario", texto: textoUsuario }]);
    setMensaje("");

    const textoMinusculas = textoUsuario.toLowerCase();
    let respuestaBot: any = "Lo siento, aún estoy aprendiendo. ¿Podrías intentar preguntarlo de otra forma?";

    if (textoMinusculas.includes("hola") || textoMinusculas.includes("buenos dias")) {
      respuestaBot = "¡Hola! Bienvenido a la plataforma de Región Mayo. ¿En qué te puedo ayudar hoy?";
    } else if (textoMinusculas.includes("evento") || textoMinusculas.includes("recorrido")) {
      respuestaBot = "Nuestro próximo gran evento es el Recorrido Regional Mayo en la calle Obregón 45, Navojoa. ¡No olvides registrarte en la página principal!";
    } else if (
      textoMinusculas.includes("templo") ||
      textoMinusculas.includes("iglesia") ||
      textoMinusculas.includes("ubicación") ||
      textoMinusculas.includes("donde")
    ) {
      respuestaBot = 'Puedes encontrar la iglesia más cercana a ti utilizando el buscador GPS en la sección de "Templos" del menú superior.';
    } else if (textoMinusculas.includes("coro") || textoMinusculas.includes("pastor")) {
      respuestaBot = (
        <span>
          Toda la información sobre los coros y pastores de la región la encuentras en nuestro directorio.
          <br />
          <br />
          <a href="/coros" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>
            👉 Pícale aquí para ir a la sección
          </a>
        </span>
      );
    }
    else if (textoMinusculas.includes("¿Qué necesita una persona para salvarse?") || textoMinusculas.includes("salvacion") || textoMinusculas.includes("salvarse") || textoMinusculas.includes("como se salva una persona")|| textoMinusculas.includes("salvo")) {
      respuestaBot = (
        <span>
          La Biblia enseña que debemos experimentar el nuevo nacimiento. Esto requiere: arrepentimiento genuino, bautismo en agua en el nombre de Jesucristo para el perdón de los pecados, y la llenura del Espíritu Santo.
          <br />
          <br />
          Fundamento bíblico: Hechos 2:38, Juan 3:5.
        </span>
      );
    }
    else if (textoMinusculas.includes("¿Creen que solamente su iglesia tiene la verdad?") || textoMinusculas.includes("verdad") || textoMinusculas.includes("su iglesia es la unica")) {
      respuestaBot = (
        <span>
          Creemos que la Verdad absoluta es Jesucristo y Su Palabra, no una etiqueta denominacional. La iglesia verdadera está formada por todos aquellos que obedecen y viven la doctrina enseñada por los apóstoles y en la Biblia.
          <br />
          <br />
         Fundamento bíblico: Juan 14:6, Efesios 2:20.
        </span>
      );
    }
    setTimeout(() => {
      setHistorial((prev) => [...prev, { rol: "bot", texto: respuestaBot }]);
    }, 1000);
  };

  return (
    <div
      style={{ position: "fixed", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", right: "20px", zIndex: 40, fontFamily: "system-ui, -apple-system, sans-serif" }}
      className="md:right-5"
    >
      {!isOpen ? (
        <>
          {/* NUEVO: Mensaje flotante de bienvenida */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: '12px 16px',
              borderRadius: '8px',
              width: 'max-content',
              maxWidth: '220px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              textAlign: 'left',
              opacity: mostrarAyuda ? 1 : 0,
              transform: mostrarAyuda ? 'translateY(0)' : 'translateY(10px)',
              pointerEvents: mostrarAyuda ? 'auto' : 'none',
              transition: 'all 100ms ease',
            }}
          >
           ¡Paz de Cristo! 👋 ¿Tienes alguna duda? Aquí estoy para ayudarte.
            
            {/* Triangulito decorativo apuntando hacia abajo */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: isMobile ? '14px' : '20px', // Se ajusta si es movil o escritorio
              width: '10px',
              height: '10px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              transform: 'rotate(45deg)'
            }} />
          </div>

          {/* Launcher: desktop = small square, mobile = small circle */}
          <button
            onClick={toggleChat}
            aria-label="Abrir Asistente"
            className="hidden md:flex items-center justify-center w-14 h-14 bg-[#21252b] text-white transition-transform hover:scale-105"
            style={{ borderRadius: 6, border: 'none', fontWeight: 600 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={toggleChat}
            aria-label="Abrir Asistente"
            className="md:hidden flex items-center justify-center w-12 h-12 bg-[#21252b] text-white transition-transform active:scale-95"
            style={{ borderRadius: '50%', border: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            <span style={{ fontSize: 20, lineHeight: '1' }}>?</span>
          </button>
        </>
        ) : (
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
              <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={toggleChat} />

              <div
                style={{ ...modalContainerStyle, ...modalAnimationStyle }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="chatbot-title"
              >
                <div style={{ backgroundColor: '#21252b', zIndex: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 id="chatbot-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, textTransform: 'uppercase' }}>ASISTENCIA VIRTUAL</h3>
                  <button onClick={toggleChat} aria-label="Cerrar Asistente" style={{ height: 40, width: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>×</span>
                  </button>
                </div>

                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', textAlign: 'left', color: '#111827', fontSize: isMobile ? 17 : 15 }}>
                  {historial.map((msg, index) => (
                    <div key={index} style={{
                      alignSelf: 'stretch',
                      backgroundColor: msg.rol === 'usuario' ? '#2b4c7e' : '#f3f4f6',
                      color: msg.rol === 'usuario' ? '#fff' : '#374151',
                      padding: '10px 12px',
                      borderRadius: 6,
                      marginBottom: 10,
                      maxWidth: '100%',
                      fontSize: isMobile ? 17 : 15
                    }}>{msg.texto}</div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={enviarMensaje}
                  style={{
                    display: 'flex',
                    gap: 8,
                    paddingTop: 12,
                    paddingRight: 16,
                    paddingLeft: 16,
                    paddingBottom: isMobile
                      ? 'calc(12px + env(safe-area-inset-bottom, 0px))'
                      : 16,
                    borderTop: '1px solid #e6e6e6',
                    backgroundColor: '#fff',
                  }}
                >
                  <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 4, border: '1px solid #d1d5db', outline: 'none', fontSize: isMobile ? 17 : 15 }}
                  />
                  <button type="submit" aria-label="Enviar mensaje" style={{ width: 44, height: 40, backgroundColor: '#2b4c7e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M22 2L11 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )
        )}
    </div>
  );
}