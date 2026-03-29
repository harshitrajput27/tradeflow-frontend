import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { data: stats } = useApi('/api/admin/stats')
  const [tab, setTab] = useState('kyc')

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Admin Panel</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>Platform management</p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Users',    value: stats.users?.total_users },
            { label: 'New Today',      value: stats.users?.new_today },
            { label: 'KYC Pending',    value: stats.kyc?.pending,  color: 'var(--amber)' },
            { label: 'Orders Today',   value: stats.orders?.today },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: s.color || 'var(--text)' }}>{s.value ?? '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[{ id: 'kyc', label: 'KYC Queue' }, { id: 'users', label: 'Users' }, { id: 'orders', label: 'Orders' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: '1px solid', cursor: 'pointer',
            background: tab === t.id ? 'var(--amber)' : 'var(--bg2)',
            borderColor: tab === t.id ? 'var(--amber)' : 'var(--border)',
            color: tab === t.id ? '#000' : 'var(--text2)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'kyc'    && <KYCPanel />}
      {tab === 'users'  && <UsersPanel />}
      {tab === 'orders' && <AdminOrdersPanel />}
    </div>
  )
}

function KYCPanel() {
  const { authFetch } = useAuth()
  const { data, loading, refetch } = useApi('/api/admin/kyc?status=pending')
  const [reviewing, setReviewing] = useState(null)

  const review = async (userId, action) => {
    setReviewing(userId)
    try {
      await authFetch(`/api/admin/kyc/${userId}/review`, {
        method: 'POST', body: JSON.stringify({ action })
      })
      refetch()
    } finally { setReviewing(null) }
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (!data?.users?.length) return <div className="card"><div className="empty-state">No pending KYC requests</div></div>

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table">
        <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Joined</th><th>Docs</th><th>Actions</th></tr></thead>
        <tbody>
          {data.users.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 500 }}>{u.full_name}</td>
              <td style={{ color: 'var(--text2)' }}>{u.email}</td>
              <td style={{ color: 'var(--text2)' }}>{u.phone || '—'}</td>
              <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              <td><span className="badge badge-pending">{u.doc_count} docs</span></td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-success" style={{ padding: '4px 12px', fontSize: 11 }}
                    disabled={reviewing === u.id} onClick={() => review(u.id, 'approved')}>
                    {reviewing === u.id ? '...' : 'Approve'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 11 }}
                    disabled={reviewing === u.id} onClick={() => review(u.id, 'rejected')}>
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsersPanel() {
  const { data, loading } = useApi('/api/admin/users?limit=20')
  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (!data?.users?.length) return <div className="card"><div className="empty-state">No users found</div></div>

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>KYC</th><th>Role</th><th>Orders</th><th>Joined</th></tr></thead>
        <tbody>
          {data.users.map(u => (
            <tr key={u.id}>
              <td style={{ fontWeight: 500 }}>{u.full_name}</td>
              <td style={{ color: 'var(--text2)' }}>{u.email}</td>
              <td><span className={`badge ${u.kyc_status === 'verified' ? 'badge-complete' : u.kyc_status === 'rejected' ? 'badge-sell' : 'badge-pending'}`}>{u.kyc_status}</span></td>
              <td><span className={`badge ${u.role === 'admin' ? 'badge-open' : 'badge-cancelled'}`}>{u.role}</span></td>
              <td style={{ color: 'var(--text2)' }}>{u.order_count}</td>
              <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminOrdersPanel() {
  const { data, loading } = useApi('/api/admin/orders?limit=30')
  if (loading) return <div className="empty-state"><div className="spinner" /></div>
  if (!data?.orders?.length) return <div className="card"><div className="empty-state">No orders</div></div>

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table">
        <thead><tr><th>User</th><th>Stock</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>
          {data.orders.map(o => (
            <tr key={o.id}>
              <td style={{ fontSize: 12 }}>{o.full_name}</td>
              <td style={{ fontWeight: 500 }}>{o.symbol}</td>
              <td><span className={`badge ${o.transaction_type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{o.transaction_type}</span></td>
              <td>{o.quantity}</td>
              <td>{o.price ? `₹${Number(o.price).toLocaleString('en-IN')}` : 'Market'}</td>
              <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(o.placed_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
