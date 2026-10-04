import { useState, useRef, useEffect } from 'react'
import { getGeminiResponse } from '../../services/gemini'
import './ChatBot.css'

/*
  Paso a paso para convertir este chatbot en uno real con IA:
  1. Elegir un proveedor con plan gratuito (por ejemplo, Gemini o Groq), crear
    una cuenta y generar una API key con los permisos mínimos necesarios.
  2. No exponer la API key en React ni subirla al repositorio. Guardarla en
    variables de entorno del backend o frontend para probar (por ejemplo, GEMINI_API_KEY) y agregar
    el archivo .env al .gitignore.
  3. Crear un endpoint en el backend, como POST /api/chat, que reciba la
    pregunta, valide el usuario y aplique límites de uso. (Pedimelo a mi)
  4. Obtener la información pública de la web: extraer el contenido relevante
    de las páginas, limpiarlo y dividirlo en fragmentos. Para un proyecto
    pequeño puede guardarse en archivos o una base de datos; para una búsqueda
    semántica, generar embeddings y almacenarlos en una base vectorial.
  5. En cada pregunta, buscar los fragmentos más relacionados (RAG) y enviar al
    modelo un prompt con ese contexto, indicando que responda únicamente con
    información de Benteveo y que admita cuando no encuentre la respuesta.
  6. Desde handleSend, llamar al endpoint con fetch, mostrar un estado de carga,
    agregar la respuesta del backend a mensajes y manejar errores o timeouts.
  7. Configurar CORS, autenticación, sanitización del contenido, caché y límites
    de tokens/costo aunque sea gratuita. Revisar también los términos de uso y permisos de las webs
    antes de rastrearlas, y actualizar periódicamente el contenido indexado.
*/

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
  verificacion: 'Para verificar tu identidad, subi una foto de tu DNI o una selfie desde tu perfil. Es obligatorio para alquilar.',
  delivery: 'La entrega a domicilio la define el dueño. Podes ver las opciones de entrega en cada producto.',
  minimo: 'El minimo de alquiler son 2 dias. Esto esta indicado en cada ficha de producto.',
  mision: 'Benteveo es una plataforma de alquiler hiperlocal que conecta vecinos para compartir objetos. Nuestra mision es reducir el consumo y fortalecer la comunidad.',
  como_funciona: 'Benteveo funciona asi: 1) Busca un objeto, 2) Reserva las fechas, 3) Paga de forma segura, 4) Recibe el objeto, 5) Devuelve y califica.',
  contacto: 'Podes contactarnos por email a soporte@benteveo.com o por WhatsApp al +54 11 1234-5678.',
  email: 'Nuestro email de soporte es soporte@benteveo.com. Respondemos en menos de 24 horas.',
  whatsapp: 'Nuestro WhatsApp de soporte es +54 11 1234-5678. Atendemos de lunes a viernes de 9 a 18 horas.',
  ayuda: 'Podes escribirme cualquier pregunta sobre la plataforma. Estoy aqui para ayudarte!',
  default: 'No estoy seguro de entender tu pregunta. Podes preguntarme sobre alquileres, publicaciones, pagos, reservas, garantias, o contactar nuestro soporte.'
}

function getRespuestaLocal(mensaje) {
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

  const handleSend = async () => {
    if (!input.trim()) return

    const nuevoMensaje = {
      id: Date.now(),
      texto: input,
      esBot: false
    }

    setMensajes(prev => [...prev, nuevoMensaje])
    setInput('')
    setEscribiendo(true)

    const historial = mensajes.slice(-6)

    const respuestaAPI = await getGeminiResponse(input, historial)

    let respuesta

    if (respuestaAPI) {
      respuesta = respuestaAPI
    } else {
      respuesta = getRespuestaLocal(input)
    }

    setMensajes(prev => [...prev, {
      id: Date.now() + 1,
      texto: respuesta,
      esBot: true
    }])
    setEscribiendo(false)
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
            <button onClick={() => setInput('Como alquilo?')}>
              Alquilar
            </button>
            <button onClick={() => setInput('Como publico?')}>
              Publicar
            </button>
            <button onClick={() => setInput('Garantias')}>
              Garantias
            </button>
            <button onClick={() => setInput('Contacto')}>
              Soporte
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBot
