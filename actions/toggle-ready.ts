"use server";

import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { pickRaceText } from "@/lib/dummy-text";
import { roomChannelName } from "@/lib/pusher-channels";
import { COUNTDOWN_MS } from "@/lib/race";
import { pusherServer } from "@/lib/pusher-server";
import { normalizeRoomCode } from "@/lib/room-code";
import { and, eq, inArray, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export const toggleReady = async (code: string) => {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId) return { error: "Nie jesteś w tym pokoju" };
  const [updated] = await db
    .update(players)
    .set({ isReady: not(players.isReady) })
    .where(
      and(
        eq(players.id, playerId),
        inArray(
          players.roomId,
          db
            .select({ id: rooms.id })
            .from(rooms)
            .where(and(eq(rooms.code, code), eq(rooms.status, "waiting"))),
        ),
      ),
    )
    .returning({ isReady: players.isReady });

  if (!updated) return { error: "Nie można zmienić gotowości" };

  await pusherServer.trigger(roomChannelName(code), "player:ready", {
    playerId,
    isReady: updated.isReady,
  });

  const roomPlayers = await db
    .select({ isReady: players.isReady })
    .from(players)
    .innerJoin(rooms, eq(players.roomId, rooms.id))
    .where(eq(rooms.code, normalizeRoomCode(code)));

  const everyoneReady =
    roomPlayers.length >= 2 && roomPlayers.every((player) => player.isReady);

  if (everyoneReady) {
    const [started] = await db
      .update(rooms)
      .set({
        status: "racing",
        raceText: pickRaceText(),
        startedAt: new Date(Date.now() + COUNTDOWN_MS),
      })
      .where(
        and(
          eq(rooms.code, normalizeRoomCode(code)),
          eq(rooms.status, "waiting"),
        ),
      )
      .returning({ raceText: rooms.raceText });

    if (!started) return { isReady: true };

    await pusherServer.trigger(roomChannelName(code), "race:start", {
      raceText: started.raceText,
      countdownMs: COUNTDOWN_MS,
    });
  }
  return { isReady: updated.isReady };
};
