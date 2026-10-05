const BASE_URL = import.meta.env.VITE_API_URL
const TIMEOUT_MS = 60000
const HISTORY_LIMIT = 6

export function pageLabel(pathname) {
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
  if (pathname.startsWith('/publicaciones/')) return 'Editar publicación'
  if (pathname.startsWith('/login')) return 'Inicio de sesión'
  if (pathname.startsWith('/register')) return 'Registro'
  if (pathname.startsWith('/forgot-password')) return 'Recuperar contraseña'
  return 'Página no encontrada'
}

export function buildHistory(mensajes, limit = HISTORY_LIMIT) {
  return mensajes
    .filter((mensaje) => !mensaje.error)
    .slice(-limit)
    .map((mensaje) => ({
      role: mensaje.esBot ? 'model' : 'user',
      text: mensaje.texto,
    }))
}

export function createSseParser(onDelta) {
  let buffer = ''
  let error = false

  return {
    push(chunk) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const raw of lines) {
        const line = raw.replace(/\r$/, '')
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue

        let parsed
        try {
          parsed = JSON.parse(data)
        } catch {
          continue
        }

        if (parsed.error) {
          error = true
          continue
        }

        const parts = parsed.candidates?.[0]?.content?.parts
        const text = Array.isArray(parts)
          ? parts.map((part) => part.text ?? '').join('')
          : ''
        if (text) onDelta(text)
      }
    },
    flush() {
      if (buffer.trim()) {
        this.push(`${buffer}\n`)
        buffer = ''
      }
    },
    hasError() {
      return error
    },
  }
}

export async function streamChat({ message, history = [], context = null, onDelta, signal }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        message,
        history,
        ...(context ? { context } : {}),
      }),
      signal: controller.signal,
    })

    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok || !response.body || !contentType.includes('text/event-stream')) {
      return null
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let completo = ''

    const parser = createSseParser((delta) => {
      completo += delta
      onDelta?.(delta)
    })

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parser.push(decoder.decode(value, { stream: true }))
    }
    parser.flush()

    if (parser.hasError() || !completo) {
      return null
    }

    return completo
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}
