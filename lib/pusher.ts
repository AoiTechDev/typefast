import PusherServer from "pusher";
import PusherClient from "pusher-js";
export const pusherServer = new PusherServer({
  appId: process.env.APP_ID!,
  key: process.env.NEXT_PUBLIC_KEY!,
  secret: process.env.SECRET!,
  cluster: process.env.NEXT_PUBLIC_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_KEY!, {
  cluster: process.env.NEXT_PUBLIC_CLUSTER!,
  //   authEndpoint: "/api/pusher-auth",
  //   authTransport: "ajax",
  //   auth: {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   },
});
