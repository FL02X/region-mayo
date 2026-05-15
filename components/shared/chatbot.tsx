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
*/

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import useLockBodyScroll from "@/hooks/use-lock-scroll";

type Mensaje = {
  rol: "bot" | "usuario";
  texto: React.ReactNode;
  opciones?: string[]; 
};

const LinkBiblico = ({ cita }: { cita: string }) => {
  const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(cita)}&version=RVR1960`;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ color: '#2b4c7e', textDecoration: 'underline' }}
      title={`Leer ${cita} en BibleGateway`}
    >
      {cita}
    </a>
  );
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  
  // AÑADIDO: "Historia de la Iglesia" como opción principal
  const mensajeInicial: Mensaje[] = [
    { 
      rol: "bot", 
      texto: "¡Paz de Cristo! Bienvenido a la plataforma. Para darte un mejor servicio, por favor selecciona una de las siguientes opciones:",
      opciones: ["Historia de la Iglesia", "Dudas sobre la página", "Dudas doctrinales", "Otra consulta (WhatsApp)"]
    },
  ];

  const [historial, setHistorial] = useState<Mensaje[]>(mensajeInicial);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  
  const [isClearing, setIsClearing] = useState(false);

  const pathname = usePathname();
  const rutasPermitidas = ["/", "/coros", "/templos", "/directorio", "/directiva", "/album"];

  if (!rutasPermitidas.includes(pathname)) {
    return null;
  }

  const limpiarChat = () => {
    setIsClearing(true); 
    
    setTimeout(() => {
      setHistorial(mensajeInicial);
      setIsClearing(false); 
    }, 1500);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
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

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen as EventListener);
    return () => window.removeEventListener('open-chatbot', handleOpen as EventListener);
  }, []);

  useEffect(() => {
    const el = messagesEndRef.current;
    const container = messagesContainerRef.current;
    const justOpened = !prevIsOpenRef.current && isOpen;

    if (!isOpen) {
      prevIsOpenRef.current = isOpen;
      return;
    }

    if (el && !isClearing) {
      el.scrollIntoView({ behavior: justOpened ? 'auto' : 'smooth', block: 'end' });
    } else if (container && !isClearing) {
      if (justOpened) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [historial, isOpen, isClearing]);

  useLockBodyScroll(isOpen);

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

  const procesarEntrada = (textoUsuario: string) => {
    setHistorial((prev) => [...prev, { rol: "usuario", texto: textoUsuario }]);
    
    const textoMinusculas = textoUsuario.toLowerCase();
    
    let respuesta: Mensaje = { 
      rol: "bot", 
      texto: "Lo siento, aún estoy aprendiendo y no tengo esa respuesta. Pero no te preocupes, puedes contactarnos directamente.",
      opciones: ["Otra consulta (WhatsApp)", "Volver al inicio"]
    };

    if (textoMinusculas === "volver al inicio" || textoMinusculas.includes("hola") || textoMinusculas.includes("buenos dias")) {
      respuesta = {
        rol: "bot",
        texto: "¡Hola de nuevo! Elige qué tipo de información buscas:",
        opciones: ["Historia de la Iglesia", "Dudas sobre la página", "Dudas doctrinales", "Otra consulta (WhatsApp)"]
      };
    } 
    else if (textoMinusculas === "dudas sobre la página") {
      respuesta = {
        rol: "bot",
        texto: "¡Perfecto! ¿Qué información sobre la región estás buscando?",
        opciones: ["Redes sociales", "Album de fotos","Eventos y recorridos", "Directiva local","Templos","Ubicar una iglesia", "Coros y Pastores", "Volver al inicio"]
      };
    }
    else if (textoMinusculas === "dudas doctrinales") {
      respuesta = {
        rol: "bot",
        texto: "Tenemos varias respuestas fundamentadas en la Palabra de Dios. Selecciona la categoría de tu duda:",
        opciones: ["Salvación y Bautismo", "Vestimenta y Apariencia", "La Biblia", "La Unicidad de Dios", "Volver al inicio"]
      };
    }
    // ---------------------------------------------------------
    // NUEVA SECCIÓN: HISTORIA DE LA IGLESIA POR AÑOS
    // ---------------------------------------------------------
    else if (textoMinusculas === "historia de la iglesia" || textoMinusculas === "historia") {
      respuesta = {
        rol: "bot",
        texto: "Nuestra historia está llena de bendiciones y fe. Selecciona la etapa que deseas leer:",
        opciones: ["1934-1937: Los Inicios", "1937-1940: Iglesia Naciente", "1941-1942: 1ra Convención", "1943-1945: 1er Templo y Coro", "Historia completa con fotos", "Volver al inicio"]
      };
    }
    else if (textoMinusculas.includes("1934")) {
      respuesta.texto = "📜 1934 - 1937: La semilla del evangelio llegó a la región a través del Hno. Misionero Gregorio Domínguez, procedente de Yuma, Arizona, quien comenzó a predicar en las márgenes del Río Mayo. En 1937 nació la primera congregación de la Iglesia Gentil de Cristo en Navojoa, reuniéndose inicialmente en el hogar de la familia Martínez.";
      respuesta.opciones = ["1937-1940: Iglesia Naciente", "Historia de la Iglesia", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("1937")) {
      respuesta.texto = "📜 1937 - 1940: A pesar de las críticas de quienes los llamaban 'los que hacen ruido en el río', la iglesia creció y se mantuvo firme en su doctrina original. Los jóvenes de aquel entonces se aferraron a la fe bajo un hermoso lema que los identificaba: 'Por mi Doctrina, mi Iglesia y mi Rey'.";
      respuesta.opciones = ["1941-1942: 1ra Convención", "Historia de la Iglesia", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("1941")) {
      respuesta.texto = "📜 1941 - 1942: Tras un periodo de esfuerzo misionero en la sierra de Chínipas, Chihuahua, los hermanos regresaron a Sonora. En abril de 1942, se celebró la Primera Convención en Bacobampo, Sonora, contando con la presencia de 44 hermanos y nombrando como Segundo Pastor al Hno. Ulpiano B. Alcántar. Fue el inicio de una estructura sólida.";
      respuesta.opciones = ["1943-1945: 1er Templo y Coro", "Historia de la Iglesia", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("1943")) {
      respuesta.texto = "📜 1943 - 1945: Comenzó la construcción del primer templo en Bacobampo. Al mismo tiempo, nació el primer coro llamado 'Rey Salomón'. Como no había recursos para el transporte, viajaban a los pueblos vecinos pidiendo raite, ganándose el cariño como 'La Iglesia de los raiteros'. Inspirados en los aviadores de la época, los jóvenes adoptaron uniformes que marcaron a toda una generación.";
      respuesta.opciones = ["Historia de la Iglesia", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("historia completa") || textoMinusculas.includes("fotos") || textoMinusculas.includes("Historia completa con fotos")) {
      respuesta.texto = <span><a href="https://www.facebook.com/share/p/18yJAysJpu/" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>📜 Con esta publicación podras ver toda la historia de nuestra amada iglesia con fotos ineditas</a></span>;
      respuesta.opciones = ["Volver al inicio"];
    }
    else if (textoMinusculas.includes("eventos") || textoMinusculas.includes("recorrido") || textoMinusculas.includes("campaña")) {
      respuesta.texto = "Nuestro próximo gran evento es la campaña regional de evangelismo en la localidad de la iglesia Bachantahui";
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];
    } else if (textoMinusculas.includes("iglesia") || textoMinusculas.includes("ubicar") || textoMinusculas.includes("buscar iglesia")) {
      respuesta.texto = 'Puedes encontrar la iglesia más cercana a ti utilizando el buscador GPS en la sección de "Templos" del menú superior.';
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];
    } else if (textoMinusculas.includes("coro") || textoMinusculas.includes("pastor")) {
      respuesta.texto = (
        <span>
          Toda la información sobre los coros y pastores de la región la encuentras en nuestro directorio.<br /><br />
          <a href="/directorio" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Ir a la seccion de pastores</a><br />
          <a href="/coros" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Ir a la sección de Coros</a>
        </span>
      );
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("directiva") || textoMinusculas.includes("quien dirige") || textoMinusculas.includes("directiva local")) {
      respuesta.texto = (
        <span>
          La Directiva de la región se encuentra en nuestra sección de información institucional.<br /><br />
          <a href="/directiva" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Ir a la sección de Directiva</a>
        </span>
      );
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];
    }
    else if (textoMinusculas.includes("templos") || textoMinusculas.includes("templo") || textoMinusculas.includes("lugares de reunión") || textoMinusculas.includes("donde se reúnen")) {
     respuesta.texto = (
        <span>
          Tenemos diferentes iglesias ubicadas en nuestra región mayo.<br /><br />
          <a href="/templos" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Ir a la sección de Templos</a>
        </span>
      );
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];  
    }
    else if (textoMinusculas.includes("album") || textoMinusculas.includes("fotos") || textoMinusculas.includes("imagenes")) {
      respuesta.texto = (
        <span>
          Tenemos diferentes fotos en nuestro album de la región.<br /><br />
          <a href="/album" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Ir a la sección de Album</a>
        </span>
      );
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];  
    }
    else if (textoMinusculas.includes("redes sociales") || textoMinusculas.includes("facebook") || textoMinusculas.includes("instagram") || textoMinusculas.includes("redes")) {
      respuesta.texto = (
        <span>
          Puedes seguirnos en nuestras redes sociales para estar al tanto de todas las novedades y eventos de la región mayo.<br /><br />
          <a href="https://www.facebook.com/MGR.R.MY" target="_blank" rel="noopener noreferrer" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Seguir en Facebook</a><br />
          <a href="https://www.instagram.com/mgrregionmayo/" target="_blank" rel="noopener noreferrer" style={{ color: "#2b4c7e", fontWeight: "bold", textDecoration: "underline" }}>👉 Seguir en Instagram</a>
        </span>
      );
      respuesta.opciones = ["Dudas sobre la página", "Volver al inicio"];
    }
    else if (textoMinusculas === "salvación y bautismo") {
      respuesta = {
        rol: "bot", texto: "Selecciona una pregunta sobre Salvación y Bautismo:",
        opciones: ["¿Qué se necesita para salvarse?", "¿Solamente su iglesia tiene la verdad?", "¿Qué pasa con alguien bueno que nunca conoció a Cristo?", "¿La salvación se pierde?", "¿Por qué es necesario arrepentirse?", "¿Por qué insisten en el bautismo?", "Volver al menú doctrinal"]
      };
    }
    else if (textoMinusculas === "vestimenta y apariencia") {
      respuesta = {
        rol: "bot", texto: "Selecciona una pregunta sobre Vestimenta:",
        opciones: ["¿Por qué tienen reglas de vestimenta?", "¿Es pecado maquillarse o usar joyas?", "¿Las normas reflejan espiritualidad?", "¿Son reglas culturales o bíblicas?", "Volver al menú doctrinal"]
      };
    }
    else if (textoMinusculas === "la biblia") {
      respuesta = {
        rol: "bot", texto: "Selecciona una pregunta sobre la Biblia:",
        opciones: ["¿Qué versión de la Biblia usan?", "Volver al menú doctrinal"]
      };
    }
    else if (textoMinusculas === "la unicidad de dios") {
      respuesta = {
        rol: "bot", texto: "Selecciona una pregunta sobre Dios:",
        opciones: ["¿Por qué Dios es uno y no Trinidad?", "¿El Padre, el Hijo y el Espíritu Santo?", "Si Jesús oraba al Padre, ¿con quién hablaba?", "¿Jesús es Dios o una manifestación?", "¿Qué significa Hijo de Dios?", "Volver al menú doctrinal"]
      };
    }
    else if (textoMinusculas === "volver al menú doctrinal") {
      respuesta = {
        rol: "bot", texto: "Selecciona la categoría de tu duda doctrinal:",
        opciones: ["Salvación y Bautismo", "Vestimenta y Apariencia", "La Biblia", "La Unicidad de Dios", "Volver al inicio"]
      };
    }
    else if (textoMinusculas.includes("necesita para salvarse") || textoMinusculas.includes("salvacion") || textoMinusculas.includes("salvo")) {
      respuesta.texto = <span>La Biblia enseña que debemos experimentar el nuevo nacimiento. Esto requiere: arrepentimiento genuino, bautismo en agua en el nombre de Jesucristo para el perdón de los pecados, y la llenura del Espíritu Santo.<br /><br /><b><LinkBiblico cita="Hechos 2:38" />, <LinkBiblico cita="Juan 3:5" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("solamente su iglesia tiene la verdad")) {
      respuesta.texto = <span>Creemos que la Verdad absoluta es Jesucristo y Su Palabra, no una etiqueta denominacional. La iglesia verdadera está formada por todos aquellos que obedecen y viven la doctrina enseñada por los apóstoles.<br /><br /><b><LinkBiblico cita="Juan 14:6" />, <LinkBiblico cita="Efesios 2:20" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("nunca conoció a cristo") || textoMinusculas.includes("alguien bueno")) {
      respuesta.texto = <span>Dios es soberano y perfectamente justo. Las Escrituras enseñan que Dios juzgará a cada persona según la luz, la ley y la conciencia que hayan tenido en su corazón.<br /><br /><b><LinkBiblico cita="Romanos 2:14-16" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("salvación se pierde")) {
      respuesta.texto = <span>Sí. La gracia de Dios nos salva, pero el creyente debe perseverar en santidad y fe hasta el fin. Si una persona decide voluntariamente apartarse de Dios y vivir en pecado, puede perder su salvación.<br /><br /><b><LinkBiblico cita="Hebreos 10:26-27" />, <LinkBiblico cita="2 Pedro 2:20-21" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("necesario arrepentirse")) {
      respuesta.texto = <span>Porque el pecado nos separa de Dios. El arrepentimiento es una decisión profunda de cambiar de rumbo, abandonar el pecado y volvernos a Dios. Sin arrepentimiento no hay perdón.<br /><br /><b><LinkBiblico cita="Lucas 13:3" />, <LinkBiblico cita="Hechos 3:19" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("insisten en el bautismo")) {
      respuesta.texto = <span>Porque es un mandamiento directo de Jesucristo. Al ser bautizados invocando el nombre de Jesucristo, nuestros pecados son lavados y sepultamos nuestra vieja naturaleza.<br /><br /><b><LinkBiblico cita="Marcos 16:16" />, <LinkBiblico cita="Hechos 22:16" />.</b></span>;
      respuesta.opciones = ["Salvación y Bautismo"];
    }
    else if (textoMinusculas.includes("reglas de vestimenta")) {
      respuesta.texto = <span>Buscamos agradar a Dios a través de la santidad. La ropa que usamos debe reflejar modestia, pudor y respeto, honrando a Dios con nuestros cuerpos.<br /><br /><b><LinkBiblico cita="1 Timoteo 2:9-10" />, <LinkBiblico cita="1 Corintios 6:19-20" />.</b></span>;
      respuesta.opciones = ["Vestimenta y Apariencia"];
    }
    else if (textoMinusculas.includes("pecado maquillarse") || textoMinusculas.includes("usar joyas")) {
      respuesta.texto = <span>La Biblia advierte contra la ostentación y la vanidad. El verdadero adorno del creyente no debe ser externo con oro o perlas, sino un espíritu afable y apacible.<br /><br /><b><LinkBiblico cita="1 Pedro 3:3-4" />.</b></span>;
      respuesta.opciones = ["Vestimenta y Apariencia"];
    }
    else if (textoMinusculas.includes("normas reflejan espiritualidad")) {
      respuesta.texto = <span>Sí. Un corazón transformado por Dios se refleja en nuestra manera de hablar, actuar y vestir. La santidad abarca espíritu, alma y cuerpo.<br /><br /><b><LinkBiblico cita="1 Tesalonicenses 5:23" />.</b></span>;
      respuesta.opciones = ["Vestimenta y Apariencia"];
    }
    else if (textoMinusculas.includes("culturales o bíblicas")) {
      respuesta.texto = <span>Aunque las modas cambian, principios bíblicos como la distinción entre géneros y la modestia son eternos. Los aplicamos para no amoldarnos a la corriente del mundo.<br /><br /><b><LinkBiblico cita="Romanos 12:2" />, <LinkBiblico cita="Deuteronomio 22:5" />.</b></span>;
      respuesta.opciones = ["Vestimenta y Apariencia"];
    }
    else if (textoMinusculas.includes("versión de la biblia")) {
      respuesta.texto = <span>Principalmente utilizamos la traducción Reina-Valera 1960 por su precisión, fidelidad a los textos originales (Textus Receptus) y lenguaje reverente.</span>;
      respuesta.opciones = ["Volver al menú doctrinal"];
    }
    else if (textoMinusculas.includes("dios es uno") || textoMinusculas.includes("trinidad")) {
      respuesta.texto = <span>La Biblia declara un monoteísmo estricto. La palabra "Trinidad" no aparece en las Escrituras. Creemos que Dios es un ser único, indivisible.<br /><br /><b><LinkBiblico cita="Deuteronomio 6:4" />, <LinkBiblico cita="Isaías 43:10-11" />.</b></span>;
      respuesta.opciones = ["La Unicidad de Dios"];
    }
    else if (textoMinusculas.includes("el padre, el hijo y el espíritu santo")) {
      respuesta.texto = <span>Son manifestaciones o roles de un único Dios cumpliendo su plan. Dios es Padre en la Creación, Hijo en la redención y Espíritu Santo en la iglesia hoy. Su nombre es Jesús.<br /><br /><b><LinkBiblico cita="1 Timoteo 3:16" />.</b></span>;
      respuesta.opciones = ["La Unicidad de Dios"];
    }
    else if (textoMinusculas.includes("con quién hablaba")) {
      respuesta.texto = <span>Jesús era 100% humano y 100% Dios. Al orar, vemos a su humanidad sometiéndose a su deidad residente. No son dos personas, sino el hombre perfecto buscando al Espíritu eterno en Él.<br /><br /><b><LinkBiblico cita="Hebreos 5:7" />, <LinkBiblico cita="2 Corintios 5:19" />.</b></span>;
      respuesta.opciones = ["La Unicidad de Dios"];
    }
    else if (textoMinusculas.includes("dios o una manifestación")) {
      respuesta.texto = <span>Creemos que Jesucristo es el Dios Todopoderoso hecho carne. Él es Dios completo. En Él habita toda la plenitud de la deidad.<br /><br /><b><LinkBiblico cita="Colosenses 2:9" />, <LinkBiblico cita="Isaías 9:6" />.</b></span>;
      respuesta.opciones = ["La Unicidad de Dios"];
    }
    else if (textoMinusculas.includes("hijo de dios")) {
      respuesta.texto = <span>Se refiere a la humanidad de Jesucristo, el cuerpo engendrado. Dios preparó un cuerpo para derramar sangre. El "Hijo" tuvo principio en el tiempo, pero el Espíritu en Él es eterno.<br /><br /><b><LinkBiblico cita="Lucas 1:35" />, <LinkBiblico cita="Gálatas 4:4" />.</b></span>;
      respuesta.opciones = ["La Unicidad de Dios"];
    }
    else if (textoMinusculas.includes("otra consulta (whatsapp)") || textoMinusculas.includes("whatsapp") || textoMinusculas.includes("otra pregunta")) {
      respuesta = {
        rol: "bot",
        texto: (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span>Si no encontraste tu respuesta aquí, con todo gusto puedes contactar al Hno. Eduardo Rabago directamente por WhatsApp. Él te atenderá con gusto.</span>
            <a 
              href="https://wa.me/526421001085?text=Paz%20de%20Cristo%20Hno.%20Eduardo%20Rabago,%20tengo%20una%20duda%20sobre:"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#25D366", color: "#fff", padding: "10px 14px", borderRadius: "6px",
                textAlign: "center", textDecoration: "none", fontWeight: "bold", display: "inline-block"
              }}
            >
              💬 Enviar WhatsApp al Hno. Eduardo
            </a>
          </div>
        ),
        opciones: ["Volver al inicio"]
      };
    }

    setTimeout(() => {
      setHistorial((prev) => [...prev, respuesta]);
    }, 600);
  };

  const enviarMensajeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    const textoActual = mensaje;
    setMensaje(""); 
    procesarEntrada(textoActual);
  };

  const handleOpcionClick = (opcionText: string) => {
    procesarEntrada(opcionText);
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const modalContainerStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, width: '100vw', height: '100dvh', minHeight: '100svh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { position: 'relative', width: 'min(600px, 92vw)', maxHeight: '72vh', backgroundColor: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '0 auto' };

  const modalAnimationStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : { opacity: modalActive ? 1 : 0, transform: modalActive ? 'none' : 'scale(0.985) translateY(6px)', transition: 'transform 180ms ease, opacity 180ms ease' };

  return (
    <div style={{ position: "fixed", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", right: "20px", zIndex: 40, fontFamily: "system-ui, -apple-system, sans-serif" }} className="md:right-5">
      
      <style>{`
        @keyframes clearProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {!isOpen ? (
        <>
          <div style={{
            position: 'absolute', bottom: '100%', right: '0', marginBottom: '16px', backgroundColor: '#fff', border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px 16px', borderRadius: '8px', width: 'max-content', maxWidth: '220px',
            fontSize: '14px', fontWeight: 500, color: '#111827', textAlign: 'left',
            opacity: mostrarAyuda ? 1 : 0, transform: mostrarAyuda ? 'translateY(0)' : 'translateY(10px)', pointerEvents: mostrarAyuda ? 'auto' : 'none', transition: 'all 100ms ease'
          }}>
           ¡Paz de Cristo! 👋 ¿Tienes alguna duda? Aquí estoy para ayudarte.
            <div style={{ position: 'absolute', bottom: '-6px', right: isMobile ? '14px' : '20px', width: '10px', height: '10px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', transform: 'rotate(45deg)' }} />
          </div>

          <button onClick={toggleChat} aria-label="Abrir Asistente" className="hidden md:flex items-center justify-center w-14 h-14 bg-[#21252b] text-white transition-transform hover:scale-105" style={{ borderRadius: 6, border: 'none', fontWeight: 600 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      ) : (
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={toggleChat} />

            <div style={{ ...modalContainerStyle, ...modalAnimationStyle }} role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
              <div style={{ backgroundColor: '#21252b', zIndex: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 id="chatbot-title" style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, textTransform: 'uppercase' }}>ASISTENCIA VIRTUAL</h3>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {historial.length > 1 && !isClearing && (
                    <button 
                      onClick={limpiarChat} 
                      aria-label="Limpiar chat" 
                      title="Limpiar chat"
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  )}
                  <button onClick={toggleChat} aria-label="Cerrar Asistente" style={{ height: 40, width: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>×</span>
                  </button>
                </div>
              </div>

              {isClearing ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                  <span style={{ fontSize: '15px', color: '#4b5563', marginBottom: '16px', fontWeight: 500 }}>Borrando el contenido del chat...</span>
                  <div style={{ width: '180px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      backgroundColor: '#ff6b6b', 
                      animation: 'clearProgress 1.4s ease-out forwards' 
                    }} />
                  </div>
                </div>
              ) : (
                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', textAlign: 'left', color: '#111827', fontSize: isMobile ? 17 : 15 }}>
                  {historial.map((msg, index) => (
                    <div key={index} style={{ alignSelf: 'stretch', marginBottom: 16 }}>
                      <div style={{
                        backgroundColor: msg.rol === 'usuario' ? '#2b4c7e' : '#f3f4f6',
                        color: msg.rol === 'usuario' ? '#fff' : '#374151',
                        padding: '10px 12px',
                        borderRadius: 6,
                        maxWidth: '100%',
                        display: 'inline-block'
                      }}>
                        {msg.texto}
                      </div>

                      {msg.opciones && msg.opciones.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                          {msg.opciones.map((opcion, i) => (
                            <button
                              key={i}
                              onClick={() => handleOpcionClick(opcion)}
                              style={{
                                backgroundColor: '#fff', border: '1px solid #2b4c7e', color: '#2b4c7e',
                                padding: '6px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#2b4c7e'; e.currentTarget.style.color = '#fff'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#2b4c7e'; }}
                            >
                              {opcion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <form onSubmit={enviarMensajeForm} style={{ display: 'flex', gap: 8, paddingTop: 12, paddingRight: 16, paddingLeft: 16, paddingBottom: isMobile ? 'calc(12px + env(safe-area-inset-bottom, 0px))' : 16, borderTop: '1px solid #e6e6e6', backgroundColor: '#fff' }}>
                <input
                  type="text"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  disabled={isClearing}
                  placeholder={isClearing ? "Borrando chat..." : "Escribe tu duda aquí..."}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 4, border: '1px solid #d1d5db', outline: 'none', fontSize: isMobile ? 17 : 15, opacity: isClearing ? 0.6 : 1 }}
                />
                <button type="submit" disabled={isClearing} aria-label="Enviar mensaje" style={{ width: 44, height: 40, backgroundColor: '#2b4c7e', color: '#fff', border: 'none', borderRadius: 4, cursor: isClearing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isClearing ? 0.6 : 1 }}>
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