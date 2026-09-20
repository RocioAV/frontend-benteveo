import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProduct, updateProduct } from '../services/products.service.js'
import { provincias, fetchLocalitiesByProvince } from '../services/locations.service.js'
import './EditarPublicacion.css'

const CATEGORIES = [
  'Herramientas',
  'Electrodomesticos',
  'Electronica',
  'Muebles',
  'Aire libre',
  'Jardineria',
  'Cumpleanos y celebraciones',
]

function EditarPublicacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceDay: '',
    priceMonth: '',
    deposit: '',
    category: '',
    state: '',
    city: '',
    address: '',
    isAvailable: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [localities, setLocalities] = useState([])

  useEffect(() => {
    let cancelled = false

    fetchProduct(id)
      .then((product) => {
        if (cancelled) return

        setFormData({
          title: product.title ?? '',
          description: product.description ?? '',
          priceDay: product.pricePerDay ?? '',
          priceMonth: product.priceMonth ?? '',
          deposit: product.deposit ?? '',
          category: product.category ?? '',
          state: product.state ?? '',
          city: product.city ?? '',
          address: product.address ?? '',
          isAvailable: product.isAvailable ?? true,
        })
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return

        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    const province = provincias.find((p) => p.nombre === formData.state)

    if (!province) return

    let cancelled = false

    fetchLocalitiesByProvince(province.id)
      .then((items) => {
        if (!cancelled) setLocalities(items)
      })
      .catch(() => {
        if (!cancelled) setLocalities([])
      })

    return () => {
      cancelled = true
    }
  }, [formData.state])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'state') {
      setFormData((current) => ({
        ...current,
        state: value,
        city: '',
      }))
      setLocalities([])
      return
    }

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')

    const payload = {
      title: formData.title,
      descripcion: formData.description,
      priceDay: Number(formData.priceDay),
      priceMonth: Number(formData.priceMonth),
      deposit: Number(formData.deposit),
      category: formData.category,
      state: formData.state,
      city: formData.city,
      address: formData.address,
      zone:
        formData.state === 'Ciudad Autónoma de Buenos Aires'
          ? 'CABA'
          : 'AMBA',
      isAvailable: formData.isAvailable,
    }

    try {
      await updateProduct(id, payload)
      navigate('/dashboard?tab=publicaciones')
    } catch {
      setSaveError('No pudimos guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const localityOptions =
    formData.city && !localities.includes(formData.city)
      ? [formData.city, ...localities]
      : localities

  if (loading) return <p role="status">Cargando publicación...</p>

  if (error) return <p role="alert">No pudimos cargar la publicación.</p>

  return (
    <main className="editar-publicacion-page">
      <header className="editar-publicacion-header">
        <button className="editar-publicacion-back" type="button" onClick={() => navigate('/dashboard?tab=publicaciones')}>
          ← Volver a mis publicaciones
        </button>
        <h1 className="editar-publicacion-title">Editar publicación</h1>
        <p className="editar-publicacion-subtitle">Actualizá la información de tu producto.</p>
      </header>

      <form className="editar-publicacion-form" onSubmit={handleSubmit}>
        <div className="editar-publicacion-field editar-publicacion-full-width">
          <label htmlFor="edit-title">Título</label>
          <input
            id="edit-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            maxLength={60}
          />
        </div>

        <div className="editar-publicacion-field editar-publicacion-full-width">
          <label htmlFor="edit-description">Descripción</label>
          <textarea
            id="edit-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            maxLength={300}
          />
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-price-day">Precio por día</label>
          <input
            id="edit-price-day"
            name="priceDay"
            type="number"
            value={formData.priceDay}
            onChange={handleChange}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-price-month">Precio por mes</label>
          <input
            id="edit-price-month"
            name="priceMonth"
            type="number"
            value={formData.priceMonth}
            onChange={handleChange}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-deposit">Depósito</label>
          <input
            id="edit-deposit"
            name="deposit"
            type="number"
            value={formData.deposit}
            onChange={handleChange}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-category">Categoría</label>
          <select
            id="edit-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Seleccionar categoría</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-state">Provincia</label>
          <select
            id="edit-state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          >
            <option value="">Seleccionar Provincia</option>

            {provincias.map((province) => (
              <option key={province.id} value={province.nombre}>{province.nombre}</option>
            ))}
          </select>
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-city">Localidad</label>
          <select
            id="edit-city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!formData.state}
          >
            <option value="">Seleccionar localidad</option>

            {localityOptions.map((locality) => (
              <option key={locality} value={locality}>{locality}</option>
            ))}
          </select>
        </div>

        <div className="editar-publicacion-field editar-publicacion-full-width">
          <label htmlFor="edit-address">Dirección</label>
          <input
            id="edit-address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <label className="editar-publicacion-available editar-publicacion-full-width" htmlFor="edit-available">
          <input
            id="edit-available"
            name="isAvailable"
            type="checkbox"
            checked={formData.isAvailable}
            onChange={handleChange}
          />
          Publicación disponible
        </label>

        {saveError && (
          <p className="editar-publicacion-error editar-publicacion-full-width" role="alert">
            {saveError}
          </p>
        )}

        <button className="editar-publicacion-submit editar-publicacion-full-width" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </main>
  )
}

export default EditarPublicacion
