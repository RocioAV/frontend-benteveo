import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, MotionConfig, AnimatePresence } from 'motion/react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth'
import { fetchProducts, fetchPublicProfile, deleteProduct, toggleAvailability } from '../services/products.service.js'
import { fetchFavorites } from '../services/favorites.service.js'
import { useFavorites } from '../context/useFavorites'
import ProductCard from '../components/ProductCard/ProductCard.jsx'
import {
  fetchMyReservations,
  fetchReservationsAsOwner,
  cancelReservation,
  handoffReservation,
  confirmHandoffReceipt,
  returnReservation,
  confirmReturnReceipt,
} from '../services/reservations.service.js'
import { submitUserRating, fetchMyUserRating } from '../services/user-ratings.service.js'
import { getReservationStep, getRatingView, mergeReservationUpdate, selectAgendaReservations } from '../utils/reservation-actions.js'
import { simulateDepositRefund } from '../utils/refund-simulation.js'
import { uploadAvatar, updateProfile } from '../services/profile.service.js'
import EmptyState from '../components/EmptyState/EmptyState.jsx'
import Skeleton from '../components/Skeleton/Skeleton.jsx'
import VerificationModal from '../components/VerificationModal/VerificationModal.jsx'
import RatingModal from '../components/modals/RatingModal.jsx'
import ReservationDetailModal from '../components/modals/ReservationDetailModal.jsx'
import { fetchReservationDetail } from '../components/modals/reservationDetail.map.js'
import './Dashboard.css'

const springReveal = { type: 'spring', stiffness: 260, damping: 26 }
const springLatch = { type: 'spring', stiffness: 400, damping: 28 }

