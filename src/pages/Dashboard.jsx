import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, MotionConfig, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import { fetchProducts, deleteProduct } from '../services/products.service.js'
import {
  fetchMyReservations,
  fetchReservationsAsOwner,
  cancelReservation,
  confirmReservation,
  handoffReservation,
  returnReservation,
} from '../services/reservations.service.js'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import VerificationModal from '../components/VerificationModal/VerificationModal.jsx'
import './Dashboard.css'

// Springs (DESIGN.md §3 — gramática mecánico-líquida)
const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const SECTIONS = [
  { id: 'perfil', label: 'Mi perfil', icon: 'fa-user' },
  { id: 'reservas', label: 'Mis reservas', icon: 'fa-calendar-days' },
  { id: 'agenda', label: 'Agenda', icon: 'fa-calendar-week' },
  { id: 'publicaciones', label: 'Mis publicaciones', icon: 'fa-box' },
  { id: 'conversaciones', label: 'Conversaciones', icon: 'fa-comments' },
]

const VALID_SECTIONS = SECTIONS.map((s) => s.id)

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ACTIVE: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'ACTIVE']

// Entrega y devolución siempre a las 12:00 (mediodía), según regla del negocio.
const PICKUP_TIME = '12:00'

const OWNER_ACTIONS = {
  confirm: {
    title: 'Confirmar reserva',
    message: '¿Confirmás esta reserva? El inquilino podrá coordinar la entrega.',
  },
  handoff: {
    title: 'Confirmar entrega',
    message: '¿Confirmás que entregaste el producto al inquilino?',
  },
  return: {
    title: 'Confirmar devolución',
    message: '¿Confirmás que el inquilino devolvió el producto?',
  },
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const HISTORY_LIMIT = 6

function getInitial(name) {
  const trimmed = (name || '').trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'B'
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

// "12 ago · 12:00" — fecha + hora de entrega/devolución (mediodía).
function formatDateTime(iso) {
  try {
    const d = new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    return `${d} · ${PICKUP_TIME}`
  } catch {
    return '—'
  }
}

function dayOf(iso) {
  try {
    return new Date(iso).getDate()
  } catch {
    return '—'
  }
}

function monthOf(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { month: 'short' })
  } catch {
    return ''
  }
}

function rentalDays(reservation) {
  const start = new Date(reservation.dateInit)
  const end = new Date(reservation.dateEnd)
  const days = Math.round((end - start) / MS_PER_DAY) + 1
  return Number.isFinite(days) && days > 0 ? days : 1
}

// Horas restantes hasta el inicio del alquiler (regla de cancelación 48hs).
function hoursUntil(dateInit) {
  return (new Date(dateInit) - new Date()) / (1000 * 60 * 60)
}

// La otra parte de la conversación según el punto de vista.
function otherParty(reservation, role) {
  if (role === 'owner') return reservation.user?.name || 'Inquilino'
  return 'Propietario'
}

// Acción disponible para el dueño según el estado de la reserva.
function ownerActionFor(status, wasDelivered) {
  switch (status) {
    case 'PENDING':
      return { key: 'confirm', label: 'Confirmar reserva' }
    case 'CONFIRMED':
      return { key: 'handoff', label: 'Confirmar entrega' }
    case 'ACTIVE':
      return { key: 'return', label: 'Confirmar devolución' }
    case 'CANCELLED':
      // Si se canceló y el producto no se entregó, el dueño resuelve la cancelación.
      return wasDelivered ? null : { key: 'resolveCancellation', label: 'Resolver cancelación' }
    default:
      return null
  }
}

