import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIndexTicks } from '../../hooks/useMarketSocket'

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/markets',   icon: '◈', label: 'Markets' },
  { to: '/orders',    icon: '◎', label: 'Orders' },
  { to: '/portfolio', icon: '◇', label: 'Portfolio' },
  { to: '/payments', icon: '₹', label: 'Payments' },
]

function fmt(v) { return v ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—' }
function chg(v) { if (!v) return null; const n = Number(v); return <span className={n >= 0 ? 'up' : 'down'}>{n >= 0 ? '+' : ''}{n.toFixed(2)}%</span> }

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { nifty50, sensex, bankNifty } = useIndexTicks()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Trade<span style={{ color: 'var(--blue)' }}>Flow</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>NSE · BSE · F&O</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'var(--bg3)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--amber)' : 'var(--text2)',
              background: isActive ? 'var(--bg3)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 15 }}>⚙</span>Admin
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
            {user?.full_name || 'User'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>{user?.email}</div>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }}
            onClick={() => { logout(); nav('/login') }}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'NIFTY 50',   data: nifty50 },
              { label: 'SENSEX',     data: sensex },
              { label: 'BANK NIFTY', data: bankNifty },
            ].map(({ label, data }) => (
              <div key={label} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(data?.ltp)}</div>
                <div style={{ fontSize: 11 }}>{chg(data?.change_pct)}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
