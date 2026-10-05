import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getGeminiResponse } from '../../services/gemini'
import './ChatBot.css'

const respuestas = {
  hola: 'Hola! Soy Benti, el asistente de Benteveo. En que te puedo ayudar?',
  alquiler: 'Para alquilar un objeto, buscalo en Explorar, elegi las fechas y confirma la reserva. El pago se realiza de forma segura por MercadoPago.',
  publicar: 'Para publicar tu objeto, hace click en "Publica" y completa el formulario con fotos, precio por dia y descripcion. Necesitas tener la identidad verificada.',
  pago: 'Los pagos se procesan por MercadoPago. Podes pagar con tarjeta de credito, debito o en cuotas. La plataforma cobra una comision del 10% sobre el total.',
  garantia: 'Benteveo tiene un sistema de deposito en garantia. Tu dinero esta protegido hasta que recibas el objeto y se libera al devolverlo en buen estado.',
  reserva: 'Para reservar, selecciona las fechas en el calendario del producto y confirma. El dueño confirma la reserva y despues coordinan la entrega.',
  chat: 'Podes comunicarte directamente con el dueño del objeto a traves de nuestro chat interno, en Conversaciones del Dashboard.',
  reputacion: 'Despues de cada alquiler, podes calificar con 1 a 5 estrellas. El promedio se muestra en la ficha del producto y genera confianza.',
  favorito: 'Hace click en el corazon de cualquier tarjeta o ficha para guardarlo en "Mis favoritos" del Dashboard. Necesitas iniciar sesion.',
  comentario: 'En la ficha de cada producto podes dejar un comentario con tu experiencia. Vos mismo podes eliminarlo despues.',
  precio: 'Los precios los define cada dueño por dia. Podes ver el precio por dia y el deposito en la ficha de cada producto.',
  verificacion: 'Para verificar tu identidad, subi tu DNI (frente y dorso) y una selfie desde tu perfil. Es obligatorio para alquilar o publicar y el administrador lo aprueba.',
  registro: 'Para registrarte, completa nombre, email, DNI y contrasena (minimo 8 caracteres con mayuscula, minuscula, numero y simbolo). Despues verifica tu identidad.',
  perfil: 'En Mi perfil del Dashboard editas nombre, telefono, bio y foto, y ves tu estado de verificacion.',
  entrega: 'Todo se gestiona en Agenda: el dueño entrega y vos confirmas la recepcion. Cada boton aparece solo cuando es tu turno.',
  devolucion: 'Al terminar, marca la devolucion y el dueño confirma la recepcion. Ahi la reserva pasa a Completada y se libera el deposito en garantia.',
  calificar: 'En la ficha del producto podes calificar de 1 a 5 estrellas y dejar un comentario. El promedio se recalcula automaticamente.',
  cancelar: 'La cancelacion es gratis si faltan mas de 48 horas para la entrega; si faltan 48 horas o menos, tiene cargo.',
  delivery: 'La entrega a domicilio la define el dueño. Podes ver las opciones de entrega en cada producto.',
  mision: 'Benteveo es una plataforma de alquiler hiperlocal que conecta vecinos para compartir objetos. Nuestra mision es reducir el consumo y fortalecer la comunidad.',
  como_funciona: 'Benteveo funciona asi: 1) Busca un objeto, 2) Reserva las fechas, 3) Paga de forma segura, 4) Recibe el objeto, 5) Devuelve y califica.',
  contacto: 'Podes contactarnos por email a soporte@benteveo.com o por WhatsApp al +54 11 1234-5678.',
  email: 'Nuestro email de soporte es soporte@benteveo.com. Respondemos en menos de 24 horas.',
  whatsapp: 'Nuestro WhatsApp de soporte es +54 11 1234-5678. Atendemos de lunes a viernes de 9 a 18 horas.',
  ayuda: 'Podes escribirme cualquier pregunta sobre la plataforma. Estoy aqui para ayudarte!',
  default: 'No estoy seguro de entender tu pregunta. Podes preguntarme sobre registro, perfil, alquileres, publicaciones, pagos, favoritos, calificaciones o garantias.'
}

function getRespuestaLocal(mensaje) {
  const msg = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const [clave, respuesta] of Object.entries(respuestas)) {
    if (msg.includes(clave)) {
      return respuesta
    }
  }

  return respuestas.default
}

function pageLabel(pathname) {
  if (pathname === '/') return 'Inicio'
  if (pathname.startsWith('/explorar')) return 'Catálogo de productos'
  if (pathname.startsWith('/detalle/')) return 'Ficha de un producto'
  if (pathname.startsWith('/reservation/')) return 'Formulario de reserva'
  if (pathname.startsWith('/pago-exitoso')) return 'Pago exitoso'
  if (pathname.startsWith('/pago-fallido')) return 'Pago fallido'
  if (pathname.startsWith('/pago-pendiente')) return 'Pago pendiente'
  if (pathname.startsWith('/reservas')) return 'Mis reservas'
  if (pathname.startsWith('/dashboard')) return 'Dashboard del usuario'
  if (pathname.startsWith('/chat/')) return 'Chat de una reserva'
  if (pathname.startsWith('/admin')) return 'Panel de administración'
  if (pathname.startsWith('/publicar')) return 'Publicar producto'
  if (pathname.startsWith('/login')) return 'Inicio de sesión'
  if (pathname.startsWith('/register')) return 'Registro'
  if (pathname.startsWith('/forgot-password')) return 'Recuperar contraseña'
  return 'Página no encontrada'
}

const ChatBot = () => {
  const location = useLocation()
  const { status } = useAuth()
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
    const contexto = {
      pagina: pageLabel(location.pathname),
      sesion: status === 'authed' ? 'usuario con sesión iniciada' : 'visitante sin sesión'
    }

    const respuestaAPI = await getGeminiResponse(input, historial, contexto)

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
