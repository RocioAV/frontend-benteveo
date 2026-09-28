import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteProductPhoto,
  fetchProduct,
  updateProduct,
  uploadProductPhotos,
} from '../services/products.service.js'
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

const MAX_PRODUCT_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

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
  const [existingPhotos, setExistingPhotos] = useState([])
  const [markedPhotoIds, setMarkedPhotoIds] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const newPhotosRef = useRef([])

  const replaceNewPhotos = (photos) => {
    newPhotosRef.current = photos
    setNewPhotos(photos)
  }

  const clearNewPhotos = () => {
    newPhotosRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
    replaceNewPhotos([])
  }

  useEffect(() => () => {
    newPhotosRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl))
  }, [])

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
        setExistingPhotos(product.photos ?? [])
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

  const finalPhotoCount =
    existingPhotos.length - markedPhotoIds.length + newPhotos.length

  const toggleExistingPhoto = (publicId) => {
    setSaveError('')
    setMarkedPhotoIds((current) =>
      current.includes(publicId)
        ? current.filter((idToKeep) => idToKeep !== publicId)
        : [...current, publicId],
    )
  }

  const handleNewPhotos = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) return

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type))
    if (invalidType) {
      setSaveError('Las fotos deben ser archivos JPG, PNG o WEBP.')
      return
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE)
    if (oversizedFile) {
      setSaveError('Cada foto debe pesar como máximo 5 MB.')
      return
    }

    if (finalPhotoCount + files.length > MAX_PRODUCT_IMAGES) {
      setSaveError(`Podés conservar como máximo ${MAX_PRODUCT_IMAGES} fotos.`)
      return
    }

    const additions = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    replaceNewPhotos([...newPhotos, ...additions])
    setSaveError('')
  }

  const removeNewPhoto = (previewUrl) => {
    URL.revokeObjectURL(previewUrl)
    replaceNewPhotos(newPhotos.filter((photo) => photo.previewUrl !== previewUrl))
    setSaveError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (finalPhotoCount < 1 || finalPhotoCount > MAX_PRODUCT_IMAGES) {
      setSaveError(
        `La publicación debe conservar entre 1 y ${MAX_PRODUCT_IMAGES} fotos.`,
      )
      return
    }

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

      if (newPhotos.length > 0) {
        await uploadProductPhotos(id, newPhotos.map(({ file }) => file))
      }

      for (const publicId of markedPhotoIds) {
        await deleteProductPhoto(publicId)
      }

      navigate('/dashboard?tab=publicaciones')
    } catch {
      setSaveError('No pudimos guardar los cambios.')

      clearNewPhotos()

      try {
        const product = await fetchProduct(id)
        setExistingPhotos(product.photos ?? [])
        setMarkedPhotoIds([])
      } catch {
        setSaveError('No pudimos guardar los cambios ni actualizar las fotos.')
      }
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
        <button className="editar-publicacion-back" type="button" onClick={() => navigate('/dashboard?tab=publicaciones')} disabled={saving}>
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
          />
        </div>

        <div className="editar-publicacion-field">
          <label htmlFor="edit-category">Categoría</label>
          <select
            id="edit-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={saving}
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
            disabled={saving}
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
            disabled={!formData.state || saving}
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
            disabled={saving}
          />
        </div>

        <section className="editar-publicacion-photos editar-publicacion-full-width">
          <h2>Fotos del producto ({finalPhotoCount}/{MAX_PRODUCT_IMAGES})</h2>
          <p className="editar-publicacion-photo-help" id="edit-photos-help">
            Se aceptan imágenes de hasta 5 MB.
          </p>

          <div className="editar-publicacion-photo-grid">
            {existingPhotos.map((photo, index) => {
              const markedForDeletion = markedPhotoIds.includes(photo.publicId)

              return (
                <article
                  className={`editar-publicacion-photo-card${markedForDeletion ? ' is-marked' : ''}`}
                  key={photo.id ?? photo.publicId}
                >
                  <img
                    src={photo.url}
                    alt={`Foto ${index + 1} de ${formData.title}`}
                  />
                  {markedForDeletion && (
                    <span className="editar-publicacion-photo-status">Marcada para eliminar</span>
                  )}
                  <button
                    type="button"
                    className="editar-publicacion-photo-action"
                    aria-pressed={markedForDeletion}
                    onClick={() => toggleExistingPhoto(photo.publicId)}
                    disabled={saving}
                  >
                    {markedForDeletion ? 'Conservar foto' : 'Eliminar foto'}
                  </button>
                </article>
              )
            })}

            {newPhotos.map(({ file, previewUrl }, index) => (
              <article className="editar-publicacion-photo-card" key={previewUrl}>
                <img src={previewUrl} alt={`Vista previa de ${file.name}`} />
                <span className="editar-publicacion-photo-status is-new">
                  Foto nueva {index + 1}
                </span>
                <button
                  type="button"
                  className="editar-publicacion-photo-action"
                  onClick={() => removeNewPhoto(previewUrl)}
                  disabled={saving}
                >
                  Quitar foto nueva
                </button>
              </article>
            ))}
          </div>

          <label
            className="editar-publicacion-photo-picker"
            htmlFor="edit-photos"
            aria-disabled={saving}
          >
            Agregar fotos
            <input
              className="editar-publicacion-photo-input"
              id="edit-photos"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              aria-describedby="edit-photos-help"
              onChange={handleNewPhotos}
              disabled={saving}
            />
          </label>
        </section>

        <label className="editar-publicacion-available editar-publicacion-full-width" htmlFor="edit-available">
          <input
            id="edit-available"
            name="isAvailable"
            type="checkbox"
            checked={formData.isAvailable}
            onChange={handleChange}
            disabled={saving}
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
