import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import Lobby from '@/components/Lobby'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { normalizeRoomCode } from '@/lib/room-code'

const RoomPage = async ({ params }: PageProps<'/room/[slug]'>) => {
  const { slug } = await params
  const roomCode = normalizeRoomCode(slug)

  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')?.value ?? null

  const lobby = await db.query.rooms.findFirst({
    where: eq(rooms.code, roomCode),
    with: {
      players: {
        columns: { id: true, nick: true, isReady: true },
      },
    },
  })

  if (!lobby) notFound()

  return (
    <Lobby
      code={roomCode}
      hostId={lobby.hostPlayerId}
      playerId={playerId}
      lobby={lobby}
    />
  )
}

export default RoomPage
