'use client'
import type { Members, PresenceChannel } from 'pusher-js'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { pusherClient } from '@/lib/pusher-client'
import { roomChannelName } from '@/lib/pusher-channels'
import GameTextArea from './GameTextArea'
import CopyInvLinkButton from './CopyInvLinkButton'
import { type Player, type Room } from '@/lib/db/schema'
import { toggleReady } from '@/actions/toggle-ready'
import { finishRace } from '@/actions/finish-race'

type LobbyPlayer = {
  id: string
  nick: string
  isReady: boolean
  progress: number
  wpm: number
  durationMs: number | null
}

type Standing = {
  playerId: string
  nick: string
  wpm: number
  accuracy: number
  durationMs: number
}

type PresenceMember = {
  id: string
  info: { nick: string; isReady: boolean }
}

type LobbyProps = {
  code: string
  hostId: string | null
  playerId: string | null
  lobby: (Room & { players: Pick<Player, 'id' | 'nick' | 'isReady'>[] }) | undefined
}

const Lobby = ({ code, hostId, playerId, lobby }: LobbyProps) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>(
    () => lobby?.players.map(player => ({ ...player, progress: 0, wpm: 0, durationMs: null })) ?? [],
  )
  const [raceText, setRaceText] = useState<string | null>(lobby?.raceText ?? null)
  const [startAt, setStartAt] = useState<number | null>(() =>
    lobby?.status === 'racing' && lobby.startedAt
      ? new Date(lobby.startedAt).getTime()
      : null,
  )
  const [remaining, setRemaining] = useState<number | null>(null)
  const [myId, setMyId] = useState<string | null>(playerId)
  const [finished, setFinished] = useState(false)
  const [standings, setStandings] = useState<Standing[] | null>(null)
  const [readyError, setReadyError] = useState<string | null>(null)
  const [togglingReady, startToggleReady] = useTransition()

  const progressRef = useRef<number>(0)
  const wpmRef = useRef<number>(0)
  const lastSentRef = useRef<number | null>(null)
  const channelRef = useRef<PresenceChannel | null>(null)

  const isRacing = startAt !== null && remaining !== null && remaining <= 0 && !finished

  useEffect(() => {
    const channelName = roomChannelName(code)
    const channel = pusherClient.subscribe(channelName) as PresenceChannel
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      setMyId(members.me?.id ?? playerId)

      setPlayers(current => {
        const present: LobbyPlayer[] = []

        members.each((member: PresenceMember) => {
          const known = current.find(player => player.id === member.id)

          present.push({
            id: member.id,
            nick: member.info.nick,
            isReady: known?.isReady ?? member.info.isReady ?? false,
            progress: known?.progress ?? 0,
            wpm: known?.wpm ?? 0,
            durationMs: known?.durationMs ?? null,
          })
        })

        return present
      })
    })

    channel.bind('pusher:member_added', (member: PresenceMember) => {
      setPlayers(current =>
        current.some(player => player.id === member.id)
          ? current
          : [
            ...current,
            {
              id: member.id,
              nick: member.info.nick,
              isReady: member.info.isReady ?? false,
              progress: 0,
              wpm: 0,
              durationMs: null,
            },
          ],
      )
    })

    channel.bind('pusher:member_removed', (member: PresenceMember) => {
      setPlayers(current => current.filter(player => player.id !== member.id))
    })

    channel.bind(
      'player:ready',
      ({ playerId, isReady }: { playerId: string; isReady: boolean }) => {
        setPlayers(current =>
          current.map(player => (player.id === playerId ? { ...player, isReady } : player)),
        )
      },
    )

    channel.bind(
      'race:start',
      ({ raceText, countdownMs }: { raceText: string; countdownMs: number }) => {
        setRaceText(raceText)
        setFinished(false)
        setStandings(null)
        setStartAt(Date.now() + countdownMs)
        lastSentRef.current = null
        setPlayers(current =>
          current.map(player => ({ ...player, progress: 0, wpm: 0, durationMs: null })),
        )
      },
    )

    channel.bind(
      'client-progress',
      (data: { progress: number; wpm: number }, metadata: { user_id: string }) => {
        setPlayers(current =>
          current.map(player =>
            player.id === metadata.user_id
              ? { ...player, progress: data.progress, wpm: data.wpm }
              : player,
          ),
        )
      },
    )

    channel.bind(
      'player:finished',
      ({
        playerId,
        wpm,
        durationMs,
      }: {
        playerId: string
        wpm: number
        durationMs: number
      }) => {
        setPlayers(current =>
          current.map(player =>
            player.id === playerId ? { ...player, progress: 1, wpm, durationMs } : player,
          ),
        )
      },
    )

    channel.bind('race:finished', ({ standings }: { standings: Standing[] }) => {
      setStandings(standings)
      setFinished(true)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
      channelRef.current = null
    }
  }, [code, playerId])

  useEffect(() => {
    if (startAt === null) return

    const tick = () => {
      const left = Math.max(0, startAt - Date.now())
      setRemaining(left)
      if (left === 0) clearInterval(id)
    }

    const id = setInterval(tick, 100)
    tick()

    return () => clearInterval(id)
  }, [startAt])

  useEffect(() => {
    if (!isRacing) return

    const id = setInterval(() => {
      const progress = progressRef.current

      if (progress === lastSentRef.current) return
      if (document.hidden) return

      lastSentRef.current = progress
      channelRef.current?.trigger('client-progress', {
        progress,
        wpm: Math.round(wpmRef.current),
      })
    }, 250)

    return () => clearInterval(id)
  }, [isRacing])

  const onProgress = useCallback(
    (progress: number, wpm: number) => {
      progressRef.current = progress
      wpmRef.current = wpm

      setPlayers(current =>
        current.map(player =>
          player.id === myId ? { ...player, progress, wpm: Math.round(wpm) } : player,
        ),
      )

      if (progress >= 1) setFinished(true)
    },
    [myId],
  )

  const countingDown = remaining !== null && remaining > 0

  const onFinish = useCallback((typedText: string) => {
    if (startAt === null) return
    finishRace(code, { durationMs: Date.now() - startAt, typedText })
  }, [startAt, code])
  const raceStarted = raceText !== null && startAt !== null
  const readyCount = players.filter(player => player.isReady).length
  const emptySeats = Math.max(0, (lobby?.maxPlayers ?? 0) - players.length)
  const me = players.find(player => player.id === myId)

  const handleReady = () => {
    setReadyError(null)

    startToggleReady(async () => {
      const result = await toggleReady(code)

      if (result && 'error' in result && result.error) setReadyError(result.error)
    })
  }

  if (standings) {
    return (
      <main className="px-6 py-10 md:px-10 max-w-3xl mx-auto">
        <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">Final</p>
        <h1 className="mt-2 text-5xl font-extrabold tracking-tighter uppercase">Results</h1>

        <ol className="mt-8 max-w-3xl border-[4px] border-ink bg-panel shadow-[10px_10px_0_0_var(--color-ink)]">
          {standings.map((standing, index) => (
            <li
              key={standing.playerId}
              className="flex items-center justify-between border-b-[3px] border-ink px-5 py-4 last:border-b-0"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 place-items-center border-[3px] border-ink font-mono font-extrabold ${
                    index === 0 ? 'bg-lime' : 'bg-panel'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-mono text-lg font-bold uppercase">{standing.nick}</span>
              </span>
              <span className="font-mono text-sm text-dim">
                <span className="text-ink">{standing.wpm} WPM</span> · {standing.accuracy}% ·{' '}
                {(standing.durationMs / 1000).toFixed(1)}s
              </span>
            </li>
          ))}
        </ol>
      </main>
    )
  }

  if (raceStarted && countingDown) {
    return (
      <main className="px-6 py-12 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">
            Hands on the keys
          </p>

          <p className="mt-4 text-[9rem] leading-none font-extrabold text-hot tabular-nums md:text-[11rem]">
            {Math.ceil(remaining / 1000)}
          </p>

          <div className="mt-8 border-[3px] border-ink bg-bg p-8 text-left">
            <p className="font-mono text-lg leading-[1.9] text-dim md:text-xl">{raceText}</p>
          </div>

          <p className="mt-6 font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">
            Typing unlocks at zero
          </p>
        </div>
      </main>
    )
  }

  if (raceStarted) {
    const field = [...players].sort((a, b) => {
      if (a.durationMs !== null && b.durationMs !== null) return a.durationMs - b.durationMs
      if (a.durationMs !== null) return -1
      if (b.durationMs !== null) return 1

      return b.progress - a.progress
    })

    const doneCount = field.filter(player => player.durationMs !== null).length

    return (
      <main className="px-6 py-10 md:px-10">
        <GameTextArea
          key={raceText ?? 'idle'}
          raceText={raceText ?? ''}
          onProgress={onProgress}
          onFinish={onFinish}
        />

        <section className="mx-auto mt-10 max-w-3xl border-[4px] border-ink bg-panel shadow-[10px_10px_0_0_var(--color-ink)]">
          <header className="flex items-center justify-between border-b-[3px] border-ink px-5 py-4">
            <h2 className="text-xl font-extrabold tracking-tight uppercase">The field</h2>
            <span className="font-mono text-xs font-bold tracking-widest text-dim uppercase">
              {doneCount} done · {field.length - doneCount} live
            </span>
          </header>

          {field.map((player, index) => (
            <div key={player.id} className="border-b-[3px] border-ink px-5 py-3 last:border-b-0">
              <div className="flex items-baseline justify-between">
                <span className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-dim tabular-nums">{index + 1}</span>
                  <span className="font-mono font-bold uppercase">
                    {player.nick}
                    {player.id === myId && <span className="text-dim"> (you)</span>}
                  </span>
                </span>

                <span className="font-mono text-xs font-bold tracking-widest uppercase">
                  {player.durationMs !== null ? (
                    <span className="text-hot">
                      Done {(player.durationMs / 1000).toFixed(1)}s
                    </span>
                  ) : (
                    <span>
                      {player.wpm} <span className="text-dim">WPM</span>
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-2 h-4 border-[3px] border-ink bg-sunk">
                <div
                  className={`h-full transition-all duration-300 ${
                    player.durationMs !== null ? 'bg-hot' : 'bg-ink'
                  }`}
                  style={{ width: `${Math.round(player.progress * 100)}%` }}
                />
              </div>
            </div>
          ))}

          <p className="border-t-[3px] border-ink px-5 py-3 font-mono text-xs text-dim">
            Bars update 4×/sec and glide between samples, so nothing looks steppy.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="grid gap-10 px-6 py-10 md:grid-cols-2 md:px-10 ">
      <section className="border-[4px] border-ink bg-panel p-7 shadow-[10px_10px_0_0_var(--color-ink)]">
        <p className="font-mono text-xs font-bold tracking-widest text-dim uppercase">
          Share this code
        </p>
        <div className="mt-2 border-[4px] border-ink bg-lime py-7 text-center text-5xl font-extrabold tracking-[0.15em] md:text-6xl">
          {code}
        </div>

        <div className="mt-5">
          <CopyInvLinkButton code={code} />
        </div>

        <hr className="mt-8 border-t-[3px] border-ink" />

        <p className="mt-5 font-mono text-sm text-dim">
          Players appear and disappear live. When every seat that is filled says READY, the
          countdown fires on its own.
        </p>

        <div className="mt-6 border-[2px] border-dashed border-dim p-4">
          <p className="font-mono text-xs font-bold tracking-widest text-dim uppercase">Passage</p>
          <p className="mt-2 font-mono text-sm leading-relaxed text-dim">
            The keyboard is a small machine for turning thought into evidence. Every letter you
            land is a claim, and every letter you miss is a correction waiting to happen.
          </p>
        </div>
      </section>

      <section className="border-[4px] border-ink bg-panel shadow-[10px_10px_0_0_var(--color-ink)]">
        <header className="flex items-center justify-between border-b-[3px] border-ink px-5 py-4">
          <h2 className="text-xl font-extrabold tracking-tight uppercase">Players</h2>
          <span className="font-mono text-sm font-bold tracking-widest uppercase">
            {readyCount} ready / {players.length} of {lobby?.maxPlayers ?? players.length}
          </span>
        </header>

        {players.map(player => (
          <div
            key={player.id}
            className="flex items-center justify-between border-b-[3px] border-ink px-5 py-3"
          >
            <span className="flex items-center gap-3">
              <span
                className={`grid h-8 w-8 place-items-center border-[3px] border-ink font-mono font-extrabold ${
                  player.id === myId ? 'bg-lime' : 'bg-panel'
                }`}
              >
                {player.nick.charAt(0).toUpperCase()}
              </span>
              <span className="font-mono font-bold uppercase">
                {player.nick}
                {player.id === myId && <span className="text-dim"> (you)</span>}
              </span>
            </span>

            <span className="flex items-center gap-2">
              {player.id === hostId && (
                <span className="border-[2px] border-ink px-2 py-1 font-mono text-[11px] font-bold tracking-widest uppercase">
                  Host
                </span>
              )}
              <span
                className={`border-[2px] px-2 py-1 font-mono text-[11px] font-bold tracking-widest uppercase ${
                  player.isReady ? 'border-ink bg-ink text-panel' : 'border-dim text-dim'
                }`}
              >
                {player.isReady ? '✓ Ready' : 'Waiting'}
              </span>
            </span>
          </div>
        ))}

        {Array.from({ length: emptySeats }).map((_, index) => (
          <div key={`empty-${index}`} className="border-b-[3px] border-dashed border-dim px-5 py-3">
            <span className="font-mono text-xs font-bold tracking-widest text-dim uppercase">
              Empty seat
            </span>
          </div>
        ))}

        <div className="p-5">
          {readyError && (
            <p className="mb-4 border-[3px] border-hot bg-hot px-3 py-2 font-mono text-sm text-panel">
              {readyError}
            </p>
          )}

          <button
            type="button"
            onClick={handleReady}
            disabled={togglingReady}
            className={`w-full border-[3px] border-ink py-5 text-lg font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 ${
              me?.isReady ? 'bg-panel' : 'bg-lime'
            }`}
          >
            {me?.isReady ? 'Not ready anymore' : "I'm ready →"}
          </button>

          <p className="mt-3 text-center font-mono text-[11px] tracking-widest text-dim uppercase">
            Starts the moment everyone is ready
          </p>
        </div>
      </section>
    </main>
  )
}

export default Lobby
