import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import products from '../data/products.json'
import Reservation from './Reservation.jsx'

function DetalleProducto() {
  const { id } = useParams()
  const product = products.find(p => p.id === Number(id))

  const [activeTab, setActiveTab] = useState('descripcion')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(Number(id)))
  }, [id])

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const productId = Number(id)
    let updated

    if (favorites.includes(productId)) {
      updated = favorites.filter(fav => fav !== productId)
      toast.info('Eliminado de favoritos')
    } else {
      updated = [...favorites, productId]
      toast.success('Agregado a favoritos')
    }

    localStorage.setItem('favorites', JSON.stringify(updated))
    setIsFavorite(!isFavorite)
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h2>
        <Link to="/explorar" className="text-amber-500 hover:text-amber-600 font-semibold">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const reviews = product.reviews || []
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < count ? 'text-amber-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        <div className="flex-1 min-w-0">
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 mb-3">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full aspect-[4/3] object-contain bg-white"
            />

            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={toggleFavorite}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition-all ${
                  isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-white/80 hover:bg-white'
                }`}
                aria-label="Favorito"
              >
                <svg
                  className={`w-5 h-5 ${isFavorite ? 'text-white' : 'text-gray-600'}`}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
              <button
                className="w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-all"
                aria-label="Compartir"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {product.category}
            </span>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {product.isAvailable ? 'Disponible' : 'No disponible'}
            </span>

            <div className="ml-auto text-right">
              <span className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-title)' }}>
                ${product.pricePerDay.toLocaleString('es-AR')}
              </span>
              <span className="text-sm text-gray-400 ml-1">por día</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-title)' }}>
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-bold text-gray-900">{product.rating}</span>
              <span>({reviews.length} reseñas)</span>
            </div>

            <span className="text-gray-300">·</span>

            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{product.city}, {product.region} · {product.distance}</span>
            </div>

            <span className="text-gray-300">·</span>

            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <span>{product.completedRentals} alquileres completados</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-sm">
                {product.owner.initials}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{product.owner.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <span>Identidad verificada</span>
                  <span>·</span>
                  <span>Miembro desde {product.owner.memberSince}</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 20.105V4.875A1.875 1.875 0 015.625 3h12.75A1.875 1.875 0 0120.25 4.875v10.5A1.875 1.875 0 0118.375 17.25H7.5l-3.75 2.855z" />
              </svg>
              Contactar
            </button>
          </div>

          <div className="mb-6">
            <div className="flex gap-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('descripcion')}
                className={`pb-3 text-sm font-semibold transition-colors ${
                  activeTab === 'descripcion'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('politicas')}
                className={`pb-3 text-sm font-semibold transition-colors ${
                  activeTab === 'politicas'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Políticas
              </button>
            </div>

            <div className="pt-5 text-sm text-gray-600 leading-relaxed">
              {activeTab === 'descripcion' ? (
                <p>{product.description}</p>
              ) : (
                <p>{product.policies}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-title)' }}>
                Reseñas ({reviews.length})
              </h2>
              <div className="flex items-center gap-1.5">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-gray-900">{product.rating}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {visibleReviews.map(review => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs">
                        {review.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{review.author}</p>
                        <p className="text-xs text-gray-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="flex items-center gap-2 mt-4 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-amber-600 transition-colors"
              >
                {showAllReviews ? 'Ocultar reseñas' : `Ver las ${reviews.length - 3} reseñas`}
                <svg
                  className={`w-4 h-4 transition-transform ${showAllReviews ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            )}
          </div>

        </div>

        <div className="w-full lg:w-[380px] flex-shrink-0">
          <Reservation product={product} />
        </div>

      </div>
    </div>
  )
}

export default DetalleProducto
