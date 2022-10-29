// src/server/router/_app.ts
import { router } from "../trpc";

import { gameRouter } from "./gameRouter";

export const appRouter = router({
  gameRouter: gameRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
