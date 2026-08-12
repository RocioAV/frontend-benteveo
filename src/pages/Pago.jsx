import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Pago.css'

const Pago = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const titulo = searchParams.get('titulo') || 'Taladro inalambrico'
  const precio = parseInt(searchParams.get('precio')) || 2500
  const dias = parseInt(searchParams.get('dias')) || 1
  const total = precio * dias

  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tarjeta: '',
    vencimiento: '',
    cvv: '',
    cuotas: '1'
  })

  const [errores, setErrores] = useState({})
  const [procesando, setProcesando] = useState(false)
  const [pagoExitoso, setPagoExitoso] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    let valor = value

    if (name === 'tarjeta') {
      valor = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
    }
    if (name === 'vencimiento') {
      valor = value.replace(/\D/g, '')
      if (valor.length >= 2) {
        valor = valor.slice(0, 2) + '/' + valor.slice(2, 4)
      }
    }
    if (name === 'cvv') {
      valor = value.replace(/\D/g, '').slice(0, 4)
    }

    setFormulario({ ...formulario, [name]: valor })
    setErrores({ ...errores, [name]: '' })
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'Requerido'
    if (!formulario.email.includes('@')) nuevosErrores.email = 'Email invalido'
    if (formulario.tarjeta.replace(/\s/g, '').length < 16) nuevosErrores.tarjeta = 'Numero invalido'
    if (formulario.vencimiento.length < 5) nuevosErrores.vencimiento = 'MM/AA'
    if (formulario.cvv.length < 3) nuevosErrores.cvv = 'CVV invalido'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return

    setProcesando(true)
    setTimeout(() => {
      setProcesando(false)
      setPagoExitoso(true)
    }, 2500)
  }

  if (pagoExitoso) {
    return (
      <div className="pago-container">
        <div className="pago-exitoso">
          <div className="check-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1>Pago aprobado</h1>
          <p>Tu reserva para <strong>{titulo}</strong> fue confirmada.</p>
          <p className="pago-monto">${total.toLocaleString('es-AR')}</p>
          <p className="pago-detalle">Recibiras un email de confirmacion en <strong>{formulario.email}</strong></p>
          <button className="btn-volver" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pago-container">
      <div className="pago-layout">
        <div className="pago-formulario">
          <h1>Finalizar pago</h1>
          <p className="pago-subtitle">Pago seguro con MercadoPago</p>

          <form onSubmit={handleSubmit}>
            <div className="campo-grupo">
              <label>Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                placeholder="Juan Perez"
                className={errores.nombre ? 'error' : ''}
              />
              {errores.nombre && <span className="error-text">{errores.nombre}</span>}
            </div>

            <div className="campo-grupo">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formulario.email}
                onChange={handleChange}
                placeholder="juan@email.com"
                className={errores.email ? 'error' : ''}
              />
              {errores.email && <span className="error-text">{errores.email}</span>}
            </div>

            <div className="campo-grupo">
              <label>Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                placeholder="11 1234-5678"
              />
            </div>

            <div className="campo-grupo">
              <label>Numero de tarjeta</label>
              <input
                type="text"
                name="tarjeta"
                value={formulario.tarjeta}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                className={errores.tarjeta ? 'error' : ''}
              />
              {errores.tarjeta && <span className="error-text">{errores.tarjeta}</span>}
              <div className="tarjetas-iconos">
                <span className="tarjeta-badge visa">VISA</span>
                <span className="tarjeta-badge mc">MC</span>
                <span className="tarjeta-badge amex">AMEX</span>
              </div>
            </div>

            <div className="campo-row">
              <div className="campo-grupo">
                <label>Vencimiento</label>
                <input
                  type="text"
                  name="vencimiento"
                  value={formulario.vencimiento}
                  onChange={handleChange}
                  placeholder="MM/AA"
                  className={errores.vencimiento ? 'error' : ''}
                />
                {errores.vencimiento && <span className="error-text">{errores.vencimiento}</span>}
              </div>
              <div className="campo-grupo">
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={formulario.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  className={errores.cvv ? 'error' : ''}
                />
                {errores.cvv && <span className="error-text">{errores.cvv}</span>}
              </div>
            </div>

            <div className="campo-grupo">
              <label>Cuotas</label>
              <select name="cuotas" value={formulario.cuotas} onChange={handleChange}>
                <option value="1">1 cuota de ${(total).toLocaleString('es-AR')}</option>
                <option value="3">3 cuotas de ${(total / 3).toLocaleString('es-AR')}</option>
                <option value="6">6 cuotas de ${(total / 6).toLocaleString('es-AR')}</option>
                <option value="12">12 cuotas de ${(total / 12).toLocaleString('es-AR')}</option>
              </select>
            </div>

            <button type="submit" className="btn-pagar" disabled={procesando}>
              {procesando ? (
                <span className="procesando">
                  <span className="spinner"></span>
                  Procesando...
                </span>
              ) : (
                `Pagar $${total.toLocaleString('es-AR')}`
              )}
            </button>

            <p className="pago-seguro">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="lock-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Pago 100% seguro. Tus datos estan protegidos.
            </p>
          </form>
        </div>

        <div className="pago-resumen">
          <h3>Resumen de compra</h3>
          <div className="resumen-item">
            <span>Producto</span>
            <strong>{titulo}</strong>
          </div>
          <div className="resumen-item">
            <span>Precio por dia</span>
            <span>${precio.toLocaleString('es-AR')}</span>
          </div>
          <div className="resumen-item">
            <span>Cantidad de dias</span>
            <span>{dias}</span>
          </div>
          <div className="resumen-item">
            <span>Deposito en garantia</span>
            <span>Incluido</span>
          </div>
          <div className="resumen-total">
            <span>Total</span>
            <strong>${total.toLocaleString('es-AR')}</strong>
          </div>
          <div className="resumen-mp">
            <span>Medio de pago</span>
            <div className="mp-logo">MercadoPago</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pago
