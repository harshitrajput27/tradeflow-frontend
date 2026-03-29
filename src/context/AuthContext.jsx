import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const API = ''  // empty = use vite proxy
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading]         = useState(true)
  const refreshTimer                  = useRef(null)

  const persist   = (rt) => localStorage.setItem('tf_rt', rt)
  const getStored = ()    => localStorage.getItem('tf_rt')
  const clear     = ()    => localStorage.removeItem('tf_rt')

  function scheduleRefresh(token) {
    clearTimeout(refreshTimer.current)
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]))
      const ms = Math.max(exp * 1000 - Date.now() - 60000, 5000)
      refreshTimer.current = setTimeout(silentRefresh, ms)
    } catch {}
  }

  async function silentRefresh() {
    const rt = getStored()
    if (!rt) { logout(); return }
    try {
      const res  = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAccessToken(data.accessToken)
      persist(data.refreshToken)
      scheduleRefresh(data.accessToken)
    } catch { logout() }
  }

  // Handle Upstox OAuth callback (#access_token=...&refresh_token=...)
  useEffect(() => {
    if (!window.location.hash.includes('access_token')) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const at = params.get('access_token')
    const rt = params.get('refresh_token')
    if (at && rt) {
      setAccessToken(at); persist(rt); scheduleRefresh(at)
      window.history.replaceState(null, '', '/dashboard')
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${at}` } })
        .then(r => r.json()).then(setUser).catch(() => {})
      setLoading(false)
    }
  }, [])

  // Boot: restore session
  useEffect(() => {
    (async () => {
      const rt = getStored()
      if (!rt) { setLoading(false); return }
      try {
        const res = await fetch(`${API}/api/auth/refresh`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt })
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAccessToken(data.accessToken); persist(data.refreshToken); scheduleRefresh(data.accessToken)
        const me = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${data.accessToken}` } })
        if (me.ok) setUser(await me.json())
      } catch { clear() }
      finally { setLoading(false) }
    })()
    return () => clearTimeout(refreshTimer.current)
  }, [])

  const login = useCallback(async (email, password) => {
    const res  = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setAccessToken(data.accessToken); setUser(data.user)
    persist(data.refreshToken); scheduleRefresh(data.accessToken)
    return data.user
  }, [])

  const register = useCallback(async (email, password, full_name) => {
    const res  = await fetch(`${API}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    return data
  }, [])

  const loginWithUpstox = useCallback(() => {
    window.location.href = `${API}/api/auth/upstox/login`
  }, [])

  const logout = useCallback(async () => {
    try {
      if (accessToken) await fetch(`${API}/api/auth/logout`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getStored() })
      })
    } catch {}
    clear(); clearTimeout(refreshTimer.current)
    setAccessToken(null); setUser(null)
  }, [accessToken])

  const authFetch = useCallback(async (url, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...opts.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }
    let res = await fetch(`${API}${url}`, { ...opts, headers })
    if (res.status === 401) {
      await silentRefresh()
      headers.Authorization = `Bearer ${accessToken}`
      res = await fetch(`${API}${url}`, { ...opts, headers })
    }
    return res
  }, [accessToken])

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated: !!accessToken, loading,
      login, register, logout, loginWithUpstox, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
