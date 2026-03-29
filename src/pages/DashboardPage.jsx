import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../hooks/useApi'
import { useIndexTicks } from '../hooks/useMarketSocket'
import OrderModal from '../components/orders/OrderModal'

function StatCard({ label, value, sub, subUp }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 4, color: subUp ? 'var(--green)' : 'var(--red)' }}>{sub}</div>}
    </div>
  )
}

function fmt(v, prefix = '₹') {
  if (v == null) return '—'
  return `${prefix}${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function IndexCard({ label, data }) {
  if (!data) return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, color: 'var(--text3)' }}>Connecting…</div>
    </div>
  )
  const chg = Number(data.change_pct || 0)
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{fmt(data.ltp, '')}</div>
      <div style={{ fontSize: 12, marginTop: 2, color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { holdings, positions, funds, loading } = usePortfolio()
  const { nifty50, sensex, bankNifty } = useIndexTicks()
  const [showOrder, setShowOrder] = useState(false)

  const totalVal = holdings?.current_value || 0
  const totalPnl = holdings?.total_pnl || 0
  const pnlPct   = holdings?.total_pnl_pct || 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Here's your portfolio overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowOrder(true)}>+ New Order</button>
      </div>

      {/* Index tickers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <IndexCard label="NIFTY 50"   data={nifty50} />
        <IndexCard label="SENSEX"     data={sensex} />
        <IndexCard label="BANK NIFTY" data={bankNifty} />
      </div>

      {/* Portfolio stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Portfolio Value" value={loading ? '—' : fmt(totalVal)}
          sub={!loading && `${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)} today`} subUp={totalPnl >= 0} />
        <StatCard label="Total P&L" value={loading ? '—' : fmt(totalPnl)}
          sub={!loading && `${pnlPct >= 0 ? '+' : ''}${Number(pnlPct).toFixed(2)}%`} subUp={pnlPct >= 0} />
        <StatCard label="Available Margin" value={loading ? '—' : fmt(funds?.available_cash)}
          sub={!loading && `Used: ${fmt(funds?.used_margin)}`} subUp={false} />
        <StatCard label="Open Positions" value={loading ? '—' : (positions?.positions?.length || 0)}
          sub={`${holdings?.holdings?.length || 0} holdings`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        {/* Holdings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 500 }}>Holdings</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{holdings?.holdings?.length || 0} stocks</span>
          </div>
          {loading ? <div className="empty-state"><div className="spinner" /></div> :
           !holdings?.holdings?.length ? <div className="empty-state">No holdings yet</div> : (
            <table className="table">
              <thead><tr>
                <th>Stock</th><th>Qty</th><th>Avg</th><th>LTP</th><th>P&L</th>
              </tr></thead>
              <tbody>
                {holdings.holdings.slice(0, 8).map(h => {
                  const pnl = Number(h.pnl || 0)
                  return (
                    <tr key={h.id}>
                      <td><div style={{ fontWeight: 500 }}>{h.symbol}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{h.exchange}</div></td>
                      <td>{h.quantity}</td>
                      <td>{fmt(h.average_buy_price, '')}</td>
                      <td>{fmt(h.last_price, '')}</td>
                      <td style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Positions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 500 }}>Today's Positions</span>
            <span style={{ fontSize: 12, color: positions?.total_pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {positions?.total_pnl >= 0 ? '+' : ''}{fmt(positions?.total_pnl)}
            </span>
          </div>
          {loading ? <div className="empty-state"><div className="spinner" /></div> :
           !positions?.positions?.length ? <div className="empty-state">No open positions</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {positions.positions.map(p => {
                const pnl = Number(p.pnl || 0)
                return (
                  <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{p.symbol}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{p.product_type}</span>
                      </div>
                      <span style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                        {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      Qty: {p.quantity} · Avg: {fmt(p.average_price, '')} · LTP: {fmt(p.last_price, '')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showOrder && <OrderModal onClose={() => setShowOrder(false)} />}
    </div>
  )
}
