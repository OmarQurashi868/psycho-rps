import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { customAlphabet } from "nanoid/async";
import { env } from "../../../env/server.mjs";
import { Events } from "../../../constants/events";

import Pusher from "pusher";

// TODO: delete games after 24hrs

export const gameRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  create: publicProcedure
    .input(
      z
        .object({ userId: z.string().nullish(), name: z.string().max(32) })
        .nullish()
    )
    .mutation(async ({ input, ctx: { prisma } }) => {
      const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);
      const gameId = await nanoid();

      // Create game row
      const createdGame = await prisma.game.create({
        data: {
          gameName: gameId,
        },
      });

      // Generate new userId if not exists

      // Find player row, create if none
      const userId = input?.userId ?? "";
      const userQuery = await prisma.player.findFirst({
        where: { id: userId },
      });

      let createdUser;
      if (!userQuery) {
        createdUser = await prisma.player.create({
          data: {
            name: input!.name,
            game: {
              connect: { id: createdGame.id },
            },
          },
        });
      } else {
        await prisma.player.update({
          where: { id: userId },
          data: {
            name: input?.name,
            score: 0,
            game: {
              connect: { id: createdGame.id },
            },
          },
        });
      }

      return {
        userId: createdUser?.id || undefined,
        gameId: gameId,
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
