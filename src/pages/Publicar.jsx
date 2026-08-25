import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Publicar.css'

const categorias = [
  'Herramientas',
  'Electrodomesticos',
  'Electronica',
  'Muebles',
  'Aire libre',
  'Jardineria',
  'Cumpleanos y celebraciones'
]

function Publicar() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricePerDay: '',
    deposit: '',
    city: '',
    region: 'Buenos Aires',
    deliveryMethod: 'A coordinar',
    imageUrl: ''
  })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setFormData({ ...formData, imageUrl: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const validarPaso1 = () => {
    if (!formData.title.trim()) {
      toast.error('Ingresa un titulo')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Ingresa una descripcion')
      return false
    }
    if (!formData.category) {
      toast.error('Selecciona una categoria')
      return false
    }
    return true
  }

  const validarPaso2 = () => {
    if (!formData.pricePerDay || formData.pricePerDay <= 0) {
      toast.error('Ingresa un precio valido')
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
    return true
  }

  const handleSiguiente = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2)
    } else if (paso === 2 && validarPaso2()) {
      setPaso(3)
    }
  }

  const handlePublicar = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Producto publicado exitosamente')
      navigate('/explorar')
    }, 2000)
  }

  return (
    <div className="publicar-container">
      <div className="publicar-header">
        <h1>Publicar producto</h1>
        <p>Comparti tus objetos con tu comunidad</p>
      </div>

      <div className="publicar-steps">
        <div className={`step ${paso >= 1 ? 'active' : ''}`}>
          <span>1</span> Detalles
        </div>
        <div className={`step-connector ${paso >= 2 ? 'active' : ''}`}></div>
        <div className={`step ${paso >= 2 ? 'active' : ''}`}>
          <span>2</span> Precio
        </div>
        <div className={`step-connector ${paso >= 3 ? 'active' : ''}`}></div>
        <div className={`step ${paso >= 3 ? 'active' : ''}`}>
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
              <span className="char-count">{formData.title.length}/60</span>
            </div>

            <div className="campo-grupo">
              <label>Descripcion</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe tu producto, estado, accesorios incluidos..."
                rows={4}
                maxLength={300}
              />
              <span className="char-count">{formData.description.length}/300</span>
            </div>

            <div className="campo-grupo">
              <label>Categoria</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Seleccionar categoria</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="campo-grupo">
              <label>Foto del producto</label>
              <div className="upload-area">
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Preview" className="image-preview" />
                    <button className="btn-remove" onClick={() => { setPreview(null); setFormData({ ...formData, imageUrl: '' }) }}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Subir foto</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
              </div>
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
                    name="pricePerDay"
                    value={formData.pricePerDay}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
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
            </div>

            <div className="campo-row">
              <div className="campo-grupo">
                <label>Ciudad</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ej: Lanus"
                />
              </div>

              <div className="campo-grupo">
                <label>Region</label>
                <select name="region" value={formData.region} onChange={handleChange}>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="Cordoba">Cordoba</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Mendoza">Mendoza</option>
                </select>
              </div>
            </div>

            <div className="campo-grupo">
              <label>Metodo de entrega</label>
              <select name="deliveryMethod" value={formData.deliveryMethod} onChange={handleChange}>
                <option value="A coordinar">A coordinar</option>
                <option value="Retiro en domicilio">Retiro en domicilio</option>
                <option value="Envio incluido">Envio incluido</option>
              </select>
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
              {preview && (
                <img src={preview} alt="Producto" className="resumen-img" />
              )}
              <div className="resumen-datos">
                <h3>{formData.title}</h3>
                <p className="resumen-categoria">{formData.category}</p>
                <p className="resumen-desc">{formData.description}</p>
                <div className="resumen-ubicacion">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {formData.city}, {formData.region}
                </div>
                <div className="resumen-precios">
                  <div className="resumen-precio-item">
                    <span>Precio/dia</span>
                    <strong>${Number(formData.pricePerDay).toLocaleString('es-AR')}</strong>
                  </div>
                  <div className="resumen-precio-item">
                    <span>Garantia</span>
                    <strong>${Number(formData.deposit).toLocaleString('es-AR')}</strong>
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
    </div>
  )
}

export default Publicar
