import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000]

const UPI_OPTIONS = [
  { id: 'gpay',    name: 'Google Pay',  sub: 'Pay using GPay UPI',    color: '#1a73e8', label: 'G' },
  { id: 'phonepe', name: 'PhonePe',     sub: 'Pay using PhonePe UPI', color: '#5f259f', label: 'P' },
  { id: 'paytm',   name: 'Paytm',       sub: 'Pay using Paytm UPI',   color: '#00b9f1', label: 'PT' },
]

const BANKS = [
  { name: 'SBI',   color: '#004C97' },
  { name: 'HDFC',  color: '#004B8D' },
  { name: 'ICICI', color: '#F58220' },
  { name: 'Axis',  color: '#97144D' },
  { name: 'Kotak', color: '#007DC5' },
  { name: 'PNB',   color: '#1C3A6A' },
]

const WALLETS = [
  { name: 'Paytm Wallet', balance: '₹2,450', color: '#00b9f1', label: 'PT' },
  { name: 'Mobikwik',     balance: '₹890',   color: '#e8232a', label: 'MO' },
  { name: 'Ola Money',    balance: '₹320',   color: '#f26522', label: 'OLA' },
]

export default function PaymentModal({ onClose, onSuccess, defaultAmount = 10000 }) {
  const { authFetch } = useAuth()
  const [tab,        setTab]        = useState('upi')
  const [amount,     setAmount]     = useState(defaultAmount)
  const [customAmt,  setCustomAmt]  = useState('')
  const [upiId,      setUpiId]      = useState('')
  const [selUpi,     setSelUpi]     = useState('gpay')
  const [selBank,    setSelBank]    = useState('SBI')
  const [selWallet,  setSelWallet]  = useState('Paytm Wallet')
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(null)
  const [error,      setError]      = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })

  const finalAmount = customAmt ? Number(customAmt) : amount

  const fmtCard = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  const fmtExpiry = (v) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 2 ? d.slice(0,2)+' / '+d.slice(2) : d }

  const pay = async () => {
    if (finalAmount < 100) { setError('Minimum amount is ₹100'); return }
    setLoading(true); setError('')
    try {
      const method = tab === 'upi' ? (upiId ? `UPI:${upiId}` : selUpi.toUpperCase()) :
                     tab === 'card' ? 'CARD' : tab === 'netbanking' ? selBank : selWallet
      const res = await authFetch('/api/payments/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: finalAmount,
          payment_method: method,
          utr_number: 'TXN' + Date.now(),
          remarks: `Deposit via ${method}`,
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setSuccess({ txnId: d.transaction.id?.slice(0,8).toUpperCase(), amount: finalAmount, method })
      if (onSuccess) onSuccess(finalAmount)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const s = { // styles
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
    modal: { background:'var(--color-background-primary)', borderRadius:16,
      border:'0.5px solid var(--color-border-tertiary)', width:'100%', maxWidth:500,
      overflow:'hidden', display:'flex' },
    left: { width:190, background:'#1a2236', padding:22, color:'#fff', flexShrink:0,
      display:'flex', flexDirection:'column' },
    right: { flex:1, minWidth:0, display:'flex', flexDirection:'column' },
    tab: (active) => ({ flex:1, padding:'11px 6px', fontSize:12, fontWeight:500, cursor:'pointer',
      border:'none', background:'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
      color: active ? '#3b82f6' : 'var(--color-text-secondary)', transition:'all .15s' }),
    input: { width:'100%', padding:'9px 11px', border:'0.5px solid var(--color-border-secondary)',
      borderRadius:8, fontSize:13, color:'var(--color-text-primary)',
      background:'var(--color-background-primary)', outline:'none' },
    chip: (active) => ({ padding:'5px 12px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer',
      border:'0.5px solid', background: active ? '#3b82f620' : 'var(--color-background-secondary)',
      borderColor: active ? '#3b82f6' : 'var(--color-border-secondary)',
      color: active ? '#185FA5' : 'var(--color-text-secondary)' }),
    upiRow: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
      border:'0.5px solid', borderColor: active ? '#3b82f6' : 'var(--color-border-tertiary)',
      borderRadius:8, cursor:'pointer', marginBottom:8,
      background: active ? 'var(--color-background-info)' : 'transparent' }),
    bankBox: (active) => ({ padding:'10px 8px', border:'0.5px solid',
      borderColor: active ? '#3b82f6' : 'var(--color-border-tertiary)',
      borderRadius:8, cursor:'pointer', textAlign:'center',
      background: active ? 'var(--color-background-info)' : 'transparent' }),
    payBtn: (color='#3b82f6') => ({ width:'100%', padding:12, background:color, color:'#fff',
      border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer',
      opacity: loading ? 0.7 : 1, marginTop:10 }),
  }

  if (success) return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, flexDirection:'column', padding:32, textAlign:'center', maxWidth:380 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width:60, height:60, background:'#10b98120', borderRadius:'50%', display:'flex',
          alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:26, color:'#10b981' }}>✓</div>
        <div style={{ fontSize:18, fontWeight:500, marginBottom:6 }}>Payment Successful!</div>
        <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginBottom:16 }}>
          ₹{finalAmount.toLocaleString('en-IN')} added to your TradeFlow wallet
        </div>
        <div style={{ background:'var(--color-background-secondary)', borderRadius:8, padding:'12px 16px',
          marginBottom:20, fontSize:12, color:'var(--color-text-secondary)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span>Transaction ID</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--color-text-primary)' }}>TXN{success.txnId}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span>Method</span><span style={{ color:'var(--color-text-primary)' }}>{success.method}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Time</span><span style={{ color:'var(--color-text-primary)' }}>{new Date().toLocaleTimeString('en-IN')}</span>
          </div>
        </div>
        <button onClick={onClose} style={s.payBtn('#10b981')}>Done</button>
      </div>
    </div>
  )

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Left */}
        <div style={s.left}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <div style={{ width:34, height:34, background:'#3b82f6', borderRadius:8, display:'flex',
              alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>TF</div>
            <div>
              <div style={{ fontSize:14, fontWeight:500 }}>TradeFlow</div>
              <div style={{ fontSize:10, opacity:.5, marginTop:1 }}>Secured Payment</div>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, opacity:.5, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Amount</div>
            <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.5px' }}>
              ₹{finalAmount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize:11, opacity:.5, marginTop:2 }}>Add to wallet</div>
          </div>
          <div style={{ background:'rgba(255,255,255,.08)', borderRadius:8, padding:'10px 12px', fontSize:12, opacity:.8 }}>
            <div style={{ fontWeight:500, marginBottom:2 }}>Harshit Rajput</div>
            <div>harshit@tradeflow.in</div>
          </div>
          <div style={{ marginTop:'auto', paddingTop:16, fontSize:10, opacity:.35, lineHeight:1.7 }}>
            256-bit SSL encrypted<br/>PCI DSS compliant<br/>RBI regulated
          </div>
        </div>

        {/* Right */}
        <div style={s.right}>
          {/* Amount chips */}
          <div style={{ padding:'12px 16px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:7 }}>Quick select</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} style={s.chip(amount === a && !customAmt)}
                  onClick={() => { setAmount(a); setCustomAmt('') }}>
                  ₹{a >= 1000 ? (a/1000)+'K' : a}
                </button>
              ))}
              <input style={{ ...s.input, width:90, padding:'5px 8px', fontSize:11 }}
                placeholder="Custom" type="number" value={customAmt}
                onChange={e => setCustomAmt(e.target.value)} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
            {['upi','card','netbanking','wallet'].map(t => (
              <button key={t} style={s.tab(tab===t)} onClick={() => setTab(t)}>
                {t === 'netbanking' ? 'Net Banking' : t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding:'16px', overflowY:'auto', flex:1 }}>
            {error && <div style={{ background:'var(--color-background-danger)', color:'var(--color-text-danger)',
              borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:12 }}>{error}</div>}

            {/* UPI */}
            {tab === 'upi' && (
              <div>
                {UPI_OPTIONS.map(u => (
                  <div key={u.id} style={s.upiRow(selUpi===u.id)} onClick={() => setSelUpi(u.id)}>
                    <div style={{ width:34, height:34, background:u.color, borderRadius:7, display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{u.label}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-tertiary)' }}>{u.sub}</div>
                    </div>
                    <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${selUpi===u.id?'#3b82f6':'var(--color-border-secondary)'}`,
                      background: selUpi===u.id ? '#3b82f6' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {selUpi===u.id && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }} />}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize:11, color:'var(--color-text-tertiary)', textAlign:'center', margin:'10px 0' }}>or enter UPI ID</div>
                <div style={{ display:'flex', gap:8 }}>
                  <input style={{ ...s.input, flex:1 }} placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} />
                  <button style={{ padding:'9px 12px', border:'0.5px solid var(--color-border-secondary)',
                    borderRadius:8, fontSize:12, cursor:'pointer', background:'var(--color-background-secondary)',
                    color:'var(--color-text-primary)', whiteSpace:'nowrap' }}>Verify</button>
                </div>
              </div>
            )}

            {/* Card */}
            {tab === 'card' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Card number</label>
                  <input style={s.input} placeholder="1234 5678 9012 3456"
                    value={card.number} onChange={e => setCard(p=>({...p,number:fmtCard(e.target.value)}))} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Cardholder name</label>
                  <input style={s.input} placeholder="Name on card"
                    value={card.name} onChange={e => setCard(p=>({...p,name:e.target.value}))} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>Expiry</label>
                    <input style={s.input} placeholder="MM / YY"
                      value={card.expiry} onChange={e => setCard(p=>({...p,expiry:fmtExpiry(e.target.value)}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--color-text-secondary)', display:'block', marginBottom:5 }}>CVV</label>
                    <input style={s.input} type="password" placeholder="•••" maxLength={4}
                      value={card.cvv} onChange={e => setCard(p=>({...p,cvv:e.target.value}))} />
                  </div>
                </div>
              </div>
            )}

            {/* Net Banking */}
            {tab === 'netbanking' && (
              <div>
                <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:10 }}>Popular banks</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                  {BANKS.map(b => (
                    <div key={b.name} style={s.bankBox(selBank===b.name)} onClick={() => setSelBank(b.name)}>
                      <div style={{ width:28, height:28, background:b.color, borderRadius:6, margin:'0 auto',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:9, fontWeight:700, color:'#fff' }}>{b.name}</div>
                      <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-primary)', marginTop:4 }}>{b.name}</div>
                    </div>
                  ))}
                </div>
                <select style={s.input}>
                  <option>Other banks...</option>
                  <option>Bank of Baroda</option>
                  <option>Canara Bank</option>
                  <option>Union Bank</option>
                </select>
              </div>
            )}

            {/* Wallet */}
            {tab === 'wallet' && (
              <div>
                {WALLETS.map(w => (
                  <div key={w.name} style={s.upiRow(selWallet===w.name)} onClick={() => setSelWallet(w.name)}>
                    <div style={{ width:34, height:34, background:w.color, borderRadius:7, display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 }}>{w.label}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>{w.name}</div>
                      <div style={{ fontSize:11, color:'var(--color-text-tertiary)' }}>Balance: {w.balance}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button style={s.payBtn()} onClick={pay} disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${finalAmount.toLocaleString('en-IN')}`}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center', marginTop:12,
              fontSize:11, color:'var(--color-text-tertiary)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981' }} />
              Secured by TradeFlow · 256-bit SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
