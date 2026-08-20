"use server";
import { createRoomSchema } from "../validators/create-room-schema";
import { generateRoomCode } from "../lib/room-code";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { players, rooms } from "../lib/db/schema";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export type ActionState = {
  error?: string;
};
export const createRoom = async (
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  const parsedValues = createRoomSchema.safeParse(Object.fromEntries(formData));

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0].message };
  }
  const { nick, maxPlayers } = parsedValues.data;

  let room: { id: string; code: string };

  try {
    const roomCode = generateRoomCode();

    [room] = await db
      .insert(rooms)
      .values({ code: roomCode, maxPlayers })
      .returning({ id: rooms.id, code: rooms.code });

    const [player] = await db
      .insert(players)
      .values({ roomId: room.id, nick })
      .returning({ id: players.id });

    await db
      .update(rooms)
      .set({ hostPlayerId: player.id })
      .where(eq(rooms.id, room.id));

    const cookieStore = await cookies();
    cookieStore.set("playerId", player.id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 6,
      path: "/",
    });
  } catch (e) {
    console.error(e);
    return { error: "Nie udało się utworzyć pokoju" };
  }

  redirect(`/room/${room.code}`);

  return {};
};
