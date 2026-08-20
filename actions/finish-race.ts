"use server";

import { and, asc, count, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db, isUniqueViolation } from "@/lib/db";
import { players, results, rooms } from "@/lib/db/schema";
import { roomChannelName } from "@/lib/pusher-channels";
import { pusherServer } from "@/lib/pusher-server";
import { CLOCK_SLACK_MS, MAX_PLAUSIBLE_WPM } from "@/lib/race";
import { normalizeRoomCode } from "@/lib/room-code";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FinishSnapshot = {
  durationMs: number;
  typedText: string;
};

export const finishRace = async (code: string, snapshot: FinishSnapshot) => {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId || !UUID_PATTERN.test(playerId)) {
    return { error: "Nie jesteś w tym pokoju" };
  }

  const roomCode = normalizeRoomCode(code);

  const [room] = await db
    .select({
      id: rooms.id,
      raceText: rooms.raceText,
      status: rooms.status,
      startedAt: rooms.startedAt,
    })
    .from(rooms)
    .where(eq(rooms.code, roomCode))
    .limit(1);

  if (!room || room.status !== "racing" || !room.raceText || !room.startedAt) {
    return { error: "Wyścig nie trwa" };
  }

  const [player] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.roomId, room.id)))
    .limit(1);

  if (!player) {
    return { error: "Nie jesteś w tym pokoju" };
  }

  const { raceText } = room;
  const { typedText } = snapshot;
  const durationMs = Math.round(snapshot.durationMs);

  if (typedText.length !== raceText.length) {
    return { error: "Nieprawidłowy wynik" };
  }

  const elapsedOnServer = Date.now() - room.startedAt.getTime();

  if (
    !Number.isFinite(durationMs) ||
    durationMs <= 0 ||
    durationMs > elapsedOnServer + CLOCK_SLACK_MS
  ) {
    return { error: "Nieprawidłowy czas" };
  }

  let correctChars = 0;

  for (let index = 0; index < raceText.length; index++) {
    if (typedText[index] === raceText[index]) correctChars++;
  }

  const wpm = Math.round(correctChars / 5 / (durationMs / 60000));
  const accuracy = Math.round((correctChars / raceText.length) * 100);

  if (wpm > MAX_PLAUSIBLE_WPM) {
    return { error: "Nieprawidłowy wynik" };
  }

  try {
    await db
      .insert(results)
      .values({ roomId: room.id, playerId, durationMs, wpm, accuracy });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Wynik już zapisany" };
    throw error;
  }

  await pusherServer.trigger(roomChannelName(roomCode), "player:finished", {
    playerId,
    wpm,
    accuracy,
    durationMs,
  });

  const [finishedCount] = await db
    .select({ value: count() })
    .from(results)
    .where(eq(results.roomId, room.id));

  const [playerCount] = await db
    .select({ value: count() })
    .from(players)
    .where(eq(players.roomId, room.id));

  if (finishedCount.value < playerCount.value) {
    return { wpm, accuracy };
  }

  const [ended] = await db
    .update(rooms)
    .set({ status: "finished" })
    .where(and(eq(rooms.id, room.id), eq(rooms.status, "racing")))
    .returning({ id: rooms.id });

  if (!ended) return { wpm, accuracy };

  const standings = await db
    .select({
      playerId: results.playerId,
      nick: players.nick,
      wpm: results.wpm,
      accuracy: results.accuracy,
      durationMs: results.durationMs,
    })
    .from(results)
    .innerJoin(players, eq(results.playerId, players.id))
    .where(eq(results.roomId, room.id))
    .orderBy(asc(results.durationMs));

  await pusherServer.trigger(roomChannelName(roomCode), "race:finished", {
    standings,
  });

  return { wpm, accuracy };
};
