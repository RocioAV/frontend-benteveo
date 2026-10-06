/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const LocationContext = createContext(null)

const locationOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
}

function stopWatching(watchIdRef) {
  if (watchIdRef.current === null || typeof navigator === 'undefined' || !navigator.geolocation) return

  navigator.geolocation.clearWatch(watchIdRef.current)
  watchIdRef.current = null
}

function getErrorStatus(error) {
  if (error?.code === 1) return 'denied'
  if (error?.code === 3) return 'timeout'
  return 'unavailable'
}

export function LocationProvider({ children }) {
  const [status, setStatus] = useState('idle')
  const [position, setPosition] = useState(null)
  const watchIdRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      requestIdRef.current += 1
      stopWatching(watchIdRef)
    }
  }, [])

  const requestLocation = () => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current
    let requestFailed = false

    stopWatching(watchIdRef)
    setPosition(null)
    setStatus('requesting')

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      return
    }

    try {
      const watchId = navigator.geolocation.watchPosition(
        (nextPosition) => {
          if (requestIdRef.current !== requestId) return

          setPosition(nextPosition)
          setStatus('active')
        },
        (error) => {
          if (requestIdRef.current !== requestId) return

          requestFailed = true
          stopWatching(watchIdRef)
          setStatus(getErrorStatus(error))
        },
        locationOptions,
      )

      if (requestFailed) {
        navigator.geolocation.clearWatch(watchId)
      } else if (requestIdRef.current === requestId) {
        watchIdRef.current = watchId
      } else {
        navigator.geolocation.clearWatch(watchId)
      }
    } catch {
      if (requestIdRef.current !== requestId) return

      stopWatching(watchIdRef)
      setStatus('unavailable')
    }
  }

  const useDemoLocation = () => {
    requestIdRef.current += 1
    stopWatching(watchIdRef)
    setPosition(null)
    setStatus('demo')
  }

  const clearLocation = () => {
    requestIdRef.current += 1
    stopWatching(watchIdRef)
    setPosition(null)
    setStatus('idle')
  }

  return (
    <LocationContext.Provider value={{
      status,
      position,
      requestLocation,
      useDemoLocation,
      clearLocation,
    }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)

  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }

  return context
}
