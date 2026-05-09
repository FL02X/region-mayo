'use client'; // Súper importante en Next.js para usar interactividad

import { useState } from 'react';

export default function Chatbot() {
  // Estados para controlar la ventana y los mensajes
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([
    { rol: 'bot', texto: '¡Hola! ¿En qué te puedo ayudar hoy?' }
  ]);

  // Función para abrir y cerrar el chat
  const toggleChat = () => setIsOpen(!isOpen);

  // Función principal para enviar y procesar mensajes
  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    // 1. Guardamos el mensaje del usuario en el historial
    const textoUsuario = mensaje;
    setHistorial(prev => [...prev, { rol: 'usuario', texto: textoUsuario }]);
    setMensaje('');

    // 2. Lógica del Bot: Convertimos el texto a minúsculas para buscar palabras clave
    const textoMinusculas = textoUsuario.toLowerCase();
    let respuestaBot = "Lo siento, aún estoy aprendiendo. ¿Podrías intentar preguntarlo de otra forma?";

    // 3. Diccionario de preguntas y respuestas
    if (textoMinusculas.includes('hola') || textoMinusculas.includes('buenos dias')) {
      respuestaBot = '¡Hola! Bienvenido a la plataforma de Región Mayo. ¿En qué te puedo ayudar hoy?';
      
    } else if (textoMinusculas.includes('evento') || textoMinusculas.includes('recorrido')) {
      respuestaBot = 'Nuestro próximo gran evento es el Recorrido Regional Mayo en la calle Obregón 45, Navojoa. ¡No olvides registrarte en la página principal!';
      
    } else if (textoMinusculas.includes('templo') || textoMinusculas.includes('iglesia') || textoMinusculas.includes('ubicación') || textoMinusculas.includes('donde')) {
      respuestaBot = 'Puedes encontrar la iglesia más cercana a ti utilizando el buscador GPS en la sección de "Templos" del menú superior.';
      
    } else if (textoMinusculas.includes('coro') || textoMinusculas.includes('pastor')) {
      respuestaBot = 'Toda la información sobre los coros y pastores de la región la encuentras navegando en el menú principal de arriba.';
    }

    // 4. Simulamos que el bot está "escribiendo" (retraso de 1 segundo)
    setTimeout(() => {
      setHistorial(prev => [...prev, { rol: 'bot', texto: respuestaBot }]);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '15px', right: '15px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={toggleChat}
          style={{ padding: '15px 20px', borderRadius: '50px', backgroundColor: '#0070f3', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: 'bold' }}
        >
          💬 Ayuda
        </button>
      ) : (
        <div style={{ width: '260px', height: '380px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          
          {/* Cabecera del Chat */}
          <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Asistente Virtual</h3>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✖</button>
          </div>

          {/* Área de Mensajes */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9f9f9' }}>
            {historial.map((msg, index) => (
              <div key={index} style={{ 
                alignSelf: msg.rol === 'usuario' ? 'flex-end' : 'flex-start', 
                backgroundColor: msg.rol === 'usuario' ? '#d1f4ff' : '#ffffff', 
                padding: '10px 14px', 
                borderRadius: '10px', 
                maxWidth: '85%', 
                color: '#333',
                border: msg.rol === 'bot' ? '1px solid #eee' : 'none',
                fontSize: '13px',
                wordWrap: 'break-word'
              }}>
                {msg.texto}
              </div>
            ))}
          </div>

          {/* Caja de Texto y Botón Enviar */}
          <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '10px', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe aquí..."
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginRight: '8px', color: '#333', outline: 'none', fontSize: '13px' }}
            />
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              Enviar
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
}