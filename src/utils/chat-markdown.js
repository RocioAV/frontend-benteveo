const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g

export function parseInline(texto) {
  const nodos = []
  const partes = texto.split(INLINE_PATTERN)

  for (const parte of partes) {
    if (!parte) continue
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      nodos.push({ type: 'bold', value: parte.slice(2, -2) })
    } else if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) {
      nodos.push({ type: 'code', value: parte.slice(1, -1) })
    } else {
      nodos.push({ type: 'text', value: parte })
    }
  }

  return nodos
}

export function parseChatMarkdown(texto) {
  const lineas = String(texto ?? '').split('\n')
  const bloques = []
  let parrafo = null
  let lista = null

  const cerrarParrafo = () => {
    if (parrafo) {
      bloques.push(parrafo)
      parrafo = null
    }
  }
  const cerrarLista = () => {
    if (lista) {
      bloques.push(lista)
      lista = null
    }
  }

  for (const linea of lineas) {
    const item = linea.match(/^\s*[-*]\s+(.*)$/)

    if (item) {
      cerrarParrafo()
      if (!lista) lista = { type: 'list', items: [] }
      lista.items.push(parseInline(item[1]))
      continue
    }

    cerrarLista()

    if (linea.trim() === '') {
      cerrarParrafo()
      continue
    }

    if (!parrafo) parrafo = { type: 'paragraph', lines: [] }
    parrafo.lines.push(parseInline(linea))
  }

  cerrarParrafo()
  cerrarLista()

  return bloques
}
