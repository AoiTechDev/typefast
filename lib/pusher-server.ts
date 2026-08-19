import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.APP_ID!,
  key: process.env.NEXT_PUBLIC_KEY!,
  secret: process.env.SECRET!,
  cluster: process.env.NEXT_PUBLIC_CLUSTER!,
  useTLS: true,
});
