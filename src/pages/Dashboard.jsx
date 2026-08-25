import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { toast } from 'react-toastify'
import './Dashboard.css'

const mockReservas = [
  { id: 1, producto: 'Taladro electrico', fecha: '2025-06-20', estado: 'Completada', total: 6000 },
  { id: 2, producto: 'Carpa de camping', fecha: '2025-07-05', estado: 'Activa', total: 12000 },
  { id: 3, producto: 'Proyector portatil', fecha: '2025-07-15', estado: 'Pendiente', total: 9000 },
]

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('perfil')
  const [editando, setEditando] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || 'Usuario Benteveo',
    email: user?.email || 'usuario@email.com',
    phone: user?.phone || '11 1234-5678',
    dni: user?.dni || '12345678',
    bio: user?.bio || 'Vecino de Almagro, me gusta compartir herramientas.'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    setEditando(false)
    toast.success('Perfil actualizado correctamente')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Completada': return 'estado-completada'
      case 'Activa': return 'estado-activa'
      case 'Pendiente': return 'estado-pendiente'
      case 'Cancelada': return 'estado-cancelada'
      default: return ''
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-avatar">
          <span>{formData.name.charAt(0)}</span>
        </div>
        <h3>{formData.name}</h3>
        <p className="sidebar-email">{formData.email}</p>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'perfil' ? 'active' : ''}
            onClick={() => setActiveTab('perfil')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Mi Perfil
          </button>
          <button
            className={activeTab === 'reservas' ? 'active' : ''}
            onClick={() => setActiveTab('reservas')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Mis Reservas
          </button>
          <button
            className={activeTab === 'favoritos' ? 'active' : ''}
            onClick={() => setActiveTab('favoritos')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritos
          </button>
          <button
            className={activeTab === 'config' ? 'active' : ''}
            onClick={() => setActiveTab('config')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Configuracion
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesion
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'perfil' && (
          <div className="perfil-section">
            <div className="section-header">
              <h2>Mi Perfil</h2>
              {!editando && (
                <button className="btn-editar" onClick={() => setEditando(true)}>
                  Editar perfil
                </button>
              )}
            </div>

            <div className="perfil-card">
              <div className="perfil-avatar-grande">
                <span>{formData.name.charAt(0)}</span>
              </div>

              <div className="perfil-campos">
                <div className="campo">
                  <label>Nombre completo</label>
                  {editando ? (
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                  ) : (
                    <p>{formData.name}</p>
                  )}
                </div>
                <div className="campo">
                  <label>Correo electronico</label>
                  {editando ? (
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                  ) : (
                    <p>{formData.email}</p>
                  )}
                </div>
                <div className="campo">
                  <label>Telefono</label>
                  {editando ? (
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                  ) : (
                    <p>{formData.phone}</p>
                  )}
                </div>
                <div className="campo">
                  <label>DNI</label>
                  <p>{formData.dni}</p>
                </div>
                <div className="campo campo-full">
                  <label>Sobre mi</label>
                  {editando ? (
                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} />
                  ) : (
                    <p>{formData.bio}</p>
                  )}
                </div>
              </div>

              {editando && (
                <div className="perfil-acciones">
                  <button className="btn-cancelar" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                  <button className="btn-guardar" onClick={handleSave}>
                    Guardar cambios
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reservas' && (
          <div className="reservas-section">
            <h2>Mis Reservas</h2>
            <div className="reservas-lista">
              {mockReservas.map((reserva) => (
                <div key={reserva.id} className="reserva-card">
                  <div className="reserva-info">
                    <h3>{reserva.producto}</h3>
                    <p>Fecha: {reserva.fecha}</p>
                    <span className={`reserva-estado ${getEstadoClass(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                  </div>
                  <div className="reserva-precio">
                    ${reserva.total.toLocaleString('es-AR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'favoritos' && (
          <div className="favoritos-section">
            <h2>Mis Favoritos</h2>
            <p className="favoritos-empty">Aun no guardaste ningun producto en favoritos.</p>
            <button className="btn-explorar" onClick={() => navigate('/explorar')}>
              Explorar productos
            </button>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="config-section">
            <h2>Configuracion</h2>
            <div className="config-card">
              <h3>Notificaciones</h3>
              <label className="toggle-label">
                <span>Notificaciones por email</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
              <label className="toggle-label">
                <span>Notificaciones push</span>
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="config-card">
              <h3>Privacidad</h3>
              <label className="toggle-label">
                <span>Mostrar telefono en mi perfil</span>
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
              <label className="toggle-label">
                <span>Mostrar email en mi perfil</span>
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="config-card danger-zone">
              <h3>Zona de peligro</h3>
              <button className="btn-eliminar-cuenta">Eliminar mi cuenta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
