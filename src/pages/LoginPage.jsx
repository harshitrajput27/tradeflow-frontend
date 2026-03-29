import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AuthCard({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg2)',
        border: '1px solid var(--border)', borderRadius: 16, padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
            Trade<span style={{ color: 'var(--blue)' }}>Flow</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{subtitle}</div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login, loginWithUpstox, isAuthenticated } = useAuth()
  const nav = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Handle Upstox OAuth callback
  if (window.location.hash.includes('access_token') && isAuthenticated) {
    nav('/dashboard', { replace: true })
    return null
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.email, form.password); nav('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your trading account">
      <button onClick={loginWithUpstox} style={{ width: '100%', padding: '10px 16px',
        background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
        color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ width: 18, height: 18, background: '#7B3FE4', borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>U</span>
        Continue with Upstox
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>or use email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {error && <div style={{ background: '#ef444420', border: '1px solid #ef444440',
        borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@example.com" required
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" required
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 20 }}>
        No account? <Link to="/register" style={{ color: 'var(--blue)' }}>Create one</Link>
      </p>
    </AuthCard>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '', full_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await register(form.email, form.password, form.full_name)
      nav('/login', { state: { registered: true } })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <AuthCard title="Create account" subtitle="Start trading on NSE, BSE & F&O">
      {error && <div style={{ background: '#ef444420', border: '1px solid #ef444440',
        borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Harshit Rajput" required
            value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@example.com" required
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input className="input" type="tel" placeholder="+91 98765 43210"
            value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="Min 8 characters" required minLength={8}
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 20 }}>
        Have an account? <Link to="/login" style={{ color: 'var(--blue)' }}>Sign in</Link>
      </p>
    </AuthCard>
  )
}
