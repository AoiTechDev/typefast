import z from "zod";
export const joinRoomSchema = z.object({
  nick: z.string().trim().min(2).max(16),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;