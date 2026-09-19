import { useEffect, useState, useCallback } from 'react'
import { motion, MotionConfig, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import {
  fetchRecentUsers,
  fetchUserByDni,
  fetchPendingVerifications,
  approveVerification,
  rejectVerification,
  fetchProductsByOwner,
  adminDeleteProduct,
  fetchReservationsByUser,
  adminCancelReservation,
} from '../services/admin.service.js'
import './AdminPanel.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const SECTIONS = [
  { id: 'usuarios', label: 'Usuarios', icon: 'fa-users' },
  { id: 'identidad', label: 'Validar identidad', icon: 'fa-shield-halved' },
  { id: 'publicaciones', label: 'Publicaciones', icon: 'fa-box' },
  { id: 'reservas', label: 'Reservas', icon: 'fa-calendar-days' },
]

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  ACTIVE: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
}

function formatDate(iso) {
  if (!iso) return '\u2014'
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '\u2014'
  }
}

function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('usuarios')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setLightbox(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightbox])

  if (!user || user.role !== 'ADMIN') return null

  return (
    <MotionConfig reducedMotion="user">
      <section className="admin">
        <nav className="admin-sidebar">
          <div className="admin-sidebar__header">
            <i className="fas fa-shield-halved" aria-hidden="true" />
            <span>Panel Admin</span>
          </div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`admin-sidebar__item ${activeSection === s.id ? 'admin-sidebar__item--active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <i className={`fas ${s.icon}`} aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="admin-main">
          <div style={{ display: activeSection === 'usuarios' ? '' : 'none' }}><UsuariosSection /></div>
          <div style={{ display: activeSection === 'identidad' ? '' : 'none' }}><IdentidadSection onPhotoClick={setLightbox} /></div>
          <div style={{ display: activeSection === 'publicaciones' ? '' : 'none' }}><PublicacionesSection /></div>
          <div style={{ display: activeSection === 'reservas' ? '' : 'none' }}><ReservasSection /></div>
        </div>
      </section>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="admin-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              className="admin-lightbox__inner"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={lightbox.url} alt={lightbox.label} />
              <span className="admin-lightbox__label">{lightbox.label}</span>
              <button className="admin-lightbox__close" onClick={() => setLightbox(null)}>
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

function UsuariosSection() {
  const [users, setUsers] = useState(null)
  const [dni, setDni] = useState('')
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [mode, setMode] = useState('recent')
  const [page, setPage] = useState(1)
  const perPage = 10

  const loadRecent = useCallback(async () => {
    try {
      const data = await fetchRecentUsers(50)
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar usuarios')
      setUsers([])
    }
  }, [])

  useEffect(() => { loadRecent() }, [loadRecent])

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = dni.trim()
    if (!trimmed) return

    setSearching(true)
    setNotFound(false)
    setUsers(null)
    setMode('search')
    setPage(1)
    try {
      const u = await fetchUserByDni(trimmed)
      if (!u) {
        setNotFound(true)
        setUsers([])
        return
      }
      setUsers([u])
    } catch {
      setNotFound(true)
      setUsers([])
    } finally {
      setSearching(false)
    }
  }

  const handleClear = () => {
    setDni('')
    setNotFound(false)
    setMode('recent')
    setPage(1)
    loadRecent()
  }

  const totalPages = users ? Math.ceil(users.length / perPage) : 0
  const paginatedUsers = users ? users.slice((page - 1) * perPage, page * perPage) : []

  return (
    <motion.div className="admin-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
      <div className="admin-section__header">
        <h2>Usuarios</h2>
        <form className="admin-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Ingresá el DNI..."
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="admin-search__input"
          />
          <button type="submit" className="admin-search__btn" disabled={searching}>
            {searching ? <i className="fas fa-spinner fa-spin" aria-hidden="true" /> : <i className="fas fa-search" aria-hidden="true" />}
          </button>
          {dni && (
            <button type="button" className="admin-search__btn admin-search__btn--clear" onClick={handleClear}>
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          )}
        </form>
      </div>

      {notFound && (
        <EmptyState message="No se encontró ningún usuario con ese DNI." />
      )}

      {!notFound && users && users.length === 0 && (
        <EmptyState message="No hay usuarios registrados." />
      )}

      {!notFound && paginatedUsers.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>DNI</th>
                  <th>Registro</th>
                  <th>Verificado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-table__name">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.dni}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${u.isIdentityVerified ? 'admin-badge--ok' : 'admin-badge--warn'}`}>
                        {u.isIdentityVerified ? 'Verificado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="admin-pagination__info">
                {page} / {totalPages}
              </span>
              <button
                className="admin-pagination__btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

function IdentidadSection({ onPhotoClick }) {
  const [requests, setRequests] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPendingVerifications()
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar verificaciones')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      await approveVerification(id)
      toast.success('Identidad aprobada')
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error('Error al aprobar')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Ingresa un motivo de rechazo')
      return
    }
    setProcessingId(id)
    try {
      await rejectVerification(id, rejectReason.trim())
      toast.success('Identidad rechazada')
      setRequests((prev) => prev.filter((r) => r.id !== id))
      setRejectingId(null)
      setRejectReason('')
    } catch {
      toast.error('Error al rechazar')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <motion.div className="admin-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
      <div className="admin-section__header">
        <h2>Validar identidad</h2>
        <span className="admin-section__count">{requests?.length ?? 0} pendientes</span>
      </div>

      {loading ? (
        <Skeleton rows={3} />
      ) : requests.length === 0 ? (
        <EmptyState message="No hay solicitudes de verificación pendientes." />
      ) : (
        <div className="admin-kyc-list">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id
            const isProcessing = processingId === req.id
            const isRejecting = rejectingId === req.id
            return (
              <motion.div key={req.id} className="admin-kyc-card" layout>
                <div className="admin-kyc-card__header" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                  <div className="admin-kyc-card__info">
                    <strong>{req.user.name}</strong>
                    <span>{req.user.email}</span>
                    <span className="admin-kyc-card__dni">DNI: {req.user.dni}</span>
                  </div>
                  <div className="admin-kyc-card__meta">
                    <span>{formatDate(req.createdAt)}</span>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} aria-hidden="true" />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="admin-kyc-card__body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="admin-kyc-photos">
                        <button type="button" className="admin-kyc-photo" onClick={() => onPhotoClick({ url: req.frontUrl, label: 'Frente DNI' })}>
                          <span>Frente</span>
                          <img src={req.frontUrl} alt="Frente DNI" />
                        </button>
                        <button type="button" className="admin-kyc-photo" onClick={() => onPhotoClick({ url: req.backUrl, label: 'Dorso DNI' })}>
                          <span>Dorso</span>
                          <img src={req.backUrl} alt="Dorso DNI" />
                        </button>
                        <button type="button" className="admin-kyc-photo" onClick={() => onPhotoClick({ url: req.selfieUrl, label: 'Selfie' })}>
                          <span>Selfie</span>
                          <img src={req.selfieUrl} alt="Selfie" />
                        </button>
                      </div>

                      <div className="admin-kyc-actions">
                        <motion.button
                          className="admin-btn admin-btn--approve"
                          whileTap={{ scale: 0.96 }}
                          transition={springLatch}
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id)}
                        >
                          <i className="fas fa-check" aria-hidden="true" /> Aprobar
                        </motion.button>

                        {isRejecting ? (
                          <div className="admin-kyc-reject-form">
                            <input
                              type="text"
                              placeholder="Motivo del rechazo..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="admin-input"
                            />
                            <div className="admin-kyc-reject-actions">
                              <motion.button
                                className="admin-btn admin-btn--reject"
                                whileTap={{ scale: 0.96 }}
                                transition={springLatch}
                                disabled={isProcessing}
                                onClick={() => handleReject(req.id)}
                              >
                                Confirmar rechazo
                              </motion.button>
                              <button
                                className="admin-btn admin-btn--ghost"
                                onClick={() => { setRejectingId(null); setRejectReason('') }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <motion.button
                            className="admin-btn admin-btn--reject"
                            whileTap={{ scale: 0.96 }}
                            transition={springLatch}
                            onClick={() => setRejectingId(req.id)}
                          >
                            <i className="fas fa-times" aria-hidden="true" /> Rechazar
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function PublicacionesSection() {
  const [dni, setDni] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [products, setProducts] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = dni.trim()
    if (!trimmed) return

    setSearching(true)
    setProducts(null)
    setFoundUser(null)
    try {
      const u = await fetchUserByDni(trimmed)
      if (!u) {
        toast.error('Usuario no encontrado')
        setFoundUser(null)
        return
      }
      setFoundUser(u)
      setLoadingProducts(true)
      try {
        const prods = await fetchProductsByOwner(u.id)
        setProducts(prods)
      } catch {
        toast.error('Error al cargar publicaciones')
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    } catch {
      toast.error('Usuario no encontrado')
      setFoundUser(null)
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await adminDeleteProduct(id)
      toast.success('Publicación eliminada')
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div className="admin-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
      <div className="admin-section__header">
        <h2>Publicaciones</h2>
      </div>

      <form className="admin-search admin-search--wide" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ingresá el DNI del usuario..."
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="admin-search__input"
        />
        <button type="submit" className="admin-search__btn" disabled={searching}>
          {searching ? <i className="fas fa-spinner fa-spin" aria-hidden="true" /> : <i className="fas fa-search" aria-hidden="true" />}
        </button>
      </form>

      {foundUser && (
        <div className="admin-user-found">
          <i className="fas fa-user" aria-hidden="true" />
          <span><strong>{foundUser.name}</strong> &mdash; {foundUser.email} &mdash; DNI {foundUser.dni}</span>
        </div>
      )}

      {loadingProducts ? (
        <Skeleton rows={4} />
      ) : products && products.length === 0 ? (
        <EmptyState message="Este usuario no tiene publicaciones." />
      ) : products ? (
        <div className="admin-products-grid">
          {products.map((p) => (
            <div key={p.id} className="admin-product-card">
              <div className="admin-product-card__img">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} />
                ) : (
                  <div className="admin-product-card__no-img"><i className="fas fa-image" aria-hidden="true" /></div>
                )}
              </div>
              <div className="admin-product-card__body">
                <h4>{p.title}</h4>
                <p>${p.pricePerDay?.toLocaleString('es-AR')} / día</p>
                <span className="admin-product-card__cat">{p.category}</span>
              </div>
              <div className="admin-product-card__actions">
                <motion.button
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p.id)}
                >
                  {deletingId === p.id ? <i className="fas fa-spinner fa-spin" aria-hidden="true" /> : <i className="fas fa-trash" aria-hidden="true" />}
                </motion.button>
                <Link to={`/detalle/${p.id}`} className="admin-btn admin-btn--detail admin-btn--sm" target="_blank">
                  <i className="fas fa-eye" aria-hidden="true" /> Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-placeholder">
          <i className="fas fa-search" aria-hidden="true" />
          <p>Ingresá el DNI de un usuario para ver sus publicaciones.</p>
        </div>
      )}
    </motion.div>
  )
}

function ReservasSection() {
  const [dni, setDni] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [reservations, setReservations] = useState(null)
  const [searching, setSearching] = useState(false)
  const [loadingRes, setLoadingRes] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = dni.trim()
    if (!trimmed) return

    setSearching(true)
    setReservations(null)
    setFoundUser(null)
    try {
      const u = await fetchUserByDni(trimmed)
      if (!u) {
        toast.error('Usuario no encontrado')
        setFoundUser(null)
        return
      }
      setFoundUser(u)
      setLoadingRes(true)
      try {
        const res = await fetchReservationsByUser(u.id)
        setReservations(Array.isArray(res) ? res : [])
      } catch {
        toast.error('Error al cargar reservas')
        setReservations([])
      } finally {
        setLoadingRes(false)
      }
    } catch {
      toast.error('Usuario no encontrado')
      setFoundUser(null)
    } finally {
      setSearching(false)
    }
  }

  const handleCancel = async (id) => {
    setCancellingId(id)
    try {
      await adminCancelReservation(id)
      toast.success('Reserva cancelada')
      setReservations((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'CANCELLED' } : r)
      )
    } catch {
      toast.error('Error al cancelar')
    } finally {
      setCancellingId(null)
    }
  }

  const handleViewReservation = () => {
    toast.info('Detalle de reserva próximamente')
  }

  return (
    <motion.div className="admin-section" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
      <div className="admin-section__header">
        <h2>Reservas</h2>
      </div>

      <form className="admin-search admin-search--wide" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ingresá el DNI del usuario..."
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="admin-search__input"
        />
        <button type="submit" className="admin-search__btn" disabled={searching}>
          {searching ? <i className="fas fa-spinner fa-spin" aria-hidden="true" /> : <i className="fas fa-search" aria-hidden="true" />}
        </button>
      </form>

      {foundUser && (
        <div className="admin-user-found">
          <i className="fas fa-user" aria-hidden="true" />
          <span><strong>{foundUser.name}</strong> &mdash; {foundUser.email} &mdash; DNI {foundUser.dni}</span>
        </div>
      )}

      {loadingRes ? (
        <Skeleton rows={4} />
      ) : reservations && reservations.length === 0 ? (
        <EmptyState message="Este usuario no tiene reservas." />
      ) : reservations ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="admin-table__name">{r.product?.title ?? '\u2014'}</td>
                  <td>{formatDate(r.dateInit)}</td>
                  <td>{formatDate(r.dateEnd)}</td>
                  <td>${r.totalAmount?.toLocaleString('es-AR')}</td>
                  <td>
                    <span
                      className="admin-badge"
                      style={{ background: STATUS_COLORS[r.status] ?? '#6b7280', color: '#fff' }}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <motion.button
                        className="admin-btn admin-btn--detail admin-btn--sm"
                        whileTap={{ scale: 0.96 }}
                        transition={springLatch}
                        onClick={() => handleViewReservation(r)}
                      >
                        <i className="fas fa-eye" aria-hidden="true" /> Detalle
                      </motion.button>
                      {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                        <motion.button
                          className="admin-btn admin-btn--danger admin-btn--sm"
                          whileTap={{ scale: 0.96 }}
                          transition={springLatch}
                          disabled={cancellingId === r.id}
                          onClick={() => handleCancel(r.id)}
                        >
                          {cancellingId === r.id ? (
                            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
                          ) : (
                            <i className="fas fa-ban" aria-hidden="true" />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-placeholder">
          <i className="fas fa-search" aria-hidden="true" />
          <p>Ingresá el DNI de un usuario para ver sus reservas.</p>
        </div>
      )}
    </motion.div>
  )
}

export default AdminPanel
