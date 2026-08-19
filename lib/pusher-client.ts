import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_KEY!, {
  cluster: process.env.NEXT_PUBLIC_CLUSTER!,
  authEndpoint: "/api/pusher-auth",
});

export const roomChannelName = (code: string) => `presence-room-${code}`;
