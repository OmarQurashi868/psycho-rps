import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { customAlphabet } from "nanoid/async";
import { env } from "../../../env/server.mjs";
import { Events } from "../../../constants/events";

// const Pusher = require("pusher");
import Pusher from "pusher";

// TODO: Connect to database for announcing lobby status and limit players

export const gameRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  signup: publicProcedure
    .input(z.object({ name: z.string().max(32) }))
    .mutation(async ({ input }) => {
      const nanoid = customAlphabet("1234567890", 6);
      const roomId = await nanoid();
      return {
        roomId: roomId,
      };
    }),
  join: publicProcedure
    .input(
      z.object({
        name: z.string().max(32),
        roomId: z.string().length(6),
        currentPlayer: z.number().min(0).max(1),
      })
    )
    .mutation(async ({ input }) => {
      const pusher = new Pusher({
        appId: env.APP_ID,
        key: env.NEXT_PUBLIC_APP_KEY,
        secret: env.APP_SECRET,
        cluster: "eu",
        useTLS: true,
      });
      await pusher.trigger(input.roomId, Events.USER_JOIN, {
        name: input.name,
        playerNumber: input.currentPlayer,
      });
    }),
  play: publicProcedure
    .input(
      z.object({
        name: z.string().max(32),
        roomId: z.string().length(6),
        currentPlayer: z.number().min(0).max(1),
        play: z.enum(["rock", "paper", "scissors"]),
      })
    )
    .mutation(async ({ input }) => {
      const pusher = new Pusher({
        appId: env.APP_ID,
        key: env.NEXT_PUBLIC_APP_KEY,
        secret: env.APP_SECRET,
        cluster: "eu",
        useTLS: true,
      });
      await pusher.trigger(input.roomId, Events.USER_PLAY, {
        name: input.name,
        playerNumber: input.currentPlayer,
        play: input.play,
      });
    }),
});
