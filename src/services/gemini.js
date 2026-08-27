const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const SYSTEM_PROMPT = `Sos Benti, el asistente virtual de Benteveo, una plataforma de alquiler hiperlocal de Argentina.

Sobre Benteveo:
- Es una plataforma donde vecinos alquilan y publican objetos entre si
- Los pagos se procesan por MercadoPago (tarjeta, debito, cuotas)
- Hay un deposito en garantia que se devuelve al devolver el objeto
- El minimo de alquiler es 2 dias
- La comision de la plataforma es del 10%
- Los precios los define cada dueño por dia
- Los usuarios deben verificar su identidad (DNI o selfie) para alquilar
- La entrega a domicilio la define el dueño (si/no con precio)
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
          temperature: 0.7,
          maxOutputTokens: 200
        }
      })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    }

    return null
  } catch (error) {
    return null
  }
}
