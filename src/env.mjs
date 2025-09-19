import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    ABLY_API_KEY: z.string().min(1),
    VERCEL_ENV: z.enum(["development", "preview", "production"]),
    MIN_WORD_LENGTH: z.coerce.number().min(1),
    KV_URL: z.string().min(5),
    KV_URL_DEV: z.string().min(5),
    KV_URL_PREVIEW: z.string().min(5),
    KV_URL_PROD: z.string().min(5),
    UPSTASH_REDIS_REST_URL: z.string().min(5),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(5),
    UPSTASH_REDIS_HOST: z.string().min(5),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
    NEXT_PUBLIC_NUM_ROUNDS_PER_GAME: z.coerce.number().min(1),
    NEXT_PUBLIC_MIN_WORD_LENGTH: z.coerce.number().min(1),
    NEXT_PUBLIC_MAX_NUM_PLAYERS_PER_ROOM: z.coerce.number().min(1),
    NEXT_PUBLIC_ROUND_DURATION: z.coerce.number().min(1),
    NEXT_PUBLIC_INTERMISSION_DURATION: z.coerce.number().min(1),
    NEXT_PUBLIC_VERCEL_URL: z.coerce.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.coerce.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    ABLY_API_KEY: process.env.ABLY_API_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV,
    MIN_WORD_LENGTH: process.env.NEXT_PUBLIC_MIN_WORD_LENGTH,
    KV_URL: process.env.KV_URL,
    KV_URL_DEV: process.env.KV_URL_DEV,
    KV_URL_PREVIEW: process.env.KV_URL_PREVIEW,
    KV_URL_PROD: process.env.KV_URL_PROD,
    NEXT_PUBLIC_NUM_ROUNDS_PER_GAME: process.env.NEXT_PUBLIC_NUM_ROUNDS_PER_GAME,
    NEXT_PUBLIC_MIN_WORD_LENGTH: process.env.NEXT_PUBLIC_MIN_WORD_LENGTH,
    NEXT_PUBLIC_MAX_NUM_PLAYERS_PER_ROOM: process.env.NEXT_PUBLIC_MAX_NUM_PLAYERS_PER_ROOM,
    NEXT_PUBLIC_ROUND_DURATION: process.env.NEXT_PUBLIC_ROUND_DURATION,
    NEXT_PUBLIC_INTERMISSION_DURATION: process.env.NEXT_PUBLIC_INTERMISSION_DURATION,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_HOST: process.env.UPSTASH_REDIS_HOST,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
