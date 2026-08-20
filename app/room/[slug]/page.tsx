import { getHostId } from '@/actions/get-host-id'

import CopyInvLinkButton from '@/components/CopyInvLinkButton'
import Lobby from '@/components/Lobby'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { normalizeRoomCode } from '@/lib/room-code'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import React from 'react'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}




const page = async ({ params }: PageProps) => {
  const { slug } = await params
  const cookieStore = await cookies()
  const playerId = cookieStore.get('playerId')
  const hostId = await getHostId(slug)
  const isPlayerHost = String(hostId) === String(playerId?.value)

  // const players = await getPlayerList(slug)

  
  const lobby = await db.query.rooms.findFirst({
    where: eq(rooms.code, normalizeRoomCode(slug)),
    with: {
      players: {
        columns: {
          id: true,
          nick: true,
          isReady: true,
        },
      },
    },
  });

 
  return (
    <div>
      {isPlayerHost && <CopyInvLinkButton text={`http://localhost:3000/invitation?code=${slug}`} />}

      <Lobby code={slug} hostId={hostId} lobby={lobby} />
    </div>
  )
}

export default page
