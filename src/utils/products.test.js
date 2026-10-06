import { describe, it, expect } from 'vitest'
import {
  normalizeText,
  parseDistance,
  formatProximity,
  isWithinRange,
  matchesQuery,
  getProductProximity,
  formatDistanceLabel,
} from './products.js'

describe('normalizeText', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizeText('Electrónica')).toBe('electronica')
    expect(normalizeText('Jardinería')).toBe('jardineria')
    expect(normalizeText('CABA')).toBe('caba')
  })

  it('tolera valores nulos', () => {
    expect(normalizeText(undefined)).toBe('')
    expect(normalizeText(null)).toBe('')
  })
})

describe('parseDistance', () => {
  it('parsea strings con punto y con coma', () => {
    expect(parseDistance('2.3 km')).toBe(2.3)
    expect(parseDistance('0,8 km')).toBe(0.8)
  })

  it('devuelve null para valores inválidos', () => {
    expect(parseDistance(undefined)).toBe(null)
    expect(parseDistance('n/a')).toBe(null)
    expect(parseDistance(42)).toBe(42)
  })
})

describe('formatProximity', () => {
  it('siempre devuelve cuadras de distancia', () => {
    expect(formatProximity('0.8 km')).toBe('A 8 cuadras de distancia')
    expect(formatProximity('2.3 km')).toBe('A 23 cuadras de distancia')
    expect(formatProximity('9.0 km')).toBe('A 90 cuadras de distancia')
  })

  it('usa singular para 1 cuadra', () => {
    expect(formatProximity('0.1 km')).toBe('A 1 cuadra de distancia')
  })

  it('devuelve null sin distancia', () => {
    expect(formatProximity(undefined)).toBe(null)
  })
})

describe('isWithinRange', () => {
  it('filtra productos a más de 1 km', () => {
    expect(isWithinRange('0.9 km')).toBe(true)
    expect(isWithinRange('1 km')).toBe(true)
    expect(isWithinRange('1.2 km')).toBe(false)
  })

  it('no considera cercana una distancia desconocida', () => {
    expect(isWithinRange(undefined)).toBe(false)
  })
})

describe('getProductProximity', () => {
  it('respeta la distancia entregada por el contrato', () => {
    expect(getProductProximity({ id: 'known', distance: '0.8 km' })).toEqual({
      distanceKm: 0.8,
      estimated: false,
      withinRadius: true,
    })
  })

  it('usa una distancia estimada determinista cuando falta el dato', () => {
    const product = { id: 'fallback-1', title: 'Taladro' }

    expect(getProductProximity(product)).toEqual(getProductProximity(product))
    expect(getProductProximity(product).estimated).toBe(true)
  })
})

describe('formatDistanceLabel', () => {
  it('usa una etiqueta neutral para el fallback interno', () => {
    expect(formatDistanceLabel(0.7, true)).toBe('Distancia: 0,7 km')
    expect(formatDistanceLabel(1.2)).toBe('Distancia: 1,2 km')
  })
})

describe('matchesQuery', () => {
  const product = { title: 'Taladro eléctrico', category: 'Herramientas', city: 'CABA' }

  it('matchea substring del título', () => {
    expect(matchesQuery(product, 'taladro')).toBe(true)
    expect(matchesQuery(product, 'eléctri')).toBe(true)
  })

  it('matchea ignorando acentos', () => {
    expect(matchesQuery(product, 'electrico')).toBe(true)
    expect(matchesQuery(product, 'TALADRO')).toBe(true)
  })

  it('matchea por categoría', () => {
    expect(matchesQuery(product, 'herramientas')).toBe(true)
  })

  it('matchea por ciudad', () => {
    expect(matchesQuery(product, 'caba')).toBe(true)
  })

  it('no matchea términos irrelevantes', () => {
    expect(matchesQuery(product, 'zzz')).toBe(false)
  })

  it('query vacía matchea todo', () => {
    expect(matchesQuery(product, '')).toBe(true)
    expect(matchesQuery(product, '   ')).toBe(true)
  })
})
