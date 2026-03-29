import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

function fmt(v) {
  return v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'
}

const STATUS_STYLE = {
  COMPLETED:  { background: '#10b98120', color: '#10b981' },
  PROCESSING: { background: '#3b82f620', color: '#3b82f6' },
  PENDING:    { background: '#f59e0b20', color: '#f59e0b' },
  FAILED:     { background: '#ef444420', color: '#ef4444' },
}

export default function PaymentPage() {
  const { authFetch } = useAuth()
  const [tab,          setTab]          = useState('deposit')
  const [summary,      setSummary]      = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([
        authFetch('/api/payments/summary').then(r => r.json()),
        authFetch('/api/payments/transactions?limit=10').then(r => r.json()),
      ])
      setSummary(s)
      setTransactions(t.transactions || [])
    } catch {}
    finally { setLoading(false) }
  }, [authFetch])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Payments</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>Add or withdraw funds from your account</p>
      </div>

      {/* Balance cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Available Cash',   value: summary.balance?.available_cash,  color: 'var(--green)' },
            { label: 'Withdrawable',     value: summary.balance?.withdrawable,     color: 'var(--blue)' },
            { label: 'Total Deposited',  value: summary.stats?.total_deposited,    color: 'var(--text)' },
            { label: 'Total Withdrawn',  value: summary.stats?.total_withdrawn,    color: 'var(--text)' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: c.color }}>{fmt(c.value)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Deposit / Withdraw forms */}
        <div className="card">
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {['deposit', 'withdraw'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px', borderRadius: 8, fontWeight: 500, fontSize: 13,
                border: '1px solid', cursor: 'pointer',
                background: tab === t ? (t === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--bg3)',
                borderColor: tab === t ? (t === 'deposit' ? 'var(--green)' : 'var(--red)') : 'var(--border)',
                color: tab === t ? '#fff' : 'var(--text2)',
              }}>{t === 'deposit' ? '+ Add Money' : '- Withdraw'}</button>
            ))}
          </div>

          {tab === 'deposit'
            ? <DepositForm authFetch={authFetch} onSuccess={loadData} />
            : <WithdrawForm authFetch={authFetch} onSuccess={loadData} balance={summary?.balance?.withdrawable} />
          }
        </div>

        {/* Quick info */}
        <div className="card">
          <div style={{ fontWeight: 500, marginBottom: 14 }}>
            {tab === 'deposit' ? 'How to add money' : 'Withdrawal info'}
          </div>
          {tab === 'deposit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { method: 'UPI', time: 'Instant', icon: '⚡', desc: 'Pay via UPI ID or QR code' },
                { method: 'NEFT', time: '2-4 hours', icon: '🏦', desc: 'Bank transfer via NEFT' },
                { method: 'IMPS', time: 'Instant', icon: '💸', desc: 'Instant bank transfer' },
                { method: 'RTGS', time: '30 min', icon: '🔄', desc: 'Real-time gross settlement' },
              ].map(m => (
                <div key={m.method} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.method}
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--green)', background: '#10b98120',
                        padding: '1px 6px', borderRadius: 99 }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Processing time', value: '1 working day' },
                { label: 'Minimum amount',  value: '₹100' },
                { label: 'Maximum per day', value: '₹2,00,000' },
                { label: 'Charges',         value: 'Free' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>{i.label}</span>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{i.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13 }}>
          Recent Transactions
        </div>
        {loading ? <div className="empty-state"><div className="spinner" /></div> :
         !transactions.length ? <div className="empty-state">No transactions yet</div> : (
          <table className="table">
            <thead><tr>
              <th>Type</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontWeight: 500,
                      color: t.type === 'DEPOSIT' ? 'var(--green)' : 'var(--red)' }}>
                      {t.type === 'DEPOSIT' ? '+ ' : '- '}{t.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{fmt(t.amount)}</td>
                  <td style={{ color: 'var(--text2)' }}>{t.payment_method || t.bank_account || '—'}</td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{t.utr_number || t.id?.slice(0,8)}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 500,
                      ...STATUS_STYLE[t.status] }}>{t.status}</span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function DepositForm({ authFetch, onSuccess }) {
  const [form, setForm] = useState({ amount: '', payment_method: 'UPI', utr_number: '', bank_name: '', remarks: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setLoading(true)
    try {
      const res = await authFetch('/api/payments/deposit', {
        method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMsg({ type: 'success', text: d.message })
      setForm({ amount: '', payment_method: 'UPI', utr_number: '', bank_name: '', remarks: '' })
      onSuccess()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {msg && <div style={{ padding: '10px 12px', borderRadius: 6, fontSize: 13,
        background: msg.type === 'success' ? '#10b98120' : '#ef444420',
        color: msg.type === 'success' ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}

      <div>
        <label className="label">Amount (₹)</label>
        <input className="input" type="number" min="100" placeholder="Enter amount" required
          value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[1000, 5000, 10000, 25000].map(a => (
            <button key={a} type="button" onClick={() => setForm(p => ({ ...p, amount: a }))}
              style={{ flex: 1, padding: '5px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              ₹{a.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Payment Method</label>
        <select className="input" value={form.payment_method}
          onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
          <option value="UPI">UPI</option>
          <option value="NEFT">NEFT</option>
          <option value="IMPS">IMPS</option>
          <option value="RTGS">RTGS</option>
        </select>
      </div>

      <div>
        <label className="label">UTR / Transaction Reference</label>
        <input className="input" placeholder="Enter UTR number" required
          value={form.utr_number} onChange={e => setForm(p => ({ ...p, utr_number: e.target.value }))} />
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          Transfer to: HDFC Bank · A/C: 50100123456789 · IFSC: HDFC0001234
        </div>
      </div>

      <div>
        <label className="label">Bank Name (optional)</label>
        <input className="input" placeholder="e.g. HDFC Bank"
          value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
      </div>

      <button type="submit" disabled={loading} style={{
        padding: '11px', borderRadius: 8, background: 'var(--green)', color: '#fff',
        border: 'none', fontWeight: 500, fontSize: 14, cursor: 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Processing…' : '+ Add Money'}
      </button>
    </form>
  )
}

function WithdrawForm({ authFetch, onSuccess, balance }) {
  const [form, setForm] = useState({ amount: '', bank_account: '', ifsc_code: '', account_name: '', remarks: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setMsg(null); setLoading(true)
    try {
      const res = await authFetch('/api/payments/withdraw', {
        method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMsg({ type: 'success', text: d.message })
      setForm({ amount: '', bank_account: '', ifsc_code: '', account_name: '', remarks: '' })
      onSuccess()
    } catch (err) { setMsg({ type: 'error', text: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {msg && <div style={{ padding: '10px 12px', borderRadius: 6, fontSize: 13,
        background: msg.type === 'success' ? '#10b98120' : '#ef444420',
        color: msg.type === 'success' ? 'var(--green)' : 'var(--red)' }}>{msg.text}</div>}

      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
        Available to withdraw: <span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmt(balance)}</span>
      </div>

      <div>
        <label className="label">Amount (₹)</label>
        <input className="input" type="number" min="100" placeholder="Enter amount" required
          value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
      </div>

      <div>
        <label className="label">Account Holder Name</label>
        <input className="input" placeholder="As per bank records" required
          value={form.account_name} onChange={e => setForm(p => ({ ...p, account_name: e.target.value }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
        <div>
          <label className="label">Bank Account Number</label>
          <input className="input" placeholder="Account number" required
            value={form.bank_account} onChange={e => setForm(p => ({ ...p, bank_account: e.target.value }))} />
        </div>
        <div>
          <label className="label">IFSC Code</label>
          <input className="input" placeholder="HDFC0001234" required
            value={form.ifsc_code} onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} />
        </div>
      </div>

      <div>
        <label className="label">Remarks (optional)</label>
        <input className="input" placeholder="Purpose of withdrawal"
          value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
      </div>

      <button type="submit" disabled={loading} style={{
        padding: '11px', borderRadius: 8, background: 'var(--red)', color: '#fff',
        border: 'none', fontWeight: 500, fontSize: 14, cursor: 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Processing…' : '- Withdraw Funds'}
      </button>
    </form>
  )
}
