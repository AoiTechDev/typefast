# Type Fast

A real-time multiplayer typing race. Create a room, share a 6-character code, and race up to 7 friends to type the same paragraph first. Prefer to practice alone? Race yourself in solo mode.

## Features

- **Multiplayer rooms** – 2 to 8 players per room, joined with a short shareable code or invitation link.
- **Live lobby** – real-time presence, ready-up toggles, and live progress/WPM for every racer (Pusher presence channels).
- **Solo mode** – no room, no waiting; pick your rules and go.
- **Race modifiers** – the host (or you, in solo) can stack rule changes:
  | Modifier | Kind | Effect |
  | --- | --- | --- |
  | No backspace | input | Mistakes stay in forever. |
  | Stop on error | input | The cursor only advances on the correct character. |
  | Fog of war | visual | Only 10 characters ahead are visible. |
  | Mirror | visual | The text is rendered as a mirror image. |
- **Rounds** – after a race the host resets the lobby for another round; results are stored per round.
- **Scoring** – WPM (correct chars / 5 per minute) and accuracy, with a final standings table.
- **Server-side validation** – results are checked against the stored race text, the server clock, and a max plausible WPM to discourage cheating.
- **Unambiguous room codes** – the alphabet excludes `O`, `0`, `I`, and `1`.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Server Actions) + React 19
- TypeScript
- Tailwind CSS 4
- [Pusher Channels](https://pusher.com/channels) for real-time events
- PostgreSQL on [Neon](https://neon.tech) via [Drizzle ORM](https://orm.drizzle.team)
- [Zod](https://zod.dev) for input validation
- Vitest + Testing Library for tests
- Bun as package manager

## How it works

1. **Create / join** – `createRoom` and `joinRoom` server actions insert a room/player in Postgres and set an httpOnly `playerId` cookie (6 h).
2. **Lobby** – clients subscribe to `presence-room-<CODE>`. The auth endpoint (`app/api/pusher-auth`) only authorizes players who belong to that room.
3. **Ready & start** – when everyone is ready, `toggleReady` starts the race: it picks a text, sets `startedAt` (with a 5 s countdown), and broadcasts `race:start`.
4. **Race** – each client sends progress over a client event; on completion `finishRace` validates the typed text and timing, scores it, and stores a result.
5. **Finish** – once all players have a result, the room is marked `finished` and `race:finished` is broadcast with the standings. The host can then restart for a new round.

## Project structure

```
actions/        Server actions (create/join room, ready, finish, restart, modifiers)
app/            Routes: home, /room/[slug], /solo, /invitation, /api/pusher-auth
components/     Lobby, GameTextArea, SoloRace, ModifierPicker, UI pieces
lib/            DB schema/client, Pusher setup, scoring, modifiers, room codes, race text
validators/     Zod schemas
types/          Shared types
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js + npm)
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)
- A [Pusher Channels](https://pusher.com/channels) app (enable client events)

### Setup

```bash
git clone https://github.com/AoiTechDev/typefast.git
cd typefast
bun install
```

Create `.env.local` in the project root:

```env
DATABASE_URL=postgres://user:password@host/dbname

# Pusher
APP_ID=your_app_id
SECRET=your_secret
NEXT_PUBLIC_KEY=your_key
NEXT_PUBLIC_CLUSTER=your_cluster
```

Push the schema to your database:

```bash
bunx drizzle-kit push
```

Start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the development server |
| `bun run build` | Build for production |
| `bun start` | Run the production build |
| `bun run lint` | Lint with ESLint |
| `bun run test` | Run unit tests once |
| `bun run test:watch` | Run tests in watch mode |

## Testing

Unit tests live in `lib/__tests__/` (scoring and utility functions) and run with Vitest:

```bash
bun run test
```

## License

No license specified yet.
