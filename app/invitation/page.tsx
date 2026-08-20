import { count, eq } from 'drizzle-orm'
import Link from 'next/link'

import InvitationForm from '@/components/InvitationForm'
import { db } from '@/lib/db'
import { players, rooms } from '@/lib/db/schema'
import { COUNTDOWN_MS } from '@/lib/race'
import { isValidRoomCode, normalizeRoomCode } from '@/lib/room-code'

const Shell = ({ eyebrow, title, children }: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) => (
  <main className="px-6 py-12 md:px-10">
    <p className="font-mono text-xs font-bold tracking-[0.3em] text-dim uppercase">{eyebrow}</p>
    <h1 className="mt-3 max-w-3xl text-5xl leading-[0.9] font-extrabold tracking-tighter uppercase md:text-6xl">
      {title}
    </h1>

    <div className="mt-10 max-w-2xl border-[4px] border-ink bg-panel p-7 shadow-[10px_10px_0_0_var(--color-ink)]">
      {children}
    </div>
  </main>
)

const Problem = ({ title, message }: { title: string; message: string }) => (
  <Shell eyebrow="Dead end" title={title}>
    <p className="font-mono text-sm text-dim">{message}</p>
    <Link
      href="/"
      className="mt-6 inline-block border-[3px] border-ink bg-lime px-6 py-3 font-extrabold tracking-wide uppercase shadow-[6px_6px_0_0_var(--color-ink)]"
    >
      Back to start →
    </Link>
  </Shell>
)

const InvitationPage = async ({ searchParams }: PageProps<'/invitation'>) => {
  const { code } = await searchParams
  const roomCode = typeof code === 'string' ? normalizeRoomCode(code) : ''

  if (!isValidRoomCode(roomCode)) {
    return (
      <Problem
        title="That link is bent"
        message="The invite is missing a valid six-character room code. Ask whoever sent it to paste it again."
      />
    )
  }

  const [room] = await db
    .select({
      status: rooms.status,
      maxPlayers: rooms.maxPlayers,
      hostPlayerId: rooms.hostPlayerId,
      id: rooms.id,
    })
    .from(rooms)
    .where(eq(rooms.code, roomCode))
    .limit(1)

  if (!room) {
    return (
      <Problem
        title="No such room"
        message={`Nothing is running under ${roomCode}. Codes disappear when the host closes the room.`}
      />
    )
  }

  if (room.status !== 'waiting') {
    return (
      <Problem
        title="Too late"
        message="That race has already started. Ask the host to open a fresh room."
      />
    )
  }

  const [seats] = await db
    .select({ taken: count() })
    .from(players)
    .where(eq(players.roomId, room.id))

  if (seats.taken >= room.maxPlayers) {
    return (
      <Problem
        title="Room is full"
        message={`All ${room.maxPlayers} seats are taken. Wait for this race to end, or start your own.`}
      />
    )
  }

  const [host] = room.hostPlayerId
    ? await db
        .select({ nick: players.nick })
        .from(players)
        .where(eq(players.id, room.hostPlayerId))
        .limit(1)
    : []

  return (
    <Shell eyebrow="You were invited" title="The room is waiting">
      <p className="font-mono text-xs font-bold tracking-widest uppercase">Room code</p>
      <div className="mt-2 border-[4px] border-ink bg-lime py-6 text-center text-5xl font-extrabold tracking-[0.15em] md:text-6xl">
        {roomCode}
      </div>

      <p className="mt-3 font-mono text-sm text-dim">
        {host ? <>Hosted by <span className="text-ink">{host.nick}</span> · </> : null}
        {seats.taken} of {room.maxPlayers} seats taken · {COUNTDOWN_MS / 1000} second warm-up
      </p>

      <div className="mt-6">
        <InvitationForm code={roomCode} />
      </div>
    </Shell>
  )
}

export default InvitationPage
