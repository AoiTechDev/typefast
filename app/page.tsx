'use client'
import { useActionState, useState } from 'react'

import { createRoom } from '@/actions/create-room'
import { joinRoom } from '@/actions/join-room'
import { normalizeRoomCode } from '@/lib/room-code'

const PLAYER_COUNTS = [2, 3, 4, 5, 6, 7, 8]

const HomePage = () => {
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [code, setCode] = useState('')

  const [createState, createAction, creating] = useActionState(createRoom, {})
  const [joinState, joinAction, joining] = useActionState(joinRoom.bind(null, code), {})

  return (
    <main className="px-6 py-10 md:px-10">
      <h1 className="max-w-5xl text-5xl leading-[0.85] font-extrabold tracking-tighter uppercase sm:text-7xl md:text-8xl">
        <span className="block">Two to eight</span>
        <span className="block">people.</span>
        <span className="block">One paragraph.</span>
        <span className="mt-2 block">
          <span className="box-decoration-clone bg-hot px-3 py-1 text-panel">
            Fastest hands win.
          </span>
        </span>
      </h1>

      <div className="mt-14 grid max-w-5xl gap-10 md:grid-cols-2">
        <form
          action={createAction}
          className="border-[4px] border-ink bg-panel p-7 shadow-[8px_8px_0_0_var(--color-ink)]"
        >
          <span className="inline-block border-[3px] border-ink bg-lime px-2 font-mono text-xs font-extrabold tracking-widest uppercase">
            Path A · Host
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight uppercase">Create a room</h2>
          <p className="mt-1 font-mono text-sm text-dim">You get a code. You share the code.</p>

          <label htmlFor="create-nick" className="mt-6 block font-mono text-xs font-bold tracking-widest uppercase">
            Nickname
          </label>
          <input
            id="create-nick"
            name="nick"
            required
            minLength={2}
            maxLength={16}
            placeholder="MARGOT"
            className="mt-2 w-full border-[3px] border-ink bg-veil px-4 py-3 font-mono text-lg tracking-wide uppercase outline-none placeholder:text-dim focus:bg-panel"
          />

          <span className="mt-5 block font-mono text-xs font-bold tracking-widest uppercase">
            Max players
          </span>
          <input type="hidden" name="maxPlayers" value={maxPlayers} />
          <div className="mt-2 flex gap-2">
            {PLAYER_COUNTS.map(count => (
              <button
                key={count}
                type="button"
                aria-pressed={maxPlayers === count}
                onClick={() => setMaxPlayers(count)}
                className={`h-11 flex-1 border-[3px] border-ink font-mono font-bold ${
                  maxPlayers === count ? 'bg-ink text-panel' : 'bg-panel hover:bg-sunk'
                }`}
              >
                {count}
              </button>
            ))}
          </div>

          {createState.error && (
            <p className="mt-4 border-[3px] border-hot bg-hot px-3 py-2 font-mono text-sm text-panel">
              {createState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="mt-7 w-full border-[3px] border-ink bg-lime py-4 font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create room →'}
          </button>
        </form>

        <form
          action={joinAction}
          className="border-[4px] border-ink bg-panel p-7 shadow-[8px_8px_0_0_var(--color-ink)]"
        >
          <span className="inline-block border-[3px] border-ink bg-ink px-2 font-mono text-xs font-extrabold tracking-widest text-panel uppercase">
            Path B · Guest
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight uppercase">Join a room</h2>
          <p className="mt-1 font-mono text-sm text-dim">Someone sent you six characters.</p>

          <label htmlFor="join-code" className="mt-6 block font-mono text-xs font-bold tracking-widest uppercase">
            Room code
          </label>
          <input
            id="join-code"
            value={code}
            onChange={event => setCode(normalizeRoomCode(event.target.value).slice(0, 6))}
            required
            placeholder="ABC234"
            className="mt-2 w-full border-[3px] border-ink bg-veil px-4 py-3 text-center font-mono text-3xl tracking-[0.35em] outline-none placeholder:text-dim focus:bg-panel"
          />
          <p className="mt-2 font-mono text-[11px] tracking-widest text-dim uppercase">
            No O · 0 · I · 1 — they lie to you
          </p>

          <label htmlFor="join-nick" className="mt-5 block font-mono text-xs font-bold tracking-widest uppercase">
            Nickname
          </label>
          <input
            id="join-nick"
            name="nick"
            required
            minLength={2}
            maxLength={16}
            placeholder="BITROT"
            className="mt-2 w-full border-[3px] border-ink bg-veil px-4 py-3 font-mono text-lg tracking-wide uppercase outline-none placeholder:text-dim focus:bg-panel"
          />

          {joinState.error && (
            <p className="mt-4 border-[3px] border-hot bg-hot px-3 py-2 font-mono text-sm text-panel">
              {joinState.error}
            </p>
          )}

          <button
            type="submit"
            disabled={joining || code.length < 6}
            className="mt-7 w-full border-[3px] border-ink bg-panel py-4 font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-40"
          >
            {joining ? 'Joining…' : 'Join room →'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default HomePage
