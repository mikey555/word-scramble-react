import {z} from "zod";
import {
    AblyMessageType,
    type BeginIntermissionMessageData,
    type WordSubmissionResponse
} from "~/components/Types";
import {ablyChannelName} from "~/server/ably/ablyHelpers";
import {createTRPCRouter, publicProcedure} from "../trpc";
import {getWordFromCellIds} from "~/lib/helpers.tsx";
import {MIN_WORD_LENGTH} from "~/components/Constants.tsx";

export const gameplayRouter = createTRPCRouter({

    submitWord: publicProcedure
        .input(z.object({
            userId: z.string().min(1),
            gameId: z.string().min(1),
            cellIds: z.number().array(),
            roomCode: z.string().min(1),
        }))
        .mutation(async (opts) => {
            const { roomCode, cellIds, userId } = opts.input;
            const { redis } = opts.ctx;

            const [game] = await Promise.all([redis.fetchGameInfo(roomCode, userId)]);
            const board = game.state.board;
            if (cellIds.length < MIN_WORD_LENGTH) throw new Error(`Word submitted with length < ${MIN_WORD_LENGTH}`);
            const { word, score } = getWordFromCellIds(cellIds, board);
            const isValid = await redis.isWordValid(word);
            return { wordSubmitted: word, score: score, cellIds: cellIds, isValid: isValid } satisfies WordSubmissionResponse;
        }),
    confirmWord: publicProcedure
        .input(z.object({
            userId: z.string().min(1),
            gameId: z.string().min(1),
            cellIds: z.number().array(),
            roomCode: z.string().min(1),
        }))
        .mutation(async (opts) => {
            const { userId, gameId, roomCode, cellIds } = opts.input;
            const { redis } = opts.ctx;

            const [game] = await Promise.all([redis.fetchGameInfo(roomCode, userId)]);
            const board = game.state.board;
            if (cellIds.length < MIN_WORD_LENGTH) throw new Error(`Word confirmed with length < ${MIN_WORD_LENGTH}`);
            const { word, score } = getWordFromCellIds(cellIds, board);

            // tell redis about confirmed word
            const players = await redis.getPlayers(roomCode);
            // TODO: put a lock on this resource
            const confirmedWords =
                await redis.addConfirmedWord(gameId, userId, word, cellIds, score, game.state.round);

            if (confirmedWords.length > players.length) {
                throw new Error(`Too many confirmed words for number of players: ${players.length} players, ${confirmedWords.length} confirmed words`);
            }

            // all players have confirmed
            return {
                areAllWordsConfirmed: confirmedWords.length === players.length,
                round: game.state.round,
                gameId: gameId
            };
        }),
    fetchGameInfo: publicProcedure
        .input(z.object({
            userId: z.string().min(1),
            roomCode: z.string().min(1),
        }))
        .query(async (opts) => {
            const { userId, roomCode } = opts.input;
            const { redis } = opts.ctx;
            return await redis.fetchGameInfo(roomCode, userId);
        }),
    triggerEndOfRoundAndPublishResults: publicProcedure
        .input(z.object({
            userId: z.string().min(1),
            roomCode: z.string().min(1),
            round: z.number(),
            gameId: z.string().min(1),
        }))
        .mutation(async (opts) => {
            const { userId, roomCode } = opts.input;
            const { redis, ably } = opts.ctx;
            const channelName = ablyChannelName(roomCode);
            const channel = ably.channels.get(channelName);
            // const [game] = await Promise.all([redis.fetchGameInfo(roomCode, userId)]);

            // will be undefined for all but one player
            const processEndOfRound = await redis.processEndOfRound(opts.input.round, roomCode, userId, opts.input.gameId);
            if (processEndOfRound != undefined) {
                const endOfRoundMsg: BeginIntermissionMessageData = {
                    dateTimePublished: Date.now(),
                    messageType: AblyMessageType.BeginIntermission,
                    state: processEndOfRound.state,
                    prevState: processEndOfRound.prevState,
                    words: processEndOfRound.confirmedWords,
                    scores: processEndOfRound.scores,
                    timeLastRoundOver: processEndOfRound.timeRoundOver,
                }
                await channel.publish(AblyMessageType.BeginIntermission, endOfRoundMsg);
                return {
                    success: true,
                };
            }
            return {
                success: false,
            };
        }),

})