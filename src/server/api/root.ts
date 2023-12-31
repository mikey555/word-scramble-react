import { lobbyRouter } from "~/server/api/routers/lobbyRouter";
import { createTRPCRouter } from "~/server/api/trpc";
import { gameplayRouter } from "~/server/api/routers/gameplayRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  lobby: lobbyRouter,
  gameplay: gameplayRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
