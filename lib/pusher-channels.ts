import { normalizeRoomCode } from "./room-code";

export const roomChannelName = (code: string) =>
  `presence-room-${normalizeRoomCode(code)}`;
