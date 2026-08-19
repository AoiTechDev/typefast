"use server";

import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { normalizeRoomCode } from "@/lib/room-code";
import { eq } from "drizzle-orm";

export const getPlayerList = async (code: string) => {

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, normalizeRoomCode(code)),
    with: {
      players: {
        columns: {
          id: true,
          nick: true,
        },
      },
    },
  });

  return room?.players;
};
