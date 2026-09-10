import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import VerificationModal from '../components/VerificationModal/VerificationModal'
import { createProduct, uploadProductPhotos } from '../services/products.service'
import {
  provincias,
  fetchLocalitiesByProvince,
} from '../services/locations.service'
import './Publicar.css'

const categorias = [
  'Herramientas',
  'Electrodomesticos',
  'Electronica',
  'Muebles',
  'Aire libre',
  'Jardineria',
  'Cumpleanos y celebraciones',
]

function Publicar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isVerified = user?.isIdentityVerified === true
  const [verificationOpen, setVerificationOpen] = useState(false)
  const fileInputRef = useRef(null)
  const [paso, setPaso] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    descripcion: '',
    category: '',
    priceDay: '',
    priceMonth: '',
    deposit: '',
    city: '',
    state: '',
    address: '',
  })
  const [imageFiles, setImageFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [localities, setLocalities] = useState([])
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const province = provincias.find((p) => p.nombre === formData.state)
    if (!province) return

    const fetchId = ++fetchIdRef.current
    fetchLocalitiesByProvince(province.id)
      .then((locs) => {
        if (fetchId !== fetchIdRef.current) return
        setLocalities(locs)
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return
        toast.error('No se pudieron cargar las localidades')
      })
  }, [formData.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'state') {
      setFormData({ ...formData, state: value, city: '' })
      setLocalities([])
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }
    if (imageFiles.length >= 5) {
      toast.error('Máximo 5 imágenes')
      return
    }
    setImageFiles((prev) => [...prev, file])
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews((prev) => [...prev, reader.result])
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e) => {
    Array.from(e.target.files).forEach(processFile)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    Array.from(e.dataTransfer.files).forEach(processFile)
  }

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const validarPaso1 = () => {
    if (!formData.title.trim()) {
      toast.error('Ingresa un titulo')
      return false
    }
    if (!formData.descripcion.trim()) {
      toast.error('Ingresa una descripcion')
      return false
    }
    if (!formData.category) {
      toast.error('Selecciona una categoria')
      return false
    }
    if (imageFiles.length === 0) {
      toast.error('Subí al menos una imagen del producto')
      return false
    }
    return true
  }

  const validarPaso2 = () => {
    if (!formData.priceDay || formData.priceDay <= 0) {
      toast.error('Ingresa un precio por dia valido')
      return false
    }
    if (!formData.priceMonth || formData.priceMonth <= 0) {
      toast.error('Ingresa un precio por mes valido')
      return false
    }
    if (!formData.deposit || formData.deposit <= 0) {
      toast.error('Ingresa el deposito en garantia')
      return false
    }
    if (!formData.city.trim()) {
      toast.error('Ingresa la ciudad')
      return false
    }
    if (!formData.state.trim()) {
      toast.error('Ingresa la provincia')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Ingresa la direccion')
      return false
    }
    return true
  }

  const handleSiguiente = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2)
    } else if (paso === 2 && validarPaso2()) {
      setPaso(3)
    }
  }

  const handlePublicar = () => {
    setShowConfirmModal(true)
  }

  const confirmarPublicacion = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
      const payload = {
        title: formData.title,
        descripcion: formData.descripcion,
        priceDay: Number(formData.priceDay),
        priceMonth: Number(formData.priceMonth),
        deposit: Number(formData.deposit),
        city: formData.city,
        state: formData.state,
        address: formData.address,
        zone:
          formData.state === 'Ciudad Autónoma de Buenos Aires'
            ? 'CABA'
            : 'AMBA',
        category: formData.category,
      }
      const product = await createProduct(payload)
      if (imageFiles.length > 0) {
        await uploadProductPhotos(product.id, imageFiles)
      }
      toast.success('Producto publicado exitosamente')
      navigate('/explorar')
    } catch (err) {
      toast.error(err.message || 'No pudimos publicar tu producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="publicar-container">
      <button
        type="button"
        className="auth-back"
        onClick={() => navigate('/')}
      >
        <i className="fas fa-arrow-left" aria-hidden="true" /> Volver al
        inicio
      </button>

      {!isVerified ? (
        <div className="publicar-blocked">
          <div className="publicar-blocked-icon">
            <i className="fas fa-shield-halved" aria-hidden="true" />
          </div>
          <h2>Verificación requerida</h2>
          <p>
            Para publicar productos necesitás verificar tu identidad.
          </p>
          <button
            type="button"
            className="publicar-blocked-btn"
            onClick={() => setVerificationOpen(true)}
          >
            <i className="fas fa-id-card" aria-hidden="true" /> Verificar
            identidad
          </button>
        </div>
      ) : (
        <>
          <div className="publicar-header">
            <h1>Publicar producto</h1>
            <p>Comparti tus objetos con tu comunidad</p>
          </div>

      <div className="publicar-steps">
        <div className={`pub-step ${paso >= 1 ? 'active' : ''}`}>
          <span>1</span> Detalles
        </div>
        <div
          className={`pub-step-connector ${paso >= 2 ? 'active' : ''}`}
        ></div>
        <div className={`pub-step ${paso >= 2 ? 'active' : ''}`}>
          <span>2</span> Precio
        </div>
        <div
          className={`pub-step-connector ${paso >= 3 ? 'active' : ''}`}
        ></div>
        <div className={`pub-step ${paso >= 3 ? 'active' : ''}`}>
          <span>3</span> Confirmar
        </div>
      </div>

      <div className="publicar-form">
        {paso === 1 && (
          <div className="paso-content">
            <h2>Detalles del producto</h2>

            <div className="campo-grupo">
              <label>Titulo del producto</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Taladro electrico Bosch"
                maxLength={60}
              />
              <span className="char-count">
                {formData.title.length}/60
              </span>
            </div>

            <div className="campo-grupo">
              <label>Descripcion</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe tu producto, estado, accesorios incluidos..."
                rows={4}
                maxLength={300}
              />
              <span className="char-count">
                {formData.descripcion.length}/300
              </span>
            </div>

            <div className="campo-grupo">
              <label>Categoria</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoria</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-grupo">
              <label>
                Fotos del producto ({imageFiles.length}/5)
              </label>
              {previews.length > 0 && (
                <div className="preview-grid">
                  {previews.map((src, i) => (
                    <div key={src} className="preview-item">
                      <img src={src} alt={`Preview ${i + 1}`} />
                      <button
                        type="button"
                        className="preview-remove"
                        onClick={() => removeImage(i)}
                      >
                        <i className="fas fa-xmark" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imageFiles.length < 5 && (
                <div
                  className={`upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label className="upload-label">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>
                      Arrastra tus fotos aqui o haz click para seleccionar
                    </span>
                    <span className="upload-hint">
                      JPG, PNG o WEBP. Maximo 5MB cada una.
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="btn-siguiente" onClick={handleSiguiente}>
              Siguiente
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="paso-content">
            <h2>Precio y ubicacion</h2>

            <div className="campo-row">
              <div className="campo-grupo">
                <label>Precio por dia (ARS)</label>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    name="priceDay"
                    value={formData.priceDay}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="campo-grupo">
                <label>Precio por mes (ARS)</label>
                <div className="input-prefix">
                  <span>$</span>
                  <input
                    type="number"
                    name="priceMonth"
                    value={formData.priceMonth}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="campo-grupo">
              <label>Deposito en garantia (ARS)</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="campo-row">
              <div className="campo-grupo">
                <label>Provincia</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar</option>
                  {provincias.map((p) => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-grupo">
                <label>Localidad</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!formData.state}
                >
                  <option value="">
                    {formData.state
                      ? 'Seleccionar localidad'
                      : 'Primero elegí la provincia'}
                  </option>
                  {localities.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="campo-grupo">
              <label>Direccion</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Av. Mitre 1234"
              />
            </div>

            <div className="btn-group">
              <div className="btn-atras" onClick={() => setPaso(1)}>
                Atras
              </div>
              <div className="btn-siguiente" onClick={handleSiguiente}>
                Siguiente
              </div>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="paso-content">
            <h2>Confirmar publicacion</h2>

            <div className="resumen-publicacion">
              {previews.length > 0 && (
                <img
                  src={previews[0]}
                  alt="Producto"
                  className="resumen-img"
                />
              )}
              <div className="resumen-datos">
                <h3>{formData.title}</h3>
                <p className="resumen-categoria">{formData.category}</p>
                <p className="resumen-desc">{formData.descripcion}</p>
                <div className="resumen-ubicacion">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {formData.city}, {formData.state}
                </div>
                <div className="resumen-precios">
                  <div className="resumen-precio-item">
                    <span>Precio/dia</span>
                    <strong>
                      $
                      {Number(formData.priceDay).toLocaleString('es-AR')}
                    </strong>
                  </div>
                  <div className="resumen-precio-item">
                    <span>Precio/mes</span>
                    <strong>
                      $
                      {Number(formData.priceMonth).toLocaleString(
                        'es-AR',
                      )}
                    </strong>
                  </div>
                  <div className="resumen-precio-item">
                    <span>Garantia</span>
                    <strong>
                      $
                      {Number(formData.deposit).toLocaleString('es-AR')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="btn-group">
              <div className="btn-atras" onClick={() => setPaso(2)}>
                Atras
              </div>
              <div className="btn-publicar" onClick={handlePublicar}>
                {loading ? 'Publicando...' : 'Publicar producto'}
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3>Confirmar publicacion</h3>
            <p>
              Vas a publicar <strong>{formData.title}</strong> por $
              {Number(formData.priceDay).toLocaleString('es-AR')}/dia.
              Queres continuar?
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-cancelar"
                onClick={() => setShowConfirmModal(false)}
              >
                Revisar
              </button>
              <button
                className="btn-modal-confirmar"
                onClick={confirmarPublicacion}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      <VerificationModal
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
      />
    </div>
  )
}

export default Publicar