function Dashboard() {
  const { user, userId, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Sección activa derivada del URL (?tab=) — sin estado duplicado.
  const rawTab = searchParams.get('tab')
  const activeSection = VALID_SECTIONS.includes(rawTab) ? rawTab : 'perfil'

  const [data, setData] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const [confirm, setConfirm] = useState(null) // { type, id, title, message }

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', bio: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [verificationOpen, setVerificationOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchProducts(), fetchMyReservations(), fetchReservationsAsOwner()])
      .then(([allProducts, renter, owner]) => {
        if (cancelled) return
        setData({
          myProducts: allProducts.filter((p) => p.ownerId === userId),
          renterReservations: renter,
          ownerReservations: owner,
        })
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId, reloadToken])

  const goToSection = (id) => {
    setSearchParams(id === 'perfil' ? {} : { tab: id }, { replace: true })
  }

  const openChat = (reservationId) => {
    navigate(`/chat/${reservationId}`)
  }

  const handleRetry = () => {
    setData(null)
    setError(false)
    setReloadToken((t) => t + 1)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // ── Datos derivados ──
  const myProducts = data?.myProducts ?? []
  const renterReservations = data?.renterReservations ?? []
  const ownerReservations = data?.ownerReservations ?? []
  const allReservations = [...renterReservations, ...ownerReservations]
  const activeReservations = allReservations.filter((r) => ACTIVE_STATUSES.includes(r.status)).length

  const historyReservations = [
    ...renterReservations.map((r) => ({ ...r, role: 'renter' })),
    ...ownerReservations.map((r) => ({ ...r, role: 'owner' })),
  ].sort((a, b) => new Date(b.dateInit) - new Date(a.dateInit))

  const stats = [
    { label: 'Productos publicados', value: myProducts.length, icon: 'fa-box' },
    { label: 'Reservas activas', value: activeReservations, icon: 'fa-calendar-check' },
    { label: 'Como inquilino', value: renterReservations.length, icon: 'fa-user' },
    { label: 'Como dueño', value: ownerReservations.length, icon: 'fa-store' },
  ]

  const name = user?.name || 'Usuario Benteveo'
  const email = user?.email || ''
  const phone = user?.profile?.phone
  const dni = user?.dni
  const bio = user?.profile?.description
  const avatar = user?.profile?.avatar || null
  const isVerified = user?.isIdentityVerified === true
  const initial = getInitial(user?.name)
  const displayAvatar = avatarPreview || avatar

  // ── Acciones ──
  const requestDeleteProduct = (product) => {
    setConfirm({
      type: 'deleteProduct',
      id: product.id,
      title: 'Eliminar producto',
      message: `¿Seguro que querés eliminar «${product.title}»? Esta acción no se puede deshacer.`,
    })
  }

  const requestCancelReservation = (reservation) => {
    const withCharge = hoursUntil(reservation.dateInit) <= 48
    setConfirm({
      type: 'cancelReservation',
      id: reservation.id,
      title: 'Cancelar reserva',
      message: withCharge
        ? 'Faltan menos de 48 horas para el alquiler, por lo que esta cancelación tiene cargo. ¿Querés continuar?'
        : '¿Seguro que querés cancelar esta reserva?',
    })
  }

  const requestOwnerAction = (key, reservation) => {
    const meta = OWNER_ACTIONS[key]
    if (!meta) {
      // Cancelación resuelta: backend pendiente.
      toast.info('Resolver la cancelación estará disponible próximamente (falta backend).')
      return
    }
    setConfirm({ type: key, id: reservation.id, title: meta.title, message: meta.message })
  }

  const runConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.type === 'deleteProduct') {
        await deleteProduct(confirm.id)
        toast.success('Producto eliminado.')
      } else if (confirm.type === 'cancelReservation') {
        await cancelReservation(confirm.id)
        toast.success('Reserva cancelada.')
      } else if (confirm.type === 'confirm') {
        await confirmReservation(confirm.id)
        toast.success('Reserva confirmada.')
      } else if (confirm.type === 'handoff') {
        await handoffReservation(confirm.id)
        toast.success('Entrega confirmada.')
      } else if (confirm.type === 'return') {
        await returnReservation(confirm.id)
        toast.success('Devolución confirmada.')
      }
      setConfirm(null)
      handleRetry()
    } catch (err) {
      toast.error(err.message || 'No se pudo completar la acción.')
    }
  }

  // ── Edición de perfil (visual — backend pendiente) ──
  const startEditing = () => {
    setEditForm({ name, phone: phone || '', bio: bio || '' })
    setEditing(true)
  }

  const handleEditChange = (e) => {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const cancelEditing = () => setEditing(false)

  const saveEditing = () => {
    setEditing(false)
    toast.info('Edición de perfil disponible próximamente (falta backend).')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    toast.info('Foto lista. La subida al servidor estará disponible próximamente.')
  }

  // ── Render por sección ──
  const renderSection = () => {
    if (error) {
      return (
        <EmptyState
          message="No pudimos cargar tus datos. Probá de nuevo en unos segundos."
          actionLabel="Reintentar"
          onAction={handleRetry}
        />
      )
    }

    if (data === null) {
      return <Skeleton rows={6} />
    }

    if (activeSection === 'reservas') {
      return (
        <ReservasList
          renter={renterReservations}
          owner={ownerReservations}
          onCancel={requestCancelReservation}
          onChat={openChat}
          onOwnerAction={requestOwnerAction}
        />
      )
    }

    if (activeSection === 'agenda') {
      return <AgendaList reservations={ownerReservations} onChat={openChat} />
    }

    if (activeSection === 'publicaciones') {
      return (
        <section aria-labelledby="publicaciones-titulo">
          <header className="dashboard-header">
            <motion.h1 id="publicaciones-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              Mis publicaciones
            </motion.h1>
            <p className="dashboard-sub">Los productos que tenés publicados.</p>
          </header>

          {myProducts.length === 0 ? (
            <EmptyState
              message="Todavía no publicaste ningún producto."
              actionLabel="Publicar producto"
              onAction={() => navigate('/explorar')}
            />
          ) : (
            <div className="publicaciones-list">
              {myProducts.map((product, i) => (
                <motion.article
                  key={product.id}
                  className="publicacion-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
                >
                  <div className="publicacion-media">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" />
                    ) : (
                      <div className="publicacion-placeholder">
                        <i className="fas fa-toolbox" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="publicacion-body">
                    <h2 className="publicacion-title">{product.title}</h2>
                    <p className="publicacion-price">
                      ${product.pricePerDay.toLocaleString('es-AR')}
                      <span>/día</span>
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    className="publicacion-delete"
                    whileTap={{ scale: 0.96 }}
                    transition={springLatch}
                    onClick={() => requestDeleteProduct(product)}
                    aria-label={`Eliminar ${product.title}`}
                  >
                    <i className="fas fa-trash" aria-hidden="true" /> Borrar
                  </motion.button>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      )
    }

    if (activeSection === 'conversaciones') {
      const threads = [
        ...renterReservations.map((r) => ({ ...r, role: 'renter' })),
        ...ownerReservations.map((r) => ({ ...r, role: 'owner' })),
      ]

      return (
        <section aria-labelledby="conversaciones-titulo">
          <header className="dashboard-header">
            <motion.h1 id="conversaciones-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              Conversaciones
            </motion.h1>
            <p className="dashboard-sub">Habla con la otra parte de cada alquiler.</p>
          </header>

          {threads.length === 0 ? (
            <EmptyState message="Todavía no tenés conversaciones." />
          ) : (
            <div className="conversaciones-list">
              {threads.map((thread, i) => (
                <motion.button
                  key={`${thread.role}-${thread.id}`}
                  type="button"
                  className="conversacion-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
                  onClick={() => openChat(thread.id)}
                >
                  <span className="conversacion-avatar" aria-hidden="true">
                    {getInitial(otherParty(thread, thread.role))}
                  </span>
                  <span className="conversacion-body">
                    <span className="conversacion-name">{otherParty(thread, thread.role)}</span>
                    <span className="conversacion-sub">{thread.product?.title || 'Producto'}</span>
                  </span>
                  <i className="fas fa-chevron-right conversacion-arrow" aria-hidden="true" />
                </motion.button>
              ))}
            </div>
          )}
        </section>
      )
    }

    // ── Perfil (default): info + estadísticas + historial ──
    return (
      <section aria-labelledby="perfil-titulo">
        <header className="dashboard-header">
          <motion.h1 id="perfil-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
            Mi perfil
          </motion.h1>
          <p className="dashboard-sub">Tu información personal en Benteveo.</p>
        </header>

        <motion.div className="perfil-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
          <div className="perfil-top">
            <div className="perfil-avatar">
              {displayAvatar ? (
                <img src={displayAvatar} alt={`Foto de ${name}`} />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </div>
            <div className="perfil-top-actions">
              <label htmlFor="avatar-input" className="perfil-photo-btn">
                <i className="fas fa-camera" aria-hidden="true" /> Cambiar foto
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="perfil-file-input"
                onChange={handleAvatarChange}
                hidden
              />
              <button type="button" className="perfil-edit-btn" onClick={startEditing}>
                <i className="fas fa-pen" aria-hidden="true" /> Editar información
              </button>
            </div>
          </div>

          {isVerified ? (
            <span className="perfil-verified">
              <i className="fas fa-circle-check" aria-hidden="true" /> Identidad verificada
            </span>
          ) : (
            <div className="perfil-verify">
              <span className="perfil-unverified">
                <i className="fas fa-circle-exclamation" aria-hidden="true" /> Identidad sin verificar
              </span>
              <button type="button" className="perfil-verify-btn" onClick={() => setVerificationOpen(true)}>
                <i className="fas fa-shield-halved" aria-hidden="true" /> Verificar identidad
              </button>
            </div>
          )}

          {editing ? (
            <div className="perfil-form">
              <div className="perfil-field">
                <label className="perfil-label" htmlFor="edit-name">Nombre completo</label>
                <input id="edit-name" name="name" className="perfil-input" value={editForm.name} onChange={handleEditChange} />
              </div>
              <div className="perfil-field">
                <label className="perfil-label" htmlFor="edit-phone">Teléfono</label>
                <input id="edit-phone" name="phone" className="perfil-input" value={editForm.phone} onChange={handleEditChange} />
              </div>
              <div className="perfil-field perfil-field--full">
                <label className="perfil-label" htmlFor="edit-bio">Sobre mí</label>
                <textarea id="edit-bio" name="bio" className="perfil-input" rows={3} value={editForm.bio} onChange={handleEditChange} />
              </div>
              <div className="perfil-form-actions">
                <button type="button" className="perfil-btn perfil-btn--ghost" onClick={cancelEditing}>
                  Cancelar
                </button>
                <motion.button type="button" className="perfil-btn perfil-btn--primary" whileTap={{ scale: 0.96 }} transition={springLatch} onClick={saveEditing}>
                  Guardar cambios
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="perfil-fields">
              <div className="perfil-field">
                <span className="perfil-label">Nombre completo</span>
                <p className="perfil-value">{name}</p>
              </div>
              <div className="perfil-field">
                <span className="perfil-label">Correo electrónico</span>
                <p className="perfil-value">{email || '—'}</p>
              </div>
              <div className="perfil-field">
                <span className="perfil-label">Teléfono</span>
                <p className="perfil-value">{phone || '—'}</p>
              </div>
              <div className="perfil-field">
                <span className="perfil-label">DNI</span>
                <p className="perfil-value">{dni || '—'}</p>
              </div>
              <div className="perfil-field perfil-field--full">
                <span className="perfil-label">Sobre mí</span>
                <p className="perfil-value">{bio || 'Todavía no escribiste tu presentación.'}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Estadísticas del perfil */}
        <div className="stats-grid perfil-stats" aria-label="Estadísticas del perfil">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springReveal, delay: i * 0.05 }}
            >
              <span className="stat-icon">
                <i className={`fas ${stat.icon}`} aria-hidden="true" />
              </span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Historial de reservas / usos */}
        <div className="perfil-historial">
          <h2 className="perfil-historial-title">Historial de reservas</h2>
          {historyReservations.length === 0 ? (
            <p className="perfil-historial-empty">Todavía no tenés reservas.</p>
          ) : (
            <>
              <ul className="historial-list">
                {historyReservations.slice(0, HISTORY_LIMIT).map((reservation) => {
                  const product = reservation.product
                  const status = reservation.status
                  return (
                    <li key={`${reservation.role}-${reservation.id}`} className="historial-item">
                      <span className="historial-title">{product?.title || 'Producto'}</span>
                      <span className="historial-meta">
                        {formatDate(reservation.dateInit)} → {formatDate(reservation.dateEnd)} ·{' '}
                        {otherParty(reservation, reservation.role)}
                      </span>
                      <span className={`reserva-badge reserva-badge--${status.toLowerCase()}`}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <button type="button" className="perfil-link" onClick={() => goToSection('reservas')}>
                Ver todas mis reservas
              </button>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="dashboard">
        <main className="dashboard-main">{renderSection()}</main>

        <motion.aside
          className="dashboard-nav"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springReveal}
        >
          <div className="dashboard-nav-user">
            {displayAvatar ? (
              <img className="dashboard-nav-avatar" src={displayAvatar} alt="" />
            ) : (
              <span className="dashboard-nav-avatar dashboard-nav-avatar--initial" aria-hidden="true">
                {initial}
              </span>
            )}
            <div className="dashboard-nav-meta">
              <p className="dashboard-nav-name">{name}</p>
              <p className="dashboard-nav-email">{email}</p>
            </div>
          </div>

          <nav className="dashboard-nav-list" aria-label="Menú de tu cuenta">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection === section.id
                    ? 'dashboard-nav-item dashboard-nav-item--active'
                    : 'dashboard-nav-item'
                }
                aria-current={activeSection === section.id ? 'page' : undefined}
                onClick={() => goToSection(section.id)}
              >
                <i className={`fas ${section.icon}`} aria-hidden="true" />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>

          <motion.button
            type="button"
            className="dashboard-nav-logout"
            onClick={handleLogout}
            whileTap={{ scale: 0.96 }}
            transition={springLatch}
          >
            <i className="fas fa-sign-out-alt" aria-hidden="true" />
            <span>Cerrar sesión</span>
          </motion.button>
        </motion.aside>
      </div>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {confirm ? (
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={confirm.title}>
            <motion.div
              className="dashboard-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirm(null)}
            />
            <motion.div
              className="dashboard-modal-panel"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={springReveal}
            >
              <h2 className="dashboard-modal-title">{confirm.title}</h2>
              <p className="dashboard-modal-message">{confirm.message}</p>
              <div className="dashboard-modal-actions">
                <button type="button" className="perfil-btn perfil-btn--ghost" onClick={() => setConfirm(null)}>
                  Cancelar
                </button>
                <motion.button type="button" className="perfil-btn perfil-btn--danger" whileTap={{ scale: 0.96 }} transition={springLatch} onClick={runConfirm}>
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <VerificationModal open={verificationOpen} onClose={() => setVerificationOpen(false)} />
    </MotionConfig>
  )
}

// Agenda: personas que reservaron tus productos, en cronograma ordenado por fecha,
// con hora de entrega y devolución (12:00 mediodía).
function AgendaList({ reservations, onChat }) {
  const sorted = [...reservations].sort((a, b) => new Date(a.dateInit) - new Date(b.dateInit))

  return (
    <section aria-labelledby="agenda-titulo">
      <header className="dashboard-header">
        <motion.h1 id="agenda-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
          Agenda
        </motion.h1>
        <p className="dashboard-sub">
          Las reservas de tus productos, ordenadas por fecha. Entrega y devolución a las {PICKUP_TIME}.
        </p>
      </header>

      {sorted.length === 0 ? (
        <EmptyState message="Todavía nadie reservó tus productos." />
      ) : (
        <ol className="agenda-list">
          {sorted.map((reservation, i) => {
            const renterName = otherParty(reservation, 'owner')
            const product = reservation.product
            return (
              <motion.li
                key={reservation.id}
                className="agenda-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
              >
                <div className="agenda-date">
                  <span className="agenda-day">{dayOf(reservation.dateInit)}</span>
                  <span className="agenda-month">{monthOf(reservation.dateInit)}</span>
                </div>
                <div className="agenda-body">
                  <p className="agenda-name">{renterName}</p>
                  <p className="agenda-meta">
                    <strong>{product?.title || 'Producto'}</strong>
                  </p>
                  <p className="agenda-times">
                    <span>
                      <i className="fas fa-box-open" aria-hidden="true" /> Entrega: {formatDateTime(reservation.dateInit)}
                    </span>
                    <span>
                      <i className="fas fa-box-archive" aria-hidden="true" /> Devolución: {formatDateTime(reservation.dateEnd)}
                    </span>
                  </p>
                </div>
                <motion.button
                  type="button"
                  className="agenda-chat"
                  whileTap={{ scale: 0.96 }}
                  transition={springLatch}
                  onClick={() => onChat(reservation.id)}
                  aria-label={`Hablar con ${renterName}`}
                >
                  <i className="fas fa-comment" aria-hidden="true" /> Hablar
                </motion.button>
              </motion.li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// Sub-sección de reservas: tabs inquilino/dueño + acciones según estado + chatear.
function ReservasList({ renter, owner, onCancel, onChat, onOwnerAction }) {
  const [tab, setTab] = useState('renter')
  const list = tab === 'renter' ? renter : owner

  const handleTabChange = (id) => {
    if (id === tab) return
    setTab(id)
  }

  return (
    <section aria-labelledby="reservas-titulo">
      <header className="dashboard-header">
        <motion.h1 id="reservas-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
          Mis reservas
        </motion.h1>
        <p className="dashboard-sub">Coordiná entregas y devoluciones (a las {PICKUP_TIME}) y hablá con la otra parte.</p>
      </header>

      <div className="reservas-tabs" role="tablist" aria-label="Tipo de reserva">
        <button type="button" role="tab" aria-selected={tab === 'renter'} className={tab === 'renter' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'} onClick={() => handleTabChange('renter')}>
          Como inquilino
        </button>
        <button type="button" role="tab" aria-selected={tab === 'owner'} className={tab === 'owner' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'} onClick={() => handleTabChange('owner')}>
          Como dueño
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          message={
            tab === 'renter'
              ? 'Todavía no alquilaste nada.'
              : 'Todavía no tenés reservas en tus productos.'
          }
        />
      ) : (
        <div className="reservas-list">
          {list.map((reservation, i) => {
            const product = reservation.product
            const status = reservation.status
            const other = otherParty(reservation, tab)
            const days = rentalDays(reservation)
            const isOwnerTab = tab === 'owner'
            const wasDelivered = !!reservation.actualHandoffAt
            const canCancel = ACTIVE_STATUSES.includes(status) && hoursUntil(reservation.dateInit) > 48
            const needsCharge = ACTIVE_STATUSES.includes(status) && hoursUntil(reservation.dateInit) <= 48
            const ownerAction = isOwnerTab ? ownerActionFor(status, wasDelivered) : null

            return (
              <motion.article
                key={reservation.id}
                className="reserva-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
              >
                <div className="reserva-media">
                  {product?.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" />
                  ) : (
                    <div className="reserva-placeholder">
                      <i className="fas fa-toolbox" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="reserva-body">
                  <div className="reserva-top">
                    <h2 className="reserva-title">{product?.title || 'Producto'}</h2>
                    <span className={`reserva-badge reserva-badge--${status.toLowerCase()}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                  <p className="reserva-meta">
                    {formatDate(reservation.dateInit)} → {formatDate(reservation.dateEnd)} · {days}{' '}
                    {days === 1 ? 'día' : 'días'} · con {other}
                  </p>
                  <p className="reserva-times">
                    <span>Entrega: {formatDateTime(reservation.dateInit)}</span>
                    <span>Devolución: {formatDateTime(reservation.dateEnd)}</span>
                  </p>
                  <div className="reserva-footer">
                    <span className="reserva-price">
                      ${(product?.pricePerDay ?? 0).toLocaleString('es-AR')}
                      <span>/día</span>
                    </span>
                    <div className="reserva-actions">
                      {needsCharge ? (
                        <span className="reserva-charge-note">
                          <i className="fas fa-triangle-exclamation" aria-hidden="true" /> Cancelación con cargo
                        </span>
                      ) : null}
                      {canCancel ? (
                        <button type="button" className="reserva-btn reserva-btn--ghost" onClick={() => onCancel(reservation)}>
                          <i className="fas fa-xmark" aria-hidden="true" /> Cancelar
                        </button>
                      ) : null}
                      {ownerAction ? (
                        <button
                          type="button"
                          className="reserva-btn reserva-btn--owner"
                          onClick={() => onOwnerAction(ownerAction.key, reservation)}
                        >
                          <i className="fas fa-check" aria-hidden="true" /> {ownerAction.label}
                        </button>
                      ) : null}
                      <motion.button type="button" className="reserva-btn reserva-btn--primary" whileTap={{ scale: 0.96 }} transition={springLatch} onClick={() => onChat(reservation.id)}>
                        <i className="fas fa-comment" aria-hidden="true" /> Chatear
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Dashboard
