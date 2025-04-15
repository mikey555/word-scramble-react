import {env} from "~/env.mjs";

export const MIN_WORD_LENGTH = env.NEXT_PUBLIC_MIN_WORD_LENGTH;
export const NUM_ROUNDS_PER_GAME = env.NEXT_PUBLIC_NUM_ROUNDS_PER_GAME;
export const ROLL_CHANGE_COLOR = 'lightgreen';
export const CELL_CHANGE_COLOR = 'gold';
export const IN_PROGRESS_COLOR = 'grey';
export const VALID_COLOR = '#28D239';
export const INVALID_COLOR = '#ff3737';
export const CONFIRMED_COLOR = 'green';
export const ROUND_DURATION = env.NEXT_PUBLIC_ROUND_DURATION;
export const INTERMISSION_DURATION = env.NEXT_PUBLIC_INTERMISSION_DURATION;
export const VERCEL_URL = env.NEXT_PUBLIC_VERCEL_URL;
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;