import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMarketSocket } from '../hooks/useMarketSocket'
import OrderModal from '../components/orders/OrderModal'

const WATCHLIST = [
  { key: 'NSE_EQ|INE002A01018', symbol: 'RELIANCE',   name: 'Reliance Industries' },
  { key: 'NSE_EQ|INE467B01029', symbol: 'TCS',        name: 'Tata Consultancy' },
  { key: 'NSE_EQ|INE009A01021', symbol: 'INFY',       name: 'Infosys' },
  { key: 'NSE_EQ|INE040A01034', symbol: 'HDFCBANK',   name: 'HDFC Bank' },
  { key: 'NSE_EQ|INE090A01021', symbol: 'ICICIBANK',  name: 'ICICI Bank' },
  { key: 'NSE_EQ|INE075A01022', symbol: 'WIPRO',      name: 'Wipro' },
  { key: 'NSE_EQ|INE062A01020', symbol: 'SBIN',       name: 'State Bank of India' },
  { key: 'NSE_EQ|INE238A01034', symbol: 'AXISBANK',   name: 'Axis Bank' },
  { key: 'NSE_EQ|INE154A01025', symbol: 'ITC',        name: 'ITC Ltd' },
  { key: 'NSE_EQ|INE296A01024', symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
]

function fmt(v) { return v != null ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—' }

export default function MarketsPage() {
  const { authFetch } = useAuth()
  const { ticks, connected } = useMarketSocket(WATCHLIST.map(w => w.key))
  const [quotes,    setQuotes]    = useState({})
  const [selected,  setSelected]  = useState(null)
  const [showOrder, setShowOrder] = useState(false)
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)

  // Load REST quotes as fallback
  useEffect(() => {
    WATCHLIST.forEach(async ({ key }) => {
      try {
        const res = await authFetch(`/api/market/quote/${encodeURIComponent(key)}`)
        if (res.ok) {
          const d = await res.json()
          setQuotes(p => ({ ...p, [key]: d }))
        }
      } catch {}
    })
  }, [])

  // Search
  useEffect(() => {
    if (!search || search.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await authFetch(`/api/market/search?q=${encodeURIComponent(search)}`)
        if (res.ok) setResults(await res.json())
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const getPrice = (key) => ticks[key]?.ltp || quotes[key]?.ltp
  const getChg   = (key) => ticks[key]?.change_pct || quotes[key]?.change_pct

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Markets</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 5,
              background: connected ? 'var(--green)' : 'var(--red)' }} />
            {connected ? 'Live feed connected' : 'Connecting to live feed…'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input className="input" placeholder="Search stocks, e.g. Reliance, TCS…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }} />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text3)', fontSize: 14 }}>⌕</span>
        {searching && <span className="spinner" style={{ position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)', width: 16, height: 16 }} />}
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
            marginTop: 4, overflow: 'hidden' }}>
            {results.map(r => (
              <div key={r.id} onClick={() => { setSelected(r.instrument_key); setSearch(''); setResults([]) }}
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <span style={{ fontWeight: 500 }}>{r.symbol}</span>
                  <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 8 }}>{r.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.exchange} · {r.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watchlist */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13 }}>
          Watchlist
        </div>
        <table className="table">
          <thead><tr>
            <th>Symbol</th><th>LTP</th><th>Change</th><th>Volume</th><th>Bid</th><th>Ask</th><th></th>
          </tr></thead>
          <tbody>
            {WATCHLIST.map(({ key, symbol, name }) => {
              const tick = ticks[key] || quotes[key]
              const ltp  = tick?.ltp
              const chg  = Number(tick?.change_pct || 0)
              return (
                <tr key={key} style={{ cursor: 'pointer' }} onClick={() => setSelected(key)}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{name}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{ltp ? fmt(ltp) : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                  <td style={{ color: chg >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {tick ? `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{tick?.volume ? Number(tick.volume).toLocaleString('en-IN') : '—'}</td>
                  <td style={{ color: 'var(--green)' }}>{tick?.bid ? fmt(tick.bid) : '—'}</td>
                  <td style={{ color: 'var(--red)' }}>{tick?.ask ? fmt(tick.ask) : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={e => { e.stopPropagation(); setSelected(key); setShowOrder(true) }}>B</button>
                      <button className="btn btn-danger"  style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={e => { e.stopPropagation(); setSelected(key); setShowOrder(true) }}>S</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showOrder && <OrderModal onClose={() => setShowOrder(false)} defaultInstrument={selected} />}
    </div>
  )
}
