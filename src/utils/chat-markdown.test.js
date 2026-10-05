import { describe, expect, it } from 'vitest'
import { parseChatMarkdown, parseInline } from './chat-markdown'

describe('parseInline', () => {
  it('separa texto plano, negrita y código', () => {
    expect(parseInline('usá **MercadoPago** y listo')).toEqual([
      { type: 'text', value: 'usá ' },
      { type: 'bold', value: 'MercadoPago' },
      { type: 'text', value: ' y listo' },
    ])
  })

  it('reconoce bloques de código con acentos y espacios', () => {
    expect(parseInline('código `npm run dev` acá')).toEqual([
      { type: 'text', value: 'código ' },
      { type: 'code', value: 'npm run dev' },
      { type: 'text', value: ' acá' },
    ])
  })

  it('devuelve un único nodo de texto cuando no hay marcas', () => {
    expect(parseInline('hola mundo')).toEqual([
      { type: 'text', value: 'hola mundo' },
    ])
  })
})

describe('parseChatMarkdown', () => {
  it('agrupa líneas consecutivas en un párrafo', () => {
    const bloques = parseChatMarkdown('primera línea\nsegunda línea')

    expect(bloques).toEqual([
      {
        type: 'paragraph',
        lines: [
          [{ type: 'text', value: 'primera línea' }],
          [{ type: 'text', value: 'segunda línea' }],
        ],
      },
    ])
  })

  it('convierte líneas con guiones en listas', () => {
    const bloques = parseChatMarkdown(
      'Para reservar:\n- Elegí el producto\n- Confirmá las fechas\n- Pagá con MercadoPago',
    )

    expect(bloques).toHaveLength(2)
    expect(bloques[0].type).toBe('paragraph')
    expect(bloques[1]).toEqual({
      type: 'list',
      items: [
        [{ type: 'text', value: 'Elegí el producto' }],
        [{ type: 'text', value: 'Confirmá las fechas' }],
        [{ type: 'text', value: 'Pagá con MercadoPago' }],
      ],
    })
  })

  it('separa bloques por líneas vacías', () => {
    const bloques = parseChatMarkdown('uno\n\n- item uno\n- item dos')

    expect(bloques.map((b) => b.type)).toEqual(['paragraph', 'list'])
  })

  it('mantiene el HTML como texto plano (no lo interpreta)', () => {
    const bloques = parseChatMarkdown('<script>alert(1)</script>')

    expect(bloques[0].lines[0]).toEqual([
      { type: 'text', value: '<script>alert(1)</script>' },
    ])
  })

  it('maneja entradas vacías o inválidas sin lanzar', () => {
    expect(parseChatMarkdown('')).toEqual([])
    expect(parseChatMarkdown(null)).toEqual([])
    expect(parseChatMarkdown(undefined)).toEqual([])
  })
})
