import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { customAlphabet } from "nanoid/async";
import { env } from "../../../env/server.mjs";
import { Events } from "../../../constants/events";

import Pusher from "pusher";

// TODO: Delete games after 24hrs
import { prisma as ctxPrisma } from "../../db/client";
import { TRPCError } from "@trpc/server";

// New user function
const upsertNewUser = async (
  name: string,
  gameId: string | undefined,
  specGameId: string | undefined,
  userId?: string
) => {
  let res;
  if (userId) {
    const userQuery = await ctxPrisma.player.findFirst({
      where: { id: userId },
    });
    if (userQuery) {
      res = await ctxPrisma.player.update({
        where: { id: userId },
        data: {
          name: userQuery.name,
          score: userQuery.lastGameId == gameId ? userQuery.score : 0,
          lastGameId: gameId,
          game: gameId
            ? {
                connect: { id: gameId },
              }
            : undefined,
          specGame: specGameId ? { connect: { id: specGameId } } : undefined,
        },
      });
    } else {
      res = await ctxPrisma.player.create({
        data: {
          name: name,
          game: gameId
            ? {
                connect: { id: gameId },
              }
            : undefined,
          specGame: specGameId ? { connect: { id: specGameId } } : undefined,
        },
      });
    }
  } else {
    res = await ctxPrisma.player.create({
      data: {
        name: name,
        game: gameId
          ? {
              connect: { id: gameId },
            }
          : undefined,
        specGame: specGameId ? { connect: { id: specGameId } } : undefined,
      },
    });
  }
  return res;
};

export const gameRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(({ input }) => {
      return {
        greeting: `Hello ${input?.text ?? "world"}`,
      };
    }),
  // Get game info route
  getInfo: publicProcedure
    .input(z.object({ gameId: z.string().length(4) }))
    .mutation(async ({ input, ctx: { prisma } }) => {
      const getDateXDaysAgo = (numOfDays: number, date = new Date()) => {
        const daysAgo = new Date(date.getTime());

        daysAgo.setDate(date.getDate() - numOfDays);

        return daysAgo;
      };
      await prisma.game.deleteMany({
        where: { creationDate: { lte: getDateXDaysAgo(1) } },
      });

      const query = await prisma.game.findFirst({
        where: { gameName: input.gameId },
        include: { players: true, spectators: true },
      });
      if (!query) {
        // Return 404
        throw new TRPCError({ message: "Game not found", code: "NOT_FOUND" });
      } else {
        return query;
      }
    }),
  createGame: publicProcedure
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

      // Find player row, create if none
      const userId: string = input?.userId ?? "";
      const userQuery = await prisma.player.findFirst({
        where: { id: userId },
      });

      const dbUser = await upsertNewUser(
        input?.name!,
        createdGame.id,
        undefined,
        userId
      );

      return {
        userId: dbUser?.id,
        gameId: gameId,
      };
    }),
  // Joining game route
  join: publicProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
        name: z.string().max(32),
        gameId: z.string().length(4),
      })
    )
    .mutation(async ({ input, ctx: { prisma } }) => {
      const pusher = new Pusher({
        appId: env.APP_ID,
        key: env.NEXT_PUBLIC_APP_KEY,
        secret: env.APP_SECRET,
        cluster: "eu",
        useTLS: true,
      });

      // Find player row, create if none
      const userId = input?.userId ?? "";
      const gameQuery = await prisma.game.findFirst({
        where: { id: input.gameId },
        include: { players: true, spectators: true },
      });

      let dbUser;
      if (gameQuery) {
        dbUser = await upsertNewUser(
          input.name,
          gameQuery.players.length < 2 ? input.gameId : undefined,
          gameQuery.players.length >= 2 ? input.gameId : undefined,
          userId
        );
      } else {
        // Return 404
        throw new TRPCError({ message: "Game not found", code: "NOT_FOUND" });
      }

      // Push join event
      await pusher.trigger(input.gameId, Events.USER_JOIN, {
        userId: dbUser?.id,
        name: input.name,
      });
    }),
  // Send play route
  play: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().max(32),
        gameId: z.string().length(4),
        isPlaying: z.number().min(0).max(1),
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
      await pusher.trigger(input.gameId, Events.USER_PLAY, {
        name: input.name,
        playerNumber: input.isPlaying,
        play: input.play,
      });
    }),
});
