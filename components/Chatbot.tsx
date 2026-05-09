'use client'; 

import { useState } from 'react';
import { usePathname } from 'next/navigation'; // 1. Importamos el lector de rutas

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState<any[]>([
    { rol: 'bot', texto: '¡Hola! ¿En qué te puedo ayudar hoy?' }
  ]);

  // 2. Obtenemos la ruta actual en la que está el usuario
  const pathname = usePathname();

  // 3. Hacemos una lista de las rutas donde SÍ queremos que aparezca
  // '/' significa la página de Inicio
  const rutasPermitidas = ['/', '/templos', '/directorio', '/coros', '/album', '/directiva'];

  // 4. Si la ruta actual NO está en la lista de permitidas, el bot desaparece por completo
  if (!rutasPermitidas.includes(pathname)) {
    return null;
  }

  const toggleChat = () => setIsOpen(!isOpen);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const textoUsuario = mensaje;
    setHistorial(prev => [...prev, { rol: 'usuario', texto: textoUsuario }]);
    setMensaje('');

    const textoMinusculas = textoUsuario.toLowerCase();
    let respuestaBot: any = "Lo siento, aún estoy aprendiendo. ¿Podrías intentar preguntarlo de otra forma?";

    if (textoMinusculas.includes('hola') || textoMinusculas.includes('buenos dias')) {
      respuestaBot = '¡Hola! Bienvenido a la plataforma de Región Mayo. ¿En qué te puedo ayudar hoy?';
    } else if (textoMinusculas.includes('evento') || textoMinusculas.includes('recorrido')) {
      respuestaBot = 'Nuestro próximo gran evento es el Recorrido Regional Mayo en la calle Obregón 45, Navojoa. ¡No olvides registrarte en la página principal!';
    } else if (textoMinusculas.includes('templo') || textoMinusculas.includes('iglesia') || textoMinusculas.includes('ubicación') || textoMinusculas.includes('donde')) {
      respuestaBot = 'Puedes encontrar la iglesia más cercana a ti utilizando el buscador GPS en la sección de "Templos" del menú superior.';
    } else if (textoMinusculas.includes('coro') || textoMinusculas.includes('pastor')) {
      respuestaBot = (
        <span>
          Toda la información sobre los coros y pastores de la región la encuentras en nuestro directorio.
          <br /><br />
          <a 
            href="/coros" 
            style={{ color: '#2b4c7e', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            👉 Pícale aquí para ir a la sección
          </a>
        </span>
      );
    }

    setTimeout(() => {
      setHistorial(prev => [...prev, { rol: 'bot', texto: respuestaBot }]);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {!isOpen ? (
        <button
          onClick={toggleChat}
          style={{ padding: '14px 24px', borderRadius: '30px', backgroundColor: '#2b4c7e', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(43, 76, 126, 0.3)', fontSize: '15px', fontWeight: '600', transition: 'transform 0.2s' }}
        >
          ✨ Asistente
        </button>
      ) : (
        <div style={{ width: '300px', height: '420px', backgroundColor: '#ffffff', borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          
          <div style={{ padding: '20px 20px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Asistente</h3>
            </div>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>×</button>
          </div>

          <div style={{ flex: 1, padding: '15px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#ffffff' }}>
            {historial.map((msg, index) => (
              <div key={index} style={{ 
                alignSelf: msg.rol === 'usuario' ? 'flex-end' : 'flex-start', 
                backgroundColor: msg.rol === 'usuario' ? '#2b4c7e' : '#f3f4f6', 
                padding: '12px 16px', 
                borderRadius: msg.rol === 'usuario' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                maxWidth: '85%', 
                color: msg.rol === 'usuario' ? '#ffffff' : '#374151',
                fontSize: '14px',
                lineHeight: '1.4',
                wordWrap: 'break-word'
              }}>
                {msg.texto}
              </div>
            ))}
          </div>

          <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '15px', backgroundColor: '#ffffff', gap: '8px' }}>
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: 'none', backgroundColor: '#f3f4f6', color: '#111827', outline: 'none', fontSize: '14px' }}
            />
            <button type="submit" style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, backgroundColor: '#2b4c7e', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              ↑
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
}