const SECTIONS = [
  { id: 'perfil', label: 'Mi perfil', icon: 'fa-user' },
  { id: 'reservas', label: 'Mis reservas', icon: 'fa-calendar-days' },
  { id: 'agenda', label: 'Agenda', icon: 'fa-calendar-week' },
  { id: 'publicaciones', label: 'Mis publicaciones', icon: 'fa-box' },
  { id: 'favoritos', label: 'Favoritos', icon: 'fa-heart' },
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

const PICKUP_TIME = '12:00'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

// Diálogos de confirmación por paso bilateral (las transiciones las autoriza el
// backend; PENDING no tiene acción manual: el pago aprobado deja CONFIRMED).
const RESERVATION_ACTION_META = {
  handoff: {
    title: 'Marcar como entregado',
    message: '¿Confirmás que entregaste el producto al inquilino? La reserva sigue confirmada hasta que el inquilino confirme la recepción.',
  },
  confirmHandoff: {
    title: 'Confirmar recepción',
    message: '¿Confirmás que recibiste el producto? La reserva pasará a estar en curso.',
  },
  return: {
    title: 'Marcar como devuelto',
    message: '¿Confirmás que devolviste el producto al dueño? La reserva sigue en curso hasta que el dueño confirme la recepción.',
  },
  confirmReturn: {
    title: 'Confirmar recepción final',
    message: '¿Confirmás que recibiste el producto devuelto? La reserva quedará completada.',
  },
}

// Ejecuta el paso bilateral según su clave.
function runReservationAction(key, id) {
  switch (key) {
    case 'handoff':
      return handoffReservation(id)
    case 'confirmHandoff':
      return confirmHandoffReceipt(id)
    case 'return':
      return returnReservation(id)
    case 'confirmReturn':
      return confirmReturnReceipt(id)
    default:
      return Promise.reject(new Error('Acción de reserva desconocida.'))
  }
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const HISTORY_LIMIT = 6
const RESERVAS_PAGE_SIZE = 10

// Meses del filtro de Mis reservas (locale fijo, igual que formatDate).
const FILTER_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

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
  const days = Math.ceil((end - start) / MS_PER_DAY)
  return Number.isFinite(days) && days > 0 ? days : 1
}

// La otra parte de la conversación según el punto de vista. Como inquilino el
// backend no trae el nombre del dueño, así que se usa el cache `ownerNames`.
function otherParty(reservation, role, ownerNames = {}) {
  if (role === 'owner') return reservation.user?.name || 'Inquilino'
  return ownerNames[reservation.product?.ownerId] || 'Propietario'
}

// Mensaje más útil del backend: primero el detalle por campo (fields),
// luego el message del ApiError y por último un fallback genérico.
function getProfileErrorMessage(err) {
  const fields = err?.fields
  if (fields && typeof fields === 'object') {
    const first = Object.values(fields).find(
      (value) => typeof value === 'string' && value.trim() !== ''
    )
    if (first) return first
  }
  if (typeof err?.message === 'string' && err.message.trim() !== '') {
    return err.message
  }
  return 'No pudimos guardar los cambios.'
}

function Dashboard() {
  const { user, userId, logout, refreshUser } = useAuth()
  const { favoriteIds, isFavorite } = useFavorites()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const rawTab = searchParams.get('tab')
  const activeSection = VALID_SECTIONS.includes(rawTab) ? rawTab : 'perfil'

  const [data, setData] = useState(null) // null = cargando
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const [confirm, setConfirm] = useState(null) // { type, id, title, message }
  const [confirmBusy, setConfirmBusy] = useState(false) // PATCH del diálogo en curso
  const [userRatingFor, setUserRatingFor] = useState(null) // { id, objectName } — calificación entre usuarios
  const [userRatingError, setUserRatingError] = useState('')
  // Hidratación del `mine` de cada COMPLETED única al cargar los
  // datos (ambos roles). `getRatingView` trata lo desconocido como checking,
  // así que el efecto solo dispara pedidos y aplica resultados.
  const [ratingState, setRatingState] = useState({})
  // Espejo del estado para el efecto de hidratación (deps [data]): evita
  // rehidratar ante cada cambio de estado y solo reintenta `error` al recargar.
  const ratingStateRef = useRef({})
  useEffect(() => {
    ratingStateRef.current = ratingState
  })
  // IDs con GET mine ya pedido (en curso o resuelto): deduplica copias
  // dueño/inquilino y evita rehidratar en cada rerender.
  const ratingHydratedRef = useRef(new Set())

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', bio: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [verificationOpen, setVerificationOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchProducts(), fetchMyReservations(), fetchReservationsAsOwner(), fetchFavorites()])
      .then(([allProducts, renter, owner, favorites]) => {
        if (cancelled) return
        setData({
          myProducts: allProducts.filter((p) => p.ownerId === userId),
          renterReservations: renter,
          ownerReservations: owner,
          favorites,
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

  // Hidratación proactiva del `mine` de cada COMPLETED única al cargar los
  // datos (ambos roles). Deduplica IDs, corre solo ante datos nuevos (sin
  // bucles por cambios de estado) y es segura ante desmontaje. Un `rated`
  // local nunca se degrada por una respuesta tardía. Los `error` se
  // reintentan en la próxima carga.
  // El cuerpo solo dispara pedidos; los resultados se aplican en callbacks.
  useEffect(() => {
    if (!data) return undefined
    let cancelled = false
    const hydrated = ratingHydratedRef.current
    const states = ratingStateRef.current
    const seen = new Set()
    const ids = []
    for (const r of [...data.renterReservations, ...data.ownerReservations]) {
      if (r?.status !== 'COMPLETED' || !r.id || seen.has(r.id)) continue
      seen.add(r.id)
      if (hydrated.has(r.id) && states[r.id]?.status !== 'error') continue
      ids.push(r.id)
    }
    if (ids.length === 0) return undefined
    for (const id of ids) hydrated.add(id)
    for (const id of ids) {
      fetchMyUserRating(id)
        .then((mine) => {
          if (cancelled) return
          setRatingState((prev) => {
            if (prev[id]?.status === 'rated') return prev
            return {
              ...prev,
              [id]: mine?.rated
                ? { status: 'rated', score: mine.rating?.score ?? null }
                : { status: 'unrated', score: null },
            }
          })
        })
        .catch(() => {
          if (cancelled) return
          setRatingState((prev) => {
            if (prev[id]?.status === 'rated') return prev
            return { ...prev, [id]: { status: 'error', score: null } }
          })
        })
    }
    return () => {
      cancelled = true
    }
  }, [data])

  // Nombres reales de los dueños en las reservas donde sos inquilino: la
  // respuesta de /reservations no los incluye, así que se piden una sola vez
  // por ownerId (GET /user/:id) y se cachean para la sesión. Sin nombre,
  // Agenda muestra el fallback "Propietario".
  const [ownerNames, setOwnerNames] = useState({})
  const ownerNamesRequestedRef = useRef(new Set())
  useEffect(() => {
    if (!data) return undefined
    let cancelled = false
    const missing = []
    for (const r of data.renterReservations) {
      const ownerId = r?.product?.ownerId
      if (ownerId && !ownerNamesRequestedRef.current.has(ownerId)) missing.push(ownerId)
    }
    if (missing.length === 0) return undefined
    for (const id of missing) ownerNamesRequestedRef.current.add(id)
    for (const id of missing) {
      fetchPublicProfile(id)
        .then((profile) => {
          if (cancelled || !profile?.name) return
          setOwnerNames((prev) => (prev[id] === profile.name ? prev : { ...prev, [id]: profile.name }))
        })
        .catch(() => {
          // Se libera el ID para reintentar en la próxima carga de datos.
          ownerNamesRequestedRef.current.delete(id)
        })
    }
    return () => {
      cancelled = true
    }
  }, [data])

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

  const myProducts = data?.myProducts ?? []
  const renterReservations = data?.renterReservations ?? []
  const ownerReservations = data?.ownerReservations ?? []
  const favorites = data?.favorites ?? []
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

  const requestDeleteProduct = (product) => {
    setConfirm({
      type: 'deleteProduct',
      id: product.id,
      title: 'Eliminar producto',
      message: `¿Seguro que querés eliminar «${product.title}»? Esta acción no se puede deshacer.`,
    })
  }

  const handleToggleAvailability = async (product) => {
    try {
      await toggleAvailability(product.id, !product.isAvailable)
      setData((prev) => ({
        ...prev,
        myProducts: prev.myProducts.map((p) =>
          p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
        ),
      }))
      toast.success(product.isAvailable ? 'Publicación desactivada' : 'Publicación activada')
    } catch {
      toast.error('Error al cambiar disponibilidad')
    }
  }

  const requestReservationAction = (key, reservation) => {
    const meta = RESERVATION_ACTION_META[key]
    if (!meta) return
    setConfirm({ type: key, id: reservation.id, title: meta.title, message: meta.message })
  }

  const runConfirm = async () => {
    if (!confirm || confirmBusy) return
    setConfirmBusy(true)
    try {
      if (confirm.type === 'deleteProduct') {
        await deleteProduct(confirm.id)
        toast.success('Producto eliminado.')
      } else if (confirm.type === 'confirmReturn') {
        await runReservationAction(confirm.type, confirm.id)
        // El dueño confirmó la devolución: se simula el reembolso del depósito.
        simulateDepositRefund('return')
      } else {
        await runReservationAction(confirm.type, confirm.id)
        toast.success('Acción completada.')
      }
      setConfirm(null)
      handleRetry()
    } catch (err) {
      toast.error(err.message || 'No se pudo completar la acción.')
    } finally {
      setConfirmBusy(false)
    }
  }

  // ── Calificación entre usuarios (solo reservas COMPLETED) ──
  const markRated = (reservationId, score) => {
    setRatingState((prev) => ({ ...prev, [reservationId]: { status: 'rated', score: score ?? null } }))
  }

  const openUserRating = (reservation, otherName) => {
    const id = reservation.id
    const entry = ratingState[id]
    // Ya verificado como calificado o verificación en curso: no hay acción.
    // Desconocido tampoco abre (la vista ya muestra checking).
    if (!entry || entry.status === 'rated' || entry.status === 'checking') return
    if (entry.status === 'unrated') {
      // Hidratación ya confirmó rated:false: se abre directo, sin otro GET.
      setUserRatingError('')
      setUserRatingFor({ id, objectName: otherName || '' })
      return
    }
    // Estado `error`: se reintenta la verificación antes de abrir. Si vuelve a
    // fallar, el POST sigue protegido por el backend con error visible.
    ratingHydratedRef.current.add(id)
    setRatingState((prev) => ({ ...prev, [id]: { status: 'checking', score: null } }))
    setUserRatingError('')
    fetchMyUserRating(id)
      .then((mine) => {
        if (mine?.rated) {
          markRated(id, mine.rating?.score ?? null)
        } else {
          setUserRatingFor({ id, objectName: otherName || '' })
          setRatingState((prev) => ({ ...prev, [id]: { status: 'unrated', score: null } }))
        }
      })
      .catch(() => {
        setRatingState((prev) => ({ ...prev, [id]: { status: 'error', score: null } }))
        toast.error('No pudimos verificar tu calificación. Probá de nuevo.')
      })
  }

  const closeUserRating = () => {
    setUserRatingFor(null)
    setUserRatingError('')
  }

  // Envía `{ score }` (el backend deriva a la contraparte desde la reserva).
  // Solo cierra ante éxito y actualiza el estado local para que el botón no reaparezca.
  const submitUserRatingForm = async ({ rating }) => {
    if (!userRatingFor) return
    try {
      await submitUserRating(userRatingFor.id, rating)
      markRated(userRatingFor.id, rating)
      setUserRatingFor(null)
      setUserRatingError('')
      toast.success('Calificación enviada.')
    } catch (err) {
      setUserRatingError(err?.message || 'No pudimos enviar tu calificación.')
    }
  }

  // Actualiza la reserva en las listas tras una acción del modal de detalle,
  // sin recargar todo (el modal debe seguir abierto para mostrar el feedback).
  // Solo pisa los campos presentes en la respuesta: un PATCH parcial nunca
  // borra valores existentes con `undefined`.
  const patchReservation = (updated) => {
    setData((prev) => {
      if (!prev) return prev
      const patch = (list) =>
        list.map((r) => (r.id === updated.id ? mergeReservationUpdate(r, updated) : r))
      return {
        ...prev,
        renterReservations: patch(prev.renterReservations),
        ownerReservations: patch(prev.ownerReservations),
      }
    })
  }

  // Acción bilateral disparada desde el modal de detalle (la confirmación vive
  // en el modal). Los errores se propagan y el modal los muestra con toast.
  const runDetailAction = async (key, detail) => {
    if (key === 'cancel') {
      const updated = await cancelReservation(detail.id)
      patchReservation(updated)
      // Si la reserva está en PENDING (p. ej., pago fallido: reserva creada sin aprobar),
      // mostramos toast de cancelación pero no simulamos reembolso.
      // El modal ya muestra "Reserva cancelada." vía feedback state.
      if (detail.statusCode === 'PENDING') {
        toast.info('Reserva cancelada.', { toastId: 'cancel-pending' })
      } else {
        // Para CONFIRMED o COMPLETED: simulamos el reembolso.
        simulateDepositRefund('cancel')
      }
      return
    }
    const updated = await runReservationAction(key, detail.id)
    patchReservation(updated)
    // Recepción final confirmada: se libera (simulado) el depósito al inquilino.
    if (key === 'confirmReturn') simulateDepositRefund('return')
  }

  // ── Edición de perfil (PATCH /user/data-user) ──
  const startEditing = () => {
    setEditForm({ name, phone: phone || '', bio: bio || '' })
    setEditing(true)
  }

  const handleEditChange = (e) => {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const cancelEditing = () => {
    if (savingProfile) return
    setEditing(false)
  }

  // PATCH /user/data-user con solo los campos cambiados. `bio` (alias visual)
  // se mapea a `description`; nunca se envían bio, email, DNI, IDs ni otros
  // campos. Un nombre/teléfono vaciado se envía tal cual para que el backend
  // lo rechace como error de validación; una bio vacía se envía como
  // `description: ''` para permitir limpiar la presentación.
  const saveEditing = async () => {
    if (savingProfile) return
    const payload = {}
    if (editForm.name !== name) payload.name = editForm.name
    if (editForm.phone !== (phone || '')) payload.phone = editForm.phone
    if (editForm.bio !== (bio || '')) payload.description = editForm.bio
    if (Object.keys(payload).length === 0) {
      setEditing(false)
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile(payload)
      await refreshUser()
      setEditing(false)
      toast.success('Perfil actualizado.')
    } catch (err) {
      toast.error(getProfileErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('La imagen no puede superar 5 MB')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    try {
      await uploadAvatar(file)
      await refreshUser()
      setAvatarPreview(null)
      toast.success('Foto de perfil actualizada.')
    } catch (err) {
      setAvatarPreview(null)
      toast.error(err.message || 'No pudimos subir tu foto.')
    } finally {
      URL.revokeObjectURL(previewUrl)
    }
  }

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
          userName={name}
          onChat={openChat}
          ratingState={ratingState}
          onDetailAction={runDetailAction}
        />
      )
    }

    if (activeSection === 'agenda') {
      return (
        <AgendaList
          renterReservations={renterReservations}
          ownerReservations={ownerReservations}
          ownerNames={ownerNames}
          userName={name}
          onChat={openChat}
          onReservationAction={requestReservationAction}
          onDetailAction={runDetailAction}
          onRate={openUserRating}
          ratingState={ratingState}
        />
      )
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
                  className={`publicacion-card ${product.isAvailable === false ? 'publicacion-card--inactive' : ''}`}
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
                    {product.isAvailable === false && (
                      <span className="publicacion-badge-inactive">Inactiva</span>
                    )}
                  </div>
                  <div className="publicacion-body">
                    <h2 className="publicacion-title">
                      <button
                        type="button"
                        className="publicacion-title-link"
                        onClick={() => navigate(`/detalle/${product.id}`)}
                      >
                        {product.title}
                      </button>
                    </h2>
                    <p className="publicacion-price">
                      ${product.pricePerDay.toLocaleString('es-AR')}
                      <span>/día</span>
                    </p>
                  </div>
                  <div className="publicacion-actions">
                    <motion.button
                      type="button"
                      className={`publicacion-toggle ${product.isAvailable === false ? 'publicacion-toggle--activate' : ''}`}
                      whileTap={{ scale: 0.96 }}
                      transition={springLatch}
                      onClick={() => handleToggleAvailability(product)}
                      aria-label={product.isAvailable === false ? `Activar ${product.title}` : `Desactivar ${product.title}`}
                    >
                      {product.isAvailable === false ? (
                        <><i className="fas fa-eye" aria-hidden="true" /> Activar</>
                      ) : (
                        <><i className="fas fa-eye-slash" aria-hidden="true" /> Desactivar</>
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      className="publicacion-edit"
                      whileTap={{ scale: 0.96 }}
                      transition={springLatch}
                      onClick={() => navigate(`/publicaciones/${product.id}/editar`)}
                      aria-label={`Editar ${product.title}`}
                    >
                      <i className="fas fa-pen" aria-hidden="true" /> Editar
                    </motion.button>
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
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      )
    }

    if (activeSection === 'favoritos') {
      const loadingFavorites = favoriteIds === null
      const savedProducts = loadingFavorites
        ? []
        : favorites.filter((product) => isFavorite(product.id))

      return (
        <section aria-labelledby="favoritos-titulo">
          <header className="dashboard-header">
            <motion.h1 id="favoritos-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
              Mis favoritos
            </motion.h1>
            <p className="dashboard-sub">Los productos que guardaste para después.</p>
          </header>

          {loadingFavorites ? (
            <Skeleton rows={4} />
          ) : savedProducts.length === 0 ? (
            <EmptyState
              message="Todavía no guardaste ningún producto."
              actionLabel="Explorar productos"
              onAction={() => navigate('/explorar')}
            />
          ) : (
            <div className="favoritos-grid">
              {savedProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
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
              {threads.map((thread, i) => {
                const name = otherParty(thread, thread.role, ownerNames)
                const status = thread.status
                return (
                  <motion.button
                    key={`${thread.role}-${thread.id}`}
                    type="button"
                    className="conversacion-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springReveal, delay: Math.min(i * 0.04, 0.2) }}
                    onClick={() => openChat(thread.id)}
                    aria-label={`Conversación con ${name} por ${thread.product?.title || 'Producto'}`}
                  >
                    <span className="conversacion-avatar" aria-hidden="true">
                      {getInitial(name)}
                    </span>
                    <span className="conversacion-body">
                      <span className="conversacion-name">{name}</span>
                      <span className="conversacion-sub">{thread.product?.title || 'Producto'}</span>
                      <span className="conversacion-meta">
                        <span className="conversacion-dates">
                          <i className="fas fa-calendar-alt" aria-hidden="true" />{' '}
                          {formatDate(thread.dateInit)} → {formatDate(thread.dateEnd)}
                        </span>
                        <span className={`reserva-badge reserva-badge--${status.toLowerCase()}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </span>
                    </span>
                    <i className="fas fa-chevron-right conversacion-arrow" aria-hidden="true" />
                  </motion.button>
                )
              })}
            </div>
          )}
        </section>
      )
    }

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
                <button type="button" className="perfil-btn perfil-btn--ghost" onClick={cancelEditing} disabled={savingProfile}>
                  Cancelar
                </button>
                <motion.button type="button" className="perfil-btn perfil-btn--primary" whileTap={{ scale: 0.96 }} transition={springLatch} onClick={saveEditing} disabled={savingProfile}>
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
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
        <motion.aside
          className="dashboard-nav"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springReveal}
        >
          <div className="dashboard-nav-user">
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

        <main className="dashboard-main">{renderSection()}</main>
      </div>

      <AnimatePresence>
        {confirm ? (
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label={confirm.title}>
            <motion.div
              className="dashboard-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!confirmBusy) setConfirm(null)
              }}
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
                <button type="button" className="perfil-btn perfil-btn--ghost" onClick={() => setConfirm(null)} disabled={confirmBusy}>
                  Cancelar
                </button>
                <motion.button type="button" className="perfil-btn perfil-btn--danger" whileTap={{ scale: 0.96 }} transition={springLatch} onClick={runConfirm} disabled={confirmBusy}>
                  {confirmBusy ? 'Procesando…' : 'Confirmar'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <VerificationModal open={verificationOpen} onClose={() => setVerificationOpen(false)} />
      <RatingModal
        isOpen={Boolean(userRatingFor)}
        onClose={closeUserRating}
        onSubmit={submitUserRatingForm}
        objectName={userRatingFor?.objectName || ''}
        commentEnabled={false}
        title="Calificá a la otra persona"
        description="Tu calificación es solo con estrellas y ayuda a construir confianza en la comunidad."
        submitLabel="Enviar calificación"
        submitError={userRatingError}
      />
    </MotionConfig>
  )
}

// Agenda operativa: solo lo que requiere acción, espera o calificación.
// Tabs por rol (mismo patrón que Mis reservas), selección y orden mediante
// `selectAgendaReservations`. Las acciones/esperas salen de
// `getReservationStep` y la calificación de `getRatingView`, sin duplicar la
// máquina de estados.
export function AgendaList({
  renterReservations = [],
  ownerReservations = [],
  ownerNames = {},
  userName,
  onChat,
  onReservationAction,
  onDetailAction,
  onRate,
  ratingState = {},
}) {
  const [tab, setTab] = useState('renter')
  const role = tab === 'owner' ? 'owner' : 'renter'
  const source = role === 'owner' ? ownerReservations : renterReservations
  // `selectAgendaReservations` ya ordena por fecha operativa; una COMPLETED
  // que pase a `rated` sale de la lista sin otro cambio.
  const items = selectAgendaReservations(source, role, ratingState)

  // Detalle de la reserva: mismo flujo que Mis reservas, pero sin `readOnly`
  // (Agenda es el lugar de coordinación: el modal ofrece las acciones
  // bilaterales y el cancelar mientras la reserva no esté en curso).
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const detailClientRef = useRef('')

  const clientNameFor = (reservation) =>
    role === 'renter' ? userName : otherParty(reservation, 'owner')

  const openDetail = async (reservation, clientName) => {
    detailClientRef.current = clientName
    setDetailOpen(true)
    setDetail(null)
    try {
      const mapped = await fetchReservationDetail(reservation.id, {
        statusLabels: STATUS_LABELS,
        clientName,
      })
      setDetail(mapped)
    } catch (err) {
      toast.error(err?.message || 'No pudimos cargar el detalle de la reserva.')
      setDetailOpen(false)
    }
  }

  const refreshDetail = async (current) => {
    try {
      const mapped = await fetchReservationDetail(current.id, {
        statusLabels: STATUS_LABELS,
        clientName: detailClientRef.current,
      })
      setDetail(mapped)
    } catch {
      // Si el refetch falla, el modal conserva el snapshot actual.
    }
  }

  const handleDetailAction = async (key, current) => {
    if (!onDetailAction) return
    await onDetailAction(key, current)
    await refreshDetail(current)
  }

  const renderAgendaStep = (reservation, other) => {
    const step = getReservationStep(reservation, role)
    if (step.kind === 'action') {
      return (
        <motion.button
          type="button"
          className="reserva-btn reserva-btn--owner"
          whileTap={{ scale: 0.96 }}
          transition={springLatch}
          onClick={() => onReservationAction?.(step.key, reservation)}
        >
          <i className="fas fa-check" aria-hidden="true" /> {step.label}
        </motion.button>
      )
    }
    if (step.kind === 'wait') {
      return <span className="reserva-wait">{step.message}</span>
    }
    if (step.kind === 'rate') {
      const view = getRatingView(ratingState, reservation.id)
      if (view.kind === 'rated') return null
      if (view.kind === 'rate' || view.kind === 'retry') {
        return (
          <>
            <motion.button
              type="button"
              className="reserva-btn reserva-btn--rate"
              whileTap={{ scale: 0.96 }}
              transition={springLatch}
              onClick={() => onRate?.(reservation, other)}
            >
              <i className="fas fa-star" aria-hidden="true" /> Calificar
            </motion.button>
            {view.kind === 'retry' ? (
              <span className="reserva-wait">No pudimos verificar tu calificación.</span>
            ) : null}
          </>
        )
      }
      return (
        <button type="button" className="reserva-btn reserva-btn--rate" disabled>
          Verificando…
        </button>
      )
    }
    return null
  }

  return (
    <section aria-labelledby="agenda-titulo">
      <header className="dashboard-header">
        <motion.h1 id="agenda-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
          Agenda
        </motion.h1>
        <p className="dashboard-sub">
          Entregas, devoluciones y calificaciones pendientes, ordenadas por fecha. Entrega y devolución a las {PICKUP_TIME}.
        </p>
      </header>

      <div className="reservas-tabs" role="tablist" aria-label="Agenda por rol">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'renter'}
          className={tab === 'renter' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'}
          onClick={() => setTab('renter')}
        >
          Como inquilino
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'owner'}
          className={tab === 'owner' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'}
          onClick={() => setTab('owner')}
        >
          Como dueño
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          message={
            role === 'renter'
              ? 'No tenés entregas, devoluciones ni calificaciones pendientes como inquilino.'
              : 'No tenés entregas, recepciones ni calificaciones pendientes como dueño.'
          }
        />
      ) : (
        <ol className="agenda-list">
          {items.map((reservation, i) => {
            const other = otherParty(reservation, role)
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
                  <p className="agenda-name">
                    <strong>{product?.title || 'Producto'}</strong>
                    <span className="agenda-owner">
                      {' · '}Propietario:{' '}
                      {role === 'owner' ? 'Vos' : ownerNames[product?.ownerId] || 'Propietario'}
                    </span>
                  </p>
                  {role === 'owner' && <p className="agenda-meta">Inquilino: {other}</p>}
                  <p className="agenda-times">
                    <span>
                      <i className="fas fa-box-open" aria-hidden="true" /> Entrega: {formatDateTime(reservation.dateInit)}
                    </span>
                    <span>
                      <i className="fas fa-box-archive" aria-hidden="true" /> Devolución: {formatDateTime(reservation.dateEnd)}
                    </span>
                  </p>
                  <div className="agenda-step">{renderAgendaStep(reservation, other)}</div>
                </div>
                <div className="agenda-actions">
                  <motion.button
                    type="button"
                    className="reserva-btn reserva-btn--detail"
                    whileTap={{ scale: 0.96 }}
                    transition={springLatch}
                    onClick={() => openDetail(reservation, clientNameFor(reservation))}
                    aria-label={`Ver detalle de la reserva de ${other}`}
                  >
                    <i className="fas fa-eye" aria-hidden="true" /> Detalle
                  </motion.button>
                  <motion.button
                    type="button"
                    className="agenda-chat"
                    whileTap={{ scale: 0.96 }}
                    transition={springLatch}
                    onClick={() => onChat(reservation.id)}
                    aria-label={`Hablar con ${other}`}
                  >
                    <i className="fas fa-comment" aria-hidden="true" /> Hablar
                  </motion.button>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}

      <ReservationDetailModal
        key={detail?.id ?? 'agenda-detail'}
        isOpen={detailOpen}
        reservation={detail}
        viewer={role}
        onClose={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        onAction={handleDetailAction}
      />
    </section>
  )
}

// Mis reservas como seguimiento/historial: tabs inquilino/dueño, estado,
// fechas, precio, contraparte, imagen, Detalle y Chat. Cancelar vive dentro
// del detalle (solo mientras la reserva no esté en curso). Sin acciones
// bilaterales ni calificación interactiva (viven en Agenda). Solo conserva el
// hecho histórico `Ya calificaste (N/5)` y mensajes no interactivos de espera.
export function ReservasList({
  renter,
  owner,
  userName,
  onChat,
  ratingState = {},
  onDetailAction,
}) {
  const [tab, setTab] = useState('renter')
  const [page, setPage] = useState(1)
  const [filterMonth, setFilterMonth] = useState('') // '' = todos los meses
  const [filterYear, setFilterYear] = useState('') // '' = todos los años
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const detailClientRef = useRef('')
  const list = tab === 'renter' ? renter : owner

  const handleTabChange = (id) => {
    if (id === tab) return
    setTab(id)
    setPage(1)
    // Cada tab trae listas y años distintos: se limpia el filtro para no
    // mostrar un estado vacío por una selección que ya no aplica.
    setFilterMonth('')
    setFilterYear('')
  }

  const handleMonthChange = (e) => {
    setFilterMonth(e.target.value)
    setPage(1)
  }

  const handleYearChange = (e) => {
    setFilterYear(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setFilterMonth('')
    setFilterYear('')
    setPage(1)
  }

  // Años presentes en los datos (para el select), más reciente primero.
  const availableYears = useMemo(() => {
    const years = new Set()
    for (const reservation of [...(renter ?? []), ...(owner ?? [])]) {
      const date = new Date(reservation.dateInit)
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear())
    }
    return [...years].sort((a, b) => b - a)
  }, [renter, owner])

  // Filtro por mes/año de inicio (`dateInit`) en fecha local: es la misma
  // fecha que muestra la card, así "10 dic" cae en diciembre.
  const matchesFilter = (reservation) => {
    if (!filterMonth && !filterYear) return true
    const date = new Date(reservation.dateInit)
    if (Number.isNaN(date.getTime())) return false
    if (filterMonth && date.getMonth() + 1 !== Number(filterMonth)) return false
    if (filterYear && date.getFullYear() !== Number(filterYear)) return false
    return true
  }

  // El filtro se aplica antes del orden y de la paginación.
  const filtered = list.filter(matchesFilter)

  // Más reciente primero (createdAt desc — el backend también lo ordena así).
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const totalPages = Math.max(1, Math.ceil(sorted.length / RESERVAS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = sorted.slice(
    (currentPage - 1) * RESERVAS_PAGE_SIZE,
    currentPage * RESERVAS_PAGE_SIZE
  )

  // El cliente es siempre el inquilino: en tab inquilino sos vos; en tab dueño,
  // el usuario de la reserva (GET /reservations/:id lo trae).
  const clientNameFor = (reservation) =>
    tab === 'renter' ? userName : otherParty(reservation, 'owner')

  const openDetail = async (reservation, clientName) => {
    detailClientRef.current = clientName
    setDetailOpen(true)
    setDetail(null)
    try {
      const mapped = await fetchReservationDetail(reservation.id, {
        statusLabels: STATUS_LABELS,
        clientName,
      })
      setDetail(mapped)
    } catch (err) {
      toast.error(err?.message || 'No pudimos cargar el detalle de la reserva.')
      setDetailOpen(false)
    }
  }

  const refreshDetail = async (current) => {
    try {
      const mapped = await fetchReservationDetail(current.id, {
        statusLabels: STATUS_LABELS,
        clientName: detailClientRef.current,
      })
      setDetail(mapped)
    } catch {
      // Si el refetch falla, el modal conserva el snapshot actual.
    }
  }

  // Detalle en modo seguimiento: solo propaga `cancel` (gestión previa, no
  // bilateral). Cualquier clave bilateral se ignora aunque el modal la
  // enviara: la coordinación vive en Agenda.
  const handleDetailAction = async (key, current) => {
    if (key !== 'cancel') return
    await onDetailAction(key, current)
    await refreshDetail(current)
  }

  // Solo seguimiento/historial: mensajes no interactivos de espera y hecho
  // histórico de calificación. Nunca botones bilaterales, `Calificar`,
  // `Verificando…` ni reintentos (viven en Agenda).
  const renderTrackingStatus = (reservation, role) => {
    const step = getReservationStep(reservation, role)
    if (step.kind === 'wait') {
      return <span className="reserva-wait">{step.message}</span>
    }
    if (step.kind === 'rate') {
      const view = getRatingView(ratingState, reservation.id)
      if (view.kind === 'rated') {
        return (
          <span className="reserva-wait">
            Ya calificaste esta reserva{typeof view.score === 'number' ? ` (${view.score}/5)` : ''}.
          </span>
        )
      }
    }
    return null
  }

  return (
    <section aria-labelledby="reservas-titulo">
      <header className="dashboard-header">
        <motion.h1 id="reservas-titulo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springReveal}>
          Mis reservas
        </motion.h1>
        <p className="dashboard-sub">Seguimiento e historial de tus reservas. La coordinación de entregas y devoluciones se hace desde Agenda.</p>
      </header>

      <div className="reservas-tabs" role="tablist" aria-label="Tipo de reserva">
        <button type="button" role="tab" aria-selected={tab === 'renter'} className={tab === 'renter' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'} onClick={() => handleTabChange('renter')}>
          Como inquilino
        </button>
        <button type="button" role="tab" aria-selected={tab === 'owner'} className={tab === 'owner' ? 'reservas-tab reservas-tab--active' : 'reservas-tab'} onClick={() => handleTabChange('owner')}>
          Como dueño
        </button>
      </div>

      {list.length > 0 && (
        <div className="reservas-filtros" role="group" aria-label="Filtrar por mes y año">
          <label className="reservas-filtros-campo" htmlFor="reservas-filtro-mes">
            Mes
            <select id="reservas-filtro-mes" value={filterMonth} onChange={handleMonthChange}>
              <option value="">Todos los meses</option>
              {FILTER_MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label className="reservas-filtros-campo" htmlFor="reservas-filtro-anio">
            Año
            <select id="reservas-filtro-anio" value={filterYear} onChange={handleYearChange}>
              <option value="">Todos los años</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          {(filterMonth || filterYear) && (
            <button type="button" className="reservas-filtros-limpiar" onClick={clearFilters}>
              <i className="fas fa-xmark" aria-hidden="true" /> Limpiar
            </button>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          message={
            tab === 'renter'
              ? 'Todavía no alquilaste nada.'
              : 'Todavía no tenés reservas en tus productos.'
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            filterMonth
              ? 'No tenés reservas en ese mes.'
              : 'No tenés reservas en ese año.'
          }
          actionLabel="Limpiar filtro"
          onAction={clearFilters}
        />
      ) : (
        <div className="reservas-list">
          {pageItems.map((reservation, i) => {
            const product = reservation.product
            const status = reservation.status
            const other = otherParty(reservation, tab)
            const days = rentalDays(reservation)
            const role = tab === 'renter' ? 'renter' : 'owner'

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
                      <motion.button
                        type="button"
                        className="reserva-btn reserva-btn--detail"
                        whileTap={{ scale: 0.96 }}
                        transition={springLatch}
                        onClick={() => openDetail(reservation, clientNameFor(reservation))}
                      >
                        <i className="fas fa-eye" aria-hidden="true" /> Detalle
                      </motion.button>
                      {renderTrackingStatus(reservation, role)}
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

      {sorted.length > RESERVAS_PAGE_SIZE && (
        <nav className="reservas-pagination" aria-label="Paginación de reservas">
          <button
            type="button"
            className="reservas-pagination__btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <i className="fas fa-chevron-left" aria-hidden="true" /> Anterior
          </button>
          <span className="reservas-pagination__info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="reservas-pagination__btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </nav>
      )}

      <ReservationDetailModal
        key={detail?.id ?? 'loading'}
        isOpen={detailOpen}
        reservation={detail}
        viewer={tab === 'renter' ? 'renter' : 'owner'}
        readOnly
        onClose={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        onAction={handleDetailAction}
      />
    </section>
  )
}

export default Dashboard
