import z from "zod";
export const createRoomSchema = z.object({
  nick: z.string().trim().min(2).max(16),
  maxPlayers: z.coerce.number().int().min(2).max(8),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;