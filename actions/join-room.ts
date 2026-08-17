"use server";

import { db } from "@/lib/db";
import { players, rooms } from "@/lib/db/schema";
import { joinRoomSchema } from "@/validators/join-room-schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ActionState = {
  error?: string;
};
export const joinRoom = async (
    code: string,
  prevState: ActionState,
 
  formData: FormData,
): Promise<ActionState> => {
  const parsedValues = joinRoomSchema.safeParse(Object.fromEntries(formData));

  if (!parsedValues.success) {
    return { error: parsedValues.error.issues[0].message };
  }

  const { nick } = parsedValues.data;
  let room: { id: string; code: string };

  try {
    [room] = await db
      .select({ id: rooms.id, code: rooms.code })
      .from(rooms)
      .where(eq(rooms.code, code))
      .limit(1);

    const [player] = await db
      .insert(players)
      .values({ roomId: room.id, nick })
      .returning({ id: players.id });
    const cookieStore = await cookies();
    cookieStore.set("playerId", player.id, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 6,
      path: "/",
    });
  } catch (e) {
    console.error(e);
    return { error: "nie udalo sie dolaczcy" };
  }

  redirect(`/room/${room.code}`);

  return {};
};
