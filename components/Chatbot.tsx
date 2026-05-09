'use client'; // Súper importante en Next.js para usar interactividad

import { useState } from 'react';

export default function Chatbot() {
  // Estados para controlar la ventana y los mensajes
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([
    { rol: 'bot', texto: '¡Hola! ¿En qué te puedo ayudar hoy?' }
  ]);

  // Funciones equivalentes a tus antiguos toggleChat y cerrarChat
  const toggleChat = () => setIsOpen(!isOpen);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    // 1. Agregamos lo que el usuario escribió al historial
    setHistorial([...historial, { rol: 'usuario', texto: mensaje }]);
    setMensaje('');

    // 2. Simulamos una respuesta del bot después de 1 segundo
    // (Aquí es donde en el futuro conectaremos una IA o una base de datos)
    setTimeout(() => {
      setHistorial(prev => [
        ...prev, 
        { rol: 'bot', texto: 'Aún estoy en desarrollo, ¡pero ya casi quedo listo!' }
      ]);
    }, 1000);
  };

  // He usado estilos en línea (style={{...}}) para que funcione garantizado a la primera, 
  // sin importar qué framework de CSS (Tailwind, Sass) tenga configurado el proyecto.
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={toggleChat}
          style={{ padding: '15px 20px', borderRadius: '50px', backgroundColor: '#0070f3', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '16px', fontWeight: 'bold' }}
        >
          💬 Chat
        </button>
      ) : (
        <div style={{ width: '260px', height: '300px', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
          
          {/* Cabecera del Chat */}
          <div style={{ backgroundColor: '#0070f3', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Asistente Virtual</h3>
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
                fontSize: '14px'
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
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginRight: '8px', color: '#333', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Enviar
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
}