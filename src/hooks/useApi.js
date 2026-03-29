import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useApi(url, deps = []) {
  const { authFetch } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch_ = useCallback(async () => {
    if (!url) return
    setLoading(true); setError(null)
    try {
      const res = await authFetch(url)
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Request failed') }
      setData(await res.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [url, authFetch, ...deps])

  useEffect(() => { fetch_() }, [fetch_])
  return { data, loading, error, refetch: fetch_ }
}

export function usePortfolio() {
  const { authFetch } = useAuth()
  const [holdings,    setHoldings]    = useState(null)
  const [positions,   setPositions]   = useState(null)
  const [funds,       setFunds]       = useState(null)
  const [mutualFunds, setMutualFunds] = useState(null)
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [h, pos, f, mf] = await Promise.all([
        authFetch('/api/portfolio/holdings').then(r => r.json()),
        authFetch('/api/portfolio/positions').then(r => r.json()),
        authFetch('/api/portfolio/funds').then(r => r.json()),
        authFetch('/api/portfolio/mutual-funds').then(r => r.json()),
      ])
      setHoldings(h); setPositions(pos); setFunds(f); setMutualFunds(mf)
    } catch {}
    finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { load() }, [load])
  return { holdings, positions, funds, mutualFunds, loading, refresh: load }
}

export function useOrders() {
  const { authFetch } = useAuth()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const qs  = new URLSearchParams(params).toString()
      const res = await authFetch(`/api/orders${qs ? `?${qs}` : ''}`)
      const d   = await res.json()
      if (!res.ok) throw new Error(d.error)
      setOrders(d.orders || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { load() }, [load])

  const placeOrder = useCallback(async (payload) => {
    const res = await authFetch('/api/orders/place', { method: 'POST', body: JSON.stringify(payload) })
    const d   = await res.json()
    if (!res.ok) throw new Error(d.error || 'Order failed')
    setOrders(p => [d.order, ...p])
    return d.order
  }, [authFetch])

  const cancelOrder = useCallback(async (id) => {
    const res = await authFetch(`/api/orders/${id}`, { method: 'DELETE' })
    if (res.ok) setOrders(p => p.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o))
  }, [authFetch])

  return { orders, loading, error, refetch: load, placeOrder, cancelOrder }
}
