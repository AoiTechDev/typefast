'use client'
import type { Members, PresenceChannel } from 'pusher-js'
import { useEffect, useState } from 'react'

import { pusherClient, roomChannelName } from '@/lib/pusher-client'
import GameTextArea from './GameTextArea'
import { type Player, type Room } from '@/lib/db/schema'
import { toggleReady } from '@/actions/toggle-ready'

type LobbyPlayer = {
  id: string
  nick: string
  isReady: boolean
}

type PresenceMember = {
  id: string
  info: { nick: string, isReady: boolean }
}
type Lobby = Room & { players: Pick<Player, "id" | "nick" | "isReady">[] }

type LobbyProps = {
  code: string
  hostId: string | null
  lobby: Lobby | undefined
}

const Lobby = ({ code, hostId, lobby }: LobbyProps) => {
  const [players, setPlayers] = useState<LobbyPlayer[]>(lobby?.players ?? [])

  useEffect(() => {
    const channelName = roomChannelName(code)
    const channel = pusherClient.subscribe(channelName) as PresenceChannel

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      setPlayers(current => {
        const present: LobbyPlayer[] = []

        members.each((member: PresenceMember) => {
          const known = current.find(player => player.id === member.id)

          present.push({
            id: member.id,
            nick: member.info.nick,
            isReady: known?.isReady ?? member.info.isReady ?? false,
          })
        })

        return present
      })
    })

    channel.bind('pusher:member_added', (member: PresenceMember) => {
      setPlayers(current =>
        current.some(player => player.id === member.id)
          ? current
          : [...current, { id: member.id, nick: member.info.nick, isReady: member.info.isReady }],
      )
    })

    channel.bind('pusher:member_removed', (member: PresenceMember) => {
      setPlayers(current => current.filter(player => player.id !== member.id))
    })

    channel.bind("player:ready", ({ playerId, isReady }: { playerId: string, isReady: boolean }) => {
      setPlayers(current =>
        current.map(player => (player.id === playerId ? { ...player, isReady } : player)),
      );
    });

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [code])


  console.log(players)
  return (
    <div className="flex flex-col">
      {players.map(player => (
        <div key={player.id}>
          {player.nick}
          {player.id === hostId && ' (host)'}
        </div>
      ))}
      <button onClick={() => toggleReady(code)}>Ready</button>


      <GameTextArea raceText={lobby?.raceText || ""} />

      <div className="text-red-600">{players.map(p => <div key={p.id}>{p.isReady ? "ready" : "not ready"}</div>)}</div>
    </div>
  )
}

export default Lobby
