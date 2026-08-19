'use client'
import type { Members, PresenceChannel } from 'pusher-js'
import { useEffect, useState } from 'react'

import { pusherClient, roomChannelName } from '@/lib/pusher-client'

type LobbyPlayer = {
  id: string
  nick: string
}

type PresenceMember = {
  id: string
  info: { nick: string }
}

type LobbyProps = {
  code: string
  hostId: string | null
  initialPlayers: LobbyPlayer[]
}

const Lobby = ({ code, hostId, initialPlayers }: LobbyProps) => {
  const [players, setPlayers] = useState(initialPlayers)

  useEffect(() => {
    const channelName = roomChannelName(code)
    const channel = pusherClient.subscribe(channelName) as PresenceChannel

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      const present: LobbyPlayer[] = []

      members.each((member: PresenceMember) => {
        present.push({ id: member.id, nick: member.info.nick })
      })

      setPlayers(present)
    })

    channel.bind('pusher:member_added', (member: PresenceMember) => {
      setPlayers(current =>
        current.some(player => player.id === member.id)
          ? current
          : [...current, { id: member.id, nick: member.info.nick }],
      )
    })

    channel.bind('pusher:member_removed', (member: PresenceMember) => {
      setPlayers(current => current.filter(player => player.id !== member.id))
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [code])

  return (
    <div className="flex flex-col">
      {players.map(player => (
        <div key={player.id}>
          {player.nick}
          {player.id === hostId && ' (host)'}
        </div>
      ))}
    </div>
  )
}

export default Lobby
