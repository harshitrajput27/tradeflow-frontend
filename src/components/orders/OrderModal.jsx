import { useState } from 'react'
import { useOrders } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'

const INSTRUMENTS = [
  { label: 'RELIANCE (NSE)', value: 'NSE_EQ|INE002A01018' },
  { label: 'TCS (NSE)',      value: 'NSE_EQ|INE467B01029' },
  { label: 'INFY (NSE)',     value: 'NSE_EQ|INE009A01021' },
  { label: 'HDFCBANK (NSE)', value: 'NSE_EQ|INE040A01034' },
  { label: 'ICICIBANK (NSE)',value: 'NSE_EQ|INE090A01021' },
  { label: 'WIPRO (NSE)',    value: 'NSE_EQ|INE075A01022' },
  { label: 'SBIN (NSE)',     value: 'NSE_EQ|INE062A01020' },
  { label: 'AXISBANK (NSE)', value: 'NSE_EQ|INE238A01034' },
]

export default function OrderModal({ onClose, defaultInstrument }) {
  const { placeOrder } = useOrders()
  const [form, setForm] = useState({
    instrument_key:   defaultInstrument || INSTRUMENTS[0].value,
    transaction_type: 'BUY',
    order_type:       'MARKET',
    product_type:     'CNC',
    quantity:         1,
    price:            '',
    validity:         'DAY',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, quantity: Number(form.quantity) }
      if (form.order_type === 'MARKET') delete payload.price
      else payload.price = Number(form.price)
      await placeOrder(payload)
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: 440, maxWidth: '95vw' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Place Order</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)',
            fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Order placed successfully!</div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Buy / Sell toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['BUY', 'SELL'].map(t => (
                <button key={t} type="button"
                  onClick={() => set('transaction_type', t)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, fontWeight: 500, fontSize: 13,
                    cursor: 'pointer', border: '1px solid',
                    background: form.transaction_type === t ? (t === 'BUY' ? '#10b98120' : '#ef444420') : 'var(--bg3)',
                    borderColor: form.transaction_type === t ? (t === 'BUY' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
                    color: form.transaction_type === t ? (t === 'BUY' ? 'var(--green)' : 'var(--red)') : 'var(--text2)',
                  }}>{t}</button>
              ))}
            </div>

            <div>
              <label className="label">Instrument</label>
              <select className="input" value={form.instrument_key} onChange={e => set('instrument_key', e.target.value)}>
                {INSTRUMENTS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Order type</label>
                <select className="input" value={form.order_type} onChange={e => set('order_type', e.target.value)}>
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                  <option value="SL">Stop Loss</option>
                </select>
              </div>
              <div>
                <label className="label">Product</label>
                <select className="input" value={form.product_type} onChange={e => set('product_type', e.target.value)}>
                  <option value="CNC">CNC (Delivery)</option>
                  <option value="MIS">MIS (Intraday)</option>
                  <option value="NRML">NRML (F&O)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: form.order_type !== 'MARKET' ? '1fr 1fr' : '1fr', gap: 10 }}>
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" min="1" required
                  value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </div>
              {form.order_type !== 'MARKET' && (
                <div>
                  <label className="label">Price (₹)</label>
                  <input className="input" type="number" step="0.05" required
                    value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              )}
            </div>

            {error && <div style={{ color: 'var(--red)', fontSize: 13, background: '#ef444415',
              padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px',
              borderRadius: 8, fontWeight: 500, fontSize: 14, border: 'none', cursor: 'pointer',
              background: form.transaction_type === 'BUY' ? 'var(--green)' : 'var(--red)', color: '#fff' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> :
                `${form.transaction_type} ${form.instrument_key.split('|')[0].replace('NSE_EQ','').replace('BSE_EQ','') || ''}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
