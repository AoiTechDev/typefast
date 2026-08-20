'use client'
import type { Members, PresenceChannel } from 'pusher-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { pusherClient } from '@/lib/pusher-client'
import { roomChannelName } from '@/lib/pusher-channels'
import GameTextArea from './GameTextArea'
import { type Player, type Room } from '@/lib/db/schema'
import { toggleReady } from '@/actions/toggle-ready'
import { finishRace } from '@/actions/finish-race'

type LobbyPlayer = {
  id: string
  nick: string
  isReady: boolean
  progress: number
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
  lobby: (Room & { players: Pick<Player, 'id' | 'nick' | 'isReady'>[] }) | undefined
}

const Lobby = ({ code, hostId, lobby }: LobbyProps) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>(
    () => lobby?.players.map(player => ({ ...player, progress: 0 })) ?? [],
  )
  const [raceText, setRaceText] = useState<string | null>(lobby?.raceText ?? null)
  const [startAt, setStartAt] = useState<number | null>(() =>
    lobby?.status === 'racing' && lobby.startedAt
      ? new Date(lobby.startedAt).getTime()
      : null,
  )
  const [remaining, setRemaining] = useState<number | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [standings, setStandings] = useState<Standing[] | null>(null)

  const progressRef = useRef<number>(0)
  const lastSentRef = useRef<number | null>(null)
  const channelRef = useRef<PresenceChannel | null>(null)

  const isRacing = startAt !== null && remaining !== null && remaining <= 0 && !finished

  useEffect(() => {
    const channelName = roomChannelName(code)
    const channel = pusherClient.subscribe(channelName) as PresenceChannel
    channelRef.current = channel

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      setMyId(members.me?.id ?? null)

      setPlayers(current => {
        const present: LobbyPlayer[] = []

        members.each((member: PresenceMember) => {
          const known = current.find(player => player.id === member.id)

          present.push({
            id: member.id,
            nick: member.info.nick,
            isReady: known?.isReady ?? member.info.isReady ?? false,
            progress: known?.progress ?? 0,
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
        setPlayers(current => current.map(player => ({ ...player, progress: 0 })))
      },
    )

    channel.bind(
      'client-progress',
      (data: { progress: number }, metadata: { user_id: string }) => {
        setPlayers(current =>
          current.map(player =>
            player.id === metadata.user_id ? { ...player, progress: data.progress } : player,
          ),
        )
      },
    )

    channel.bind(
      'player:finished',
      ({ playerId }: { playerId: string }) => {
        setPlayers(current =>
          current.map(player =>
            player.id === playerId ? { ...player, progress: 1 } : player,
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
  }, [code])

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
      channelRef.current?.trigger('client-progress', { progress })
    }, 250)

    return () => clearInterval(id)
  }, [isRacing])

  const onProgress = useCallback(
    (progress: number) => {
      progressRef.current = progress

      setPlayers(current =>
        current.map(player => (player.id === myId ? { ...player, progress } : player)),
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
  return (
    <div className="flex flex-col bg-white">
      {players.map(player => (
        <div key={player.id} className="flex items-center gap-2">
          <span>
            {player.nick}
            {player.id === hostId && ' (host)'}
          </span>
          <span className="text-red-600">{player.isReady ? 'ready' : 'not ready'}</span>
          <div className="h-2 w-40 bg-gray-200">
            <div
              className="h-2 bg-green-500 transition-all duration-300"
              style={{ width: `${Math.round(player.progress * 100)}%` }}
            />
          </div>
        </div>
      ))}

      <button onClick={() => toggleReady(code)}>Ready</button>

      {countingDown && <div>{Math.ceil(remaining / 1000)}</div>}

      {standings && (
        <ol>
          {standings.map((standing, index) => (
            <li key={standing.playerId}>
              {index + 1}. {standing.nick} — {standing.wpm} WPM,{' '}
              {standing.accuracy}%, {(standing.durationMs / 1000).toFixed(1)}s
            </li>
          ))}
        </ol>
      )}

      <GameTextArea
        key={raceText ?? 'idle'}
        raceText={raceText ?? ''}
        onProgress={onProgress}
        onFinish={onFinish}
      />
    </div>
  )
}

export default Lobby
