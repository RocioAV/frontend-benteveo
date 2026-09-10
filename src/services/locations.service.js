const GEOREF_BASE = 'https://apis.datos.gob.ar/georef/api'

export const provincias = [
  { id: '02', nombre: 'Ciudad Autónoma de Buenos Aires' },
  { id: '06', nombre: 'Buenos Aires' },
]

export async function fetchLocalitiesByProvince(provinceId) {
  const res = await fetch(
    `${GEOREF_BASE}/localidades?provincia=${provinceId}&campos=id,nombre&max=500`,
  )
  if (!res.ok) throw new Error('No se pudieron cargar las localidades')
  const data = await res.json()
  return data.localidades.map((l) => l.nombre).sort()
}
