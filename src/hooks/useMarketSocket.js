import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

let socket = null
const subs = new Map()

function getSocket(token) {
  if (socket?.connected) return socket
  socket = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket'],
    reconnectionDelay: 2000,
  })
  socket.on('connect', () => {
    console.log('[WS] Connected!')
    const keys = [...subs.keys()]
    if (keys.length) socket.emit('subscribe', keys)
  })
  socket.on('tick', (tick) => {
    console.log('[WS] Tick received:', tick.instrument_key, tick.ltp)
    subs.get(tick.instrument_key)?.forEach(cb => cb(tick))
  })
  socket.on('connect_error', (err) => console.error('[WS] Error:', err.message))
  return socket
}

export function useMarketSocket(keys = []) {
  const { accessToken } = useAuth()
  const [ticks, setTicks] = useState({})
  const [connected, setConnected] = useState(false)
  const cbRefs = useRef(new Map())

  useEffect(() => {
    if (!accessToken || !keys.length) return
    const s = getSocket(accessToken)
    setConnected(s.connected)
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    keys.forEach(key => {
      const cb = (tick) => setTicks(p => ({ ...p, [key]: tick }))
      cbRefs.current.set(key, cb)
      if (!subs.has(key)) subs.set(key, new Set())
      subs.get(key).add(cb)
    })
    s.emit('subscribe', keys)

    return () => {
      keys.forEach(key => {
        const cb = cbRefs.current.get(key)
        if (cb) {
          subs.get(key)?.delete(cb)
          if (!subs.get(key)?.size) { subs.delete(key); s.emit('unsubscribe', [key]) }
        }
      })
      cbRefs.current.clear()
    }
  }, [accessToken, keys.join(',')])

  return { ticks, connected }
}

export function useIndexTicks() {
  const KEYS = ['NSE_INDEX|Nifty 50', 'BSE_INDEX|SENSEX', 'NSE_INDEX|Nifty Bank']
  const { ticks, connected } = useMarketSocket(KEYS)
  return {
    nifty50: ticks['NSE_INDEX|Nifty 50'],
    sensex: ticks['BSE_INDEX|SENSEX'],
    bankNifty: ticks['NSE_INDEX|Nifty Bank'],
    connected
  }
}
