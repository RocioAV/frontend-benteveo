import { useState, useRef, useEffect } from 'react'
import './ChatBot.css'

const respuestas = {
  hola: 'Hola! Soy Benti, el asistente de Benteveo. En que te puedo ayudar?',
  alquiler: 'Para alquilar un objeto, buscalo en Explorar, elegi las fechas y confirma la reserva. El pago se realiza de forma segura por MercadoPago.',
  publicar: 'Para publicar tu objeto, hace click en "Publica" y completa el formulario con fotos, precio por dia y descripcion.',
  pago: 'Los pagos se procesan por MercadoPago. Podes pagar con tarjeta de credito, debito o en cuotas.',
  garantia: 'Benteveo tiene un sistema de deposito en garantia. Tu dinero esta protegido hasta que recibas el objeto.',
  reserva: 'Para reservar, selecciona las fechas en el calendario del producto y confirma. Recibiras un email de confirmacion.',
  chat: 'Podes comunicarte directamente con el dueño del objeto a traves de nuestro chat interno.',
  reputacion: 'Despues de cada alquiler, podes calificar al dueño y viceversa. Esto genera confianza en la comunidad.',
  precio: 'Los precios los define cada dueño por dia. Podes ver el precio en la ficha de cada producto.',
  ayuda: 'Podes escribirme cualquier pregunta sobre la plataforma. Estoy aqui para ayudarte!',
  default: 'No estoy seguro de entender tu pregunta. Podes preguntarme sobre alquileres, publicaciones, pagos, reservas o garantias.'
}

function getRespuesta(mensaje) {
  const msg = mensaje.toLowerCase()
  
  for (const [clave, respuesta] of Object.entries(respuestas)) {
    if (msg.includes(clave)) {
      return respuesta
    }
  }
  
  return respuestas.default
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [mensajes, setMensajes] = useState([
    { id: 1, texto: 'Hola! Soy Benti, tu asistente virtual. Como te puedo ayudar?', esBot: true }
  ])
  const [input, setInput] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const mensajesRef = useRef(null)

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight
    }
  }, [mensajes])

  const handleSend = () => {
    if (!input.trim()) return

    const nuevoMensaje = {
      id: Date.now(),
      texto: input,
      esBot: false
    }

    setMensajes(prev => [...prev, nuevoMensaje])
    setInput('')
    setEscribiendo(true)

    setTimeout(() => {
      const respuesta = getRespuesta(input)
      setMensajes(prev => [...prev, {
        id: Date.now() + 1,
        texto: respuesta,
        esBot: true
      }])
      setEscribiendo(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="chatbot-container">
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-avatar">B</div>
            <div className="chatbot-info">
              <h3>Benti IA</h3>
              <span className="status-online">En linea</span>
            </div>
          </div>

          <div className="chatbot-mensajes" ref={mensajesRef}>
            {mensajes.map((msg) => (
              <div 
                key={msg.id} 
                className={`mensaje ${msg.esBot ? 'bot' : 'usuario'}`}
              >
                {msg.esBot && <div className="avatar-bot">B</div>}
                <div className="burbuja">
                  {msg.texto}
                </div>
              </div>
            ))}
            
            {escribiendo && (
              <div className="mensaje bot">
                <div className="avatar-bot">B</div>
                <div className="burbuja escribiendo">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribi tu pregunta..."
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="chatbot-sugerencias">
            <button onClick={() => { setInput('Como alquilo?'); }}>
              Como alquilo?
            </button>
            <button onClick={() => { setInput('Como publico?'); }}>
              Como publico?
            </button>
            <button onClick={() => { setInput('Que pasa con mi dinero?'); }}>
              Garantias
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBot
