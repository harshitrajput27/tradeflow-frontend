import { useState } from 'react'
import { usePortfolio } from '../hooks/useApi'

function fmt(v) { return v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—' }
function pct(v) { if (!v) return null; const n = Number(v); return <span style={{ color: n >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 12 }}>{n >= 0 ? '+' : ''}{n.toFixed(2)}%</span> }

export default function PortfolioPage() {
  const { holdings, positions, funds, mutualFunds, loading, refresh } = usePortfolio()
  const [tab, setTab] = useState('holdings')

  const tabs = [
    { id: 'holdings',  label: `Holdings (${holdings?.holdings?.length || 0})` },
    { id: 'positions', label: `Positions (${positions?.positions?.length || 0})` },
    { id: 'mf',        label: `Mutual Funds (${mutualFunds?.holdings?.length || 0})` },
    { id: 'funds',     label: 'Funds' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Portfolio</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            Total value: {fmt(holdings?.current_value)}
            <span style={{ marginLeft: 12 }}>{pct(holdings?.total_pnl_pct)}</span>
          </p>
        </div>
        <button className="btn btn-ghost" onClick={refresh}>↻ Refresh</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Invested', value: fmt(holdings?.total_investment) },
          { label: 'Current Value', value: fmt(holdings?.current_value) },
          { label: 'Total P&L', value: fmt(holdings?.total_pnl), pnl: holdings?.total_pnl },
          { label: 'Day P&L', value: fmt(positions?.total_pnl), pnl: positions?.total_pnl },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600,
              color: c.pnl != null ? (Number(c.pnl) >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text)' }}>
              {c.pnl != null && Number(c.pnl) >= 0 ? '+' : ''}{c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: '1px solid', cursor: 'pointer',
            background: tab === t.id ? 'var(--blue)' : 'var(--bg2)',
            borderColor: tab === t.id ? 'var(--blue)' : 'var(--border)',
            color: tab === t.id ? '#fff' : 'var(--text2)',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="empty-state"><div className="spinner" /></div> : (

          tab === 'holdings' ? (
            !holdings?.holdings?.length ? <div className="empty-state">No holdings</div> : (
              <table className="table">
                <thead><tr><th>Stock</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>Current Value</th><th>P&L</th><th>P&L %</th></tr></thead>
                <tbody>
                  {holdings.holdings.map(h => {
                    const pnl = Number(h.pnl || 0)
                    return (
                      <tr key={h.id}>
                        <td><div style={{ fontWeight: 500 }}>{h.symbol}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{h.exchange} · {h.instrument_name}</div></td>
                        <td>{h.quantity}</td>
                        <td>{fmt(h.average_buy_price)}</td>
                        <td>{fmt(h.last_price)}</td>
                        <td>{fmt(h.current_value)}</td>
                        <td style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</td>
                        <td>{pct(h.pnl_pct)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : tab === 'positions' ? (
            !positions?.positions?.length ? <div className="empty-state">No open positions today</div> : (
              <table className="table">
                <thead><tr><th>Stock</th><th>Product</th><th>Qty</th><th>Avg</th><th>LTP</th><th>P&L</th><th>M2M</th></tr></thead>
                <tbody>
                  {positions.positions.map(p => {
                    const pnl = Number(p.pnl || 0)
                    return (
                      <tr key={p.id}>
                        <td><div style={{ fontWeight: 500 }}>{p.symbol}</div></td>
                        <td><span className="badge badge-open">{p.product_type}</span></td>
                        <td>{p.quantity}</td>
                        <td>{fmt(p.average_price)}</td>
                        <td>{fmt(p.last_price)}</td>
                        <td style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</td>
                        <td style={{ color: Number(p.m2m||0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(p.m2m)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : tab === 'mf' ? (
            !mutualFunds?.holdings?.length ? <div className="empty-state">No mutual fund holdings</div> : (
              <table className="table">
                <thead><tr><th>Fund</th><th>Units</th><th>Avg NAV</th><th>Current NAV</th><th>Invested</th><th>Current Value</th><th>P&L</th></tr></thead>
                <tbody>
                  {mutualFunds.holdings.map(m => {
                    const pnl = Number(m.pnl || 0)
                    return (
                      <tr key={m.id}>
                        <td><div style={{ fontWeight: 500 }}>{m.scheme_name || m.scheme_code}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.folio_no}</div></td>
                        <td>{Number(m.units).toFixed(4)}</td>
                        <td>{fmt(m.avg_nav)}</td>
                        <td>{fmt(m.current_nav)}</td>
                        <td>{fmt(m.invested_amt)}</td>
                        <td>{fmt(m.current_val)}</td>
                        <td style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          ) : (
            <div style={{ padding: 20 }}>
              {!funds ? <div className="empty-state">No fund data</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {[
                    { label: 'Available Cash',   value: funds.available_cash },
                    { label: 'Used Margin',       value: funds.used_margin },
                    { label: 'Total Funds',       value: funds.total_funds },
                    { label: 'Withdrawable',      value: funds.withdrawable },
                  ].map(f => (
                    <div key={f.label} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '16px 18px' }}>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{f.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>{fmt(f.value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
