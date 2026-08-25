"use server";

import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { roomChannelName } from "@/lib/pusher-channels";
import { pusherServer } from "@/lib/pusher-server";
import { normalizeRoomCode } from "@/lib/room-code";
import { UUID_PATTERN } from "@/lib/utils";

export const restartRace = async (code: string) => {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId || !UUID_PATTERN.test(playerId)) {
    return { error: "Nie jesteś w tym pokoju" };
  }

  const roomCode = normalizeRoomCode(code);

  const [room] = await db
    .select({
      id: rooms.id,
      status: rooms.status,
      hostPlayerId: rooms.hostPlayerId,
    })
    .from(rooms)
    .where(eq(rooms.code, roomCode))
    .limit(1);

  if (!room || room.status !== "finished") {
    return { error: "Wyścig jeszcze się nie skończył" };
  }

  if (room.hostPlayerId !== playerId) {
    return { error: "Tylko host może zresetować lobby" };
  }

  const [player] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.roomId, room.id)))
    .limit(1);

  if (!player) {
    return { error: "Nie jesteś w tym pokoju" };
  }

  await db
    .update(rooms)
    .set({
      status: "waiting",
      raceText: null,
      startedAt: null,
      round: sql`${rooms.round} + 1`,
    })
    .where(eq(rooms.id, room.id));

  await db
    .update(players)
    .set({ isReady: false })
    .where(eq(players.roomId, room.id));

  await pusherServer.trigger(roomChannelName(roomCode), "race:restart", {});
};