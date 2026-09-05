"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { parseModifiers } from "@/lib/modifiers";
import { roomChannelName } from "@/lib/pusher-channels";
import { pusherServer } from "@/lib/pusher-server";
import { normalizeRoomCode } from "@/lib/room-code";
import { UUID_PATTERN } from "@/lib/utils";

export const updateModifiers = async (code: string, ids: unknown) => {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId || !UUID_PATTERN.test(playerId)) {
    return { error: "You are not in this room" };
  }

  const roomCode = normalizeRoomCode(code);
  const modifiers = parseModifiers(ids);

  const [updated] = await db
    .update(rooms)
    .set({ modifiers })
    .where(
      and(
        eq(rooms.code, roomCode),
        eq(rooms.status, "waiting"),
        eq(rooms.hostPlayerId, playerId),
      ),
    )
    .returning({ modifiers: rooms.modifiers });

  if (!updated) return { error: "Only the host can change the rules before the start" };

  await pusherServer.trigger(roomChannelName(roomCode), "room:modifiers", {
    modifiers: updated.modifiers,
  });

  return { modifiers: updated.modifiers };
};
