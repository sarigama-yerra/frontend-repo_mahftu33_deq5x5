import { useEffect, useMemo, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL

function Header() {
  return (
    <div className="w-full flex items-center justify-between p-4 bg-white/70 backdrop-blur border-b">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎲</span>
        <span className="text-xl font-bold">Ludo World</span>
      </div>
      <div className="text-sm text-gray-600">Play with friends or join a quick match</div>
    </div>
  )
}

function CreateJoin({ onSetRoom }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const canCreate = name.trim().length > 0

  async function createRoom() {
    if (!canCreate) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: name })
      })
      const data = await res.json()
      onSetRoom({ room: data, playerId: data.players[0]._id, name })
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom() {
    if (!name || !code) return
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: name, room_code: code.toUpperCase() })
      })
      const data = await res.json()
      const me = data.players[data.players.length - 1]
      onSetRoom({ room: data, playerId: me._id, name })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-xl shadow p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Start Playing</h2>
        <p className="text-gray-600">Create a room or join with a code</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border">
          <div className="font-semibold mb-2">Create Room</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" className="w-full border rounded px-3 py-2 mb-3" />
          <button onClick={createRoom} disabled={!canCreate || loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2">{loading? 'Creating...' : 'Create'}</button>
        </div>
        <div className="p-4 rounded-lg border">
          <div className="font-semibold mb-2">Join Room</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" className="w-full border rounded px-3 py-2 mb-3" />
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Room Code" className="w-full border rounded px-3 py-2 mb-3 uppercase tracking-widest" />
          <button onClick={joinRoom} disabled={!name||!code||loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-4 py-2">{loading? 'Joining...' : 'Join'}</button>
        </div>
      </div>
    </div>
  )
}

function Lobby({ state, onRefresh, onStart }) {
  const { room, playerId } = state
  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">Room: <span className="font-mono tracking-widest">{room.code}</span></div>
          <div className="text-sm text-gray-500">Share this code with friends</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border" onClick={onRefresh}>Refresh</button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={onStart}>Start Game</button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {room.players?.map(p => (
          <div key={p._id} className="rounded-lg border p-4 flex flex-col items-center">
            <div className="text-3xl" title={p.color}>{p.color === 'red' ? '🔴' : p.color === 'green' ? '🟢' : p.color === 'yellow' ? '🟡' : '🔵'}</div>
            <div className="font-semibold mt-2">{p.name}{p._id===playerId?' (You)':''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Game({ state, setState }) {
  const { room, playerId } = state
  const me = room.players.find(p=>p._id===playerId)
  const myTurn = room.current_turn === playerId

  async function refresh() {
    const res = await fetch(`${BACKEND}/rooms/${room.code}`)
    const data = await res.json()
    setState({ ...state, room: data })
  }

  async function roll() {
    const res = await fetch(`${BACKEND}/rooms/${room.code}/roll`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_code: room.code, player_id: playerId })
    })
    const data = await res.json()
    setState({ ...state, room: data.room })
  }

  useEffect(()=>{
    const t = setInterval(refresh, 2000)
    return ()=> clearInterval(t)
  }, [])

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">Playing in Room {room.code}</div>
          <div className="text-sm text-gray-600">Your color: {me?.color}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm">Last roll: <span className="font-semibold">{room.last_roll ?? '-'}</span></div>
          <button className={`px-4 py-2 rounded text-white ${myTurn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'}`} disabled={!myTurn} onClick={roll}>Roll Dice</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {room.players?.map(p => (
          <div key={p._id} className={`rounded-lg border p-4 ${room.current_turn===p._id? 'ring-2 ring-emerald-500' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{p.name}{p._id===playerId?' (You)':''}</div>
              <div title={p.color}>{p.color === 'red' ? '🔴' : p.color === 'green' ? '🟢' : p.color === 'yellow' ? '🟡' : '🔵'}</div>
            </div>
            <div className="text-sm text-gray-600">Tokens: {p.tokens.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [state, setState] = useState(null)

  async function refreshRoom() {
    if (!state) return
    const res = await fetch(`${BACKEND}/rooms/${state.room.code}`)
    const data = await res.json()
    setState({ ...state, room: data })
  }

  async function startGame() {
    const res = await fetch(`${BACKEND}/rooms/${state.room.code}/start`, { method: 'POST' })
    const data = await res.json()
    setState({ ...state, room: data })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <Header />
      {!state && <CreateJoin onSetRoom={setState} />}
      {state && state.room.status === 'waiting' && (
        <Lobby state={state} onRefresh={refreshRoom} onStart={startGame} />
      )}
      {state && state.room.status === 'playing' && (
        <Game state={state} setState={setState} />
      )}
      <div className="text-center text-xs text-gray-500 mt-10 pb-6">Backend: {BACKEND || 'not set'} · Tip: open two browser windows to test multiplayer</div>
    </div>
  )
}

export default App
