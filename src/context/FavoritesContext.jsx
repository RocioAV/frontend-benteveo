import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from './useAuth'
import { addFavorite, fetchFavoriteIds, removeFavorite } from '../services/favorites.service'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { status, userId } = useAuth()
  const navigate = useNavigate()
  const [favoriteIds, setFavoriteIds] = useState(null)
  const [prevStatus, setPrevStatus] = useState(status)

  if (prevStatus !== status) {
    setPrevStatus(status)
    if (status !== 'authed') {
      setFavoriteIds(null)
    }
  }

  useEffect(() => {
    if (status !== 'authed') {
      return undefined
    }

    let cancelled = false

    fetchFavoriteIds()
      .then((ids) => {
        if (!cancelled) setFavoriteIds(ids)
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds([])
      })

    return () => {
      cancelled = true
    }
  }, [status, userId])

  const isFavorite = useCallback(
    (productId) => Array.isArray(favoriteIds) && favoriteIds.includes(productId),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    async (productId) => {
      if (status !== 'authed') {
        navigate('/login')
        return null
      }

      const current = Array.isArray(favoriteIds) ? favoriteIds : []
      const wasFavorite = current.includes(productId)
      setFavoriteIds(
        wasFavorite ? current.filter((id) => id !== productId) : [productId, ...current]
      )

      try {
        const result = wasFavorite
          ? await removeFavorite(productId)
          : await addFavorite(productId)
        toast.success(result.isFavorite ? 'Agregado a favoritos' : 'Quitado de favoritos')
        return result.isFavorite
      } catch {
        setFavoriteIds(
          wasFavorite ? [productId, ...current] : current.filter((id) => id !== productId)
        )
        toast.error('No pudimos actualizar tu favorito. Probá de nuevo.')
        return null
      }
    },
    [status, favoriteIds, navigate]
  )

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite]
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export default FavoritesContext
