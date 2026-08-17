"use server";

import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const getHostId = async (code: string) => {
  const [room] = await db
    .select({ hostPlayerId: rooms.hostPlayerId })
    .from(rooms)
    .where(eq(rooms.code, code))
    .limit(1);

  return room?.hostPlayerId ?? null;
};
