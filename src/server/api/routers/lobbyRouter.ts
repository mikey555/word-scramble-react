import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { GameStartedMessageData } from "~/components/Types";
import { ablyChannelName } from "~/server/ably/ablyHelpers";
import { AblyMessageType } from "~/components/Types";
import shuffleArrayCopy from "~/components/helpers";
import { simplePlayerInfoSchema } from "~/components/Types";
import { MAX_NUM_PLAYERS_PER_ROOM, UNKNOWN_ERROR_MESSAGE } from "~/server/Constants";
import { isErrorWithMessage } from "~/server/Error";

export const lobbyRouter = createTRPCRouter({
  hostGame: publicProcedure
    .input(z.object({
      userId: z.string(),
      playerName: z.string(),
    }))
    .mutation(async (opts) => {
      const { redis } = opts.ctx;
      const { userId, playerName } = opts.input;
      const playerInfo = {
        userId: userId,
        playerName: playerName,
        isHost: true
      }
      let roomCode;
      try {
        roomCode = await redis.createRoom();
        await redis.createRoomInfo(roomCode, playerInfo);
      } catch (e) {
        throw new Error(UNKNOWN_ERROR_MESSAGE);
      }
      return {
        roomCode: roomCode,
      }
    }),
  joinGame: publicProcedure
    // TODO: map room codes to gameIds in redis hash
    .input(z.object({
      roomCode: z.string().optional(),
      userId: z.string(),
      playerName: z.string(),
    }))
    .mutation(async (opts) => {
      const { redis } = opts.ctx;
      const { roomCode, userId, playerName } = opts.input;
      if (roomCode == undefined) throw new Error(`Please enter a room code`);

      const isRoomCodeActive = await redis.isRoomCodeActive(roomCode);
      if (!isRoomCodeActive) throw new Error(`Room code ${roomCode} is not currently active`);

      // const hasGameStarted = await redis.isGameStarted(roomCode);

      if ((await redis.fetchRoomInfo(roomCode)).players.length >= MAX_NUM_PLAYERS_PER_ROOM)
        throw new Error(`Max. number of players per room is ${MAX_NUM_PLAYERS_PER_ROOM}`);

      try {
        await redis.addPlayer({
          userId: userId,
          playerName: playerName,
          isHost: false
        }, roomCode);
      } catch (e) {
        throw new Error(UNKNOWN_ERROR_MESSAGE);
      }
      return {
        roomCode: roomCode,
      }
    }),
  startGame: publicProcedure
    .input(z.object({
      userId: z.string(),
      roomCode: z.string(),
      players: simplePlayerInfoSchema.array(),
    }))
    .mutation(async (opts) => {
      const { redis, ably } = opts.ctx;
      const { players, roomCode, userId } = opts.input;
      const channelName = ablyChannelName(roomCode);
      const channel = ably.channels.get(channelName);
      try {
        const gameId = await redis.createGameId();
        const playersOrdered = shuffleArrayCopy(players);
        const game = await redis.createGameInfo(gameId, roomCode, playersOrdered);
        const gameStartedMsg: GameStartedMessageData = {
          dateTimePublished: Date.now(),
          messageType: AblyMessageType.GameStarted,
          initBoard: game.state.board,
          players: playersOrdered
        }
        await channel.publish(AblyMessageType.GameStarted, gameStartedMsg);
        return {};
      } catch (e) {
        throw new Error(UNKNOWN_ERROR_MESSAGE);
      }
    }),
  fetchGameInfo: publicProcedure
    .input(z.object({
      roomCode: z.string().length(4),
      userId: z.string().min(1),
    }))
    .query(async (opts) => {
      const { roomCode, userId } = opts.input;
      const { redis } = opts.ctx;
      try {
        return await redis.fetchGameInfo(roomCode, userId);
      } catch (e) {
        if (isErrorWithMessage(e) && e.message.includes('No game info associated with room')) {
          return null;
        }
        throw new Error(UNKNOWN_ERROR_MESSAGE);
      }
    }),
  fetchRoomInfo: publicProcedure
    .input(z.object({
      roomCode: z.string(),
    }))
    .query(async (opts) => {
      const { roomCode } = opts.input;
      const { redis } = opts.ctx;
      if (roomCode === '') throw new Error('gameId should not be empty string - check roomInfoQuery')
      return await redis.fetchRoomInfo(roomCode);
    }),
});


