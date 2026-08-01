import { useState, useEffect } from 'react'

export function useDeliveryAreas() {
  const [areas, setAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAreas() {
      try {
        const res = await fetch('/api/delivery-areas')
        const data = await res.json()
        if (data.success) {
          setAreas(data.areas)
        } else {
          setError(data.message || 'Failed to load delivery areas')
        }
      } catch (err) {
        setError('Network error loading delivery areas')
      } finally {
        setLoading(false)
      }
    }
    fetchAreas()
  }, [])

  return { areas, loading, error }
}
