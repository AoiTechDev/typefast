import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { pusherServer } from "@/lib/pusher-server";
import { normalizeRoomCode } from "@/lib/room-code";

const CHANNEL_PREFIX = "presence-room-";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const forbidden = () => new Response("Forbidden", { status: 403 });

export const POST = async (request: Request) => {
  const formData = await request.formData();
  const socketId = formData.get("socket_id");
  const channelName = formData.get("channel_name");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return new Response("Bad request", { status: 400 });
  }

  if (!channelName.startsWith(CHANNEL_PREFIX)) {
    return forbidden();
  }

  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId || !UUID_PATTERN.test(playerId)) {
    return forbidden();
  }

  const code = normalizeRoomCode(channelName.slice(CHANNEL_PREFIX.length));

  const [player] = await db
    .select({ nick: players.nick, isReady: players.isReady })
    .from(players)
    .innerJoin(rooms, eq(players.roomId, rooms.id))
    .where(and(eq(players.id, playerId), eq(rooms.code, code)))
    .limit(1);

  if (!player) {
    return forbidden();
  }

  const auth = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: playerId,
    user_info: { nick: player.nick, isReady: player.isReady },
  });

  return Response.json(auth);
};
