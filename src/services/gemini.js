const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
// Modelo configurable por .env. Default: reemplazo oficial barato tras la baja
// de gemini-2.0-flash (shutdown 01/06/2026). Ver https://ai.google.dev/gemini-api/docs/deprecations
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-lite'
// Base URL configurable por .env (sin trailing slash). Permite override en tests o proxy.
const GEMINI_API_BASE_URL = (import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '')
const GEMINI_API_URL = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_PROMPT = `Sos Benti, el asistente virtual de Benteveo, una plataforma de alquiler hiperlocal de Argentina.

Sobre Benteveo:
- Es una plataforma donde vecinos alquilan y publican objetos entre si
- Los pagos se procesan por MercadoPago (tarjeta, debito, cuotas)
- Hay un deposito en garantia que se devuelve al devolver el objeto
- Recuerda si hay un problema con el pago debes cancelar y volver a intentar
- La comision de la plataforma es del 10%
- Los precios los define cada dueño por dia
- Los usuarios deben verificar su identidad (DNI o selfie) para alquilar y esperar la verificacion
- La entrega a domicilio la definen entre usted y el dueño
- Hay chat interno entre dueño y reservista
- Despues de cada alquiler se puede calificar (reputacion)
- La mision es reducir el consumo y fortalecer la comunidad

Reglas de comportamiento:
- Respondes en espanol argentino
- Sos amigable y breve (maximo 2-3 oraciones)
- Si no sabes algo, decis que pueden contactar soporte
- Si te preguntan de algo que no es de la plataforma, redirigis a soporte
- Nunca inventas informacion que no tengas
- No das opiniones personales

Contacto de soporte:
- Email: soporte@benteveo.com
- WhatsApp: +54 11 1234-5678`

export async function getGeminiResponse(mensaje, historial = []) {
  if (!GEMINI_API_KEY) {
    return null
  }

  const contents = []

  historial.forEach((msg) => {
    contents.push({
      role: msg.esBot ? 'model' : 'user',
      parts: [{ text: msg.texto }]
    })
  })

  contents.push({
    role: 'user',
    parts: [{ text: mensaje }]
  })

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
          maxOutputTokens: 200
        }
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[Gemini] ${response.status} ${response.statusText} (modelo: ${GEMINI_MODEL}):`, errorBody)
      return null
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    }

    return null
  } catch (error) {
    console.error(`[Gemini] error de red (modelo: ${GEMINI_MODEL}):`, error)
    return null
  }
}
