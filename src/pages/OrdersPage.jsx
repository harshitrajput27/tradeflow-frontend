import { useState } from 'react'
import { useOrders } from '../hooks/useApi'
import OrderModal from '../components/orders/OrderModal'

const STATUS_COLORS = {
  COMPLETE:  'badge-complete',
  OPEN:      'badge-open',
  PENDING:   'badge-pending',
  CANCELLED: 'badge-cancelled',
  REJECTED:  'badge-sell',
}

function fmt(v) { return v ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' }

export default function OrdersPage() {
  const { orders, loading, cancelOrder } = useOrders()
  const [showModal, setShowModal] = useState(false)
  const [filter,    setFilter]    = useState('ALL')
  const [cancelling, setCancelling] = useState(null)

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  const handleCancel = async (id) => {
    setCancelling(id)
    try { await cancelOrder(id) }
    finally { setCancelling(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Orders</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{orders.length} total orders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Place Order</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['ALL', 'OPEN', 'COMPLETE', 'CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: '1px solid', cursor: 'pointer',
            background: filter === f ? 'var(--blue)' : 'var(--bg2)',
            borderColor: filter === f ? 'var(--blue)' : 'var(--border)',
            color: filter === f ? '#fff' : 'var(--text2)',
          }}>{f}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : !filtered.length ? (
          <div className="empty-state">
            <div style={{ fontSize: 24 }}>📋</div>
            <div>No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders found</div>
            <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>Place your first order</button>
          </div>
        ) : (
          <table className="table">
            <thead><tr>
              <th>Instrument</th><th>Type</th><th>Product</th>
              <th>Qty</th><th>Price</th><th>Status</th><th>Time</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.symbol || o.instrument_id?.slice(0,8)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.exchange}</div>
                  </td>
                  <td>
                    <span className={`badge ${o.transaction_type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                      {o.transaction_type}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{o.order_type}</div>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{o.product_type}</td>
                  <td>{o.quantity}{o.filled_quantity > 0 && o.filled_quantity < o.quantity &&
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}> ({o.filled_quantity} filled)</span>}</td>
                  <td>{o.price ? fmt(o.price) : <span style={{ color: 'var(--text3)' }}>Market</span>}</td>
                  <td><span className={`badge ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span></td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {new Date(o.placed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    {['OPEN', 'PENDING'].includes(o.status) && (
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }}
                        disabled={cancelling === o.id}
                        onClick={() => handleCancel(o.id)}>
                        {cancelling === o.id ? '...' : 'Cancel'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <OrderModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
