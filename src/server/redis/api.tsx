import type {VercelKV} from "@vercel/kv";
import type {createClient} from "redis";
import {
    type ConfirmedWord,
    confirmedWordsSchema,
    type GameInfo,
    gameInfoSchema,
    type GameInfoUpdate,
    type PlayerInfo,
    type RoomInfo,
    roomInfoSchema,
    type Score
} from "~/components/Types";
import {uniqueId} from "~/utils/helpers";
import {rollDice} from "../diceManager";
import advanceGameState from "~/server/api/gameState.tsx";
import _ from "lodash";
import Redlock, {ResourceLockedError} from "redlock";
import type Redis from "ioredis";
import {generateGameInfo, generateRoomCode, getGameInfoKey} from "~/server/gameInfoMethods.tsx";

const RedisObjects = {
    ActiveRoomsSet: 'ActiveRoomsSet',
    GamesPlayedSet: 'GamesPlayedSet',
    Dictionary: 'dict'

}

export type LocalRedis = ReturnType<typeof createClient>;
export type BoggleRedisType = LocalRedis | VercelKV;

function getRoomInfoKey(roomCode: string) {
    return `room:${roomCode}`;
}

function getRedlock(client: Redis) {
    return new Redlock(
        [client],
        {
            // The expected clock drift; for more details see:
            // http://redis.io/topics/distlock
            driftFactor: 0.01, // multiplied by lock ttl to determine drift time

            // The max number of times Redlock will attempt to lock a resource
            // before erroring.
            retryCount: 10,

            // the time in ms between attempts
            retryDelay: 200, // time in ms

            // the max time in ms randomly added to retries
            // to improve performance under high contention
            // see https://www.awsarchitectureblog.com/2015/03/backoff.html
            retryJitter: 200, // time in ms

            // The minimum remaining time on a lock before an extension is automatically
            // attempted with the `using` API.
            automaticExtensionThreshold: 500, // time in ms
        }
    );
}

export class RedisBoggleCommands {
    redis: Redis;

    constructor(redis: Redis) {//, redisKv?: VercelKV, redisLocal?: LocalRedis) {
        this.redis = redis;
    }

    async createGameInfo(gameId: string, roomCode: string, playersOrdered: { userId: string, playerName: string }[]) {
        const {key, gameInfo} = generateGameInfo(roomCode, playersOrdered, gameId);
        const gameAdded = await this.redis.call("JSON.SET", key, '$', JSON.stringify(gameInfo));
        if (!gameAdded) throw new Error(`Game ${gameId} failed to initialize`);
        return gameInfo;
    }

    async updateGameInfo(gameId: string, roomCode: string, gameInfoUpdate: GameInfoUpdate, userId: string, game?: GameInfo) {
        const key = getGameInfoKey(roomCode);
        const get = game != undefined ? game : await this.fetchGameInfo(roomCode, userId);
        const info: GameInfo = {
            ...get,
            ...gameInfoUpdate
        };
        const set = await this.redis.call("JSON.SET", key, '$', JSON.stringify({...info}));
        if (set == null) throw new Error(`gameInfo failed to set for gameId: ${gameId}`);
        return info;
    }

    async fetchGameInfo(roomCode: string, userId: string) {
        if (roomCode.length != 4) throw new Error('roomCode.length != 4')
        const players = await this.getPlayers(roomCode);
        if (!players.some(p => p.userId === userId)) throw new Error(`userId ${userId} not part of room ${roomCode}`);
        const key = getGameInfoKey(roomCode);
        const gameInfo = await this.redis.call("JSON.GET", key);
        if (gameInfo === null) throw new Error(`No game info associated with room: ${roomCode}`);
        if (typeof gameInfo !== 'string') throw new Error('gameInfo is not a string');
        const result = gameInfoSchema.safeParse(JSON.parse(gameInfo));
        if (!result.success) {
            throw new Error(result.error.toString());
        } else {
            return result.data;
        }
    }

    async createGameId() {
        let gameId: string | undefined;
        while (gameId == undefined) {
            const newGameId = uniqueId('game');
            const gameAdded = await this.redis.sadd(RedisObjects.GamesPlayedSet, newGameId);
            if (gameAdded) gameId = newGameId;
        }
        return gameId;
    }

    async createRoom() {
        let roomCode: string | undefined;
        while (roomCode == undefined) {
            roomCode = generateRoomCode(4);
            const roomCodeActive = await this.isRoomCodeActive(roomCode);
            if (roomCodeActive) continue;

            const roomCodeActiveAdded = await this.redis.sadd(RedisObjects.ActiveRoomsSet, roomCode);
            if (roomCodeActiveAdded == null) throw new Error('room code not added to ActiveRoomsSet')
        }
        return roomCode;
    }

    async createRoomInfo(roomCode: string, player: PlayerInfo) {
        // init players
        const key = getRoomInfoKey(roomCode);
        const players = [player];
        const roomInfo = {
            players: players,
            activeGameId: undefined,
            roomCode: roomCode
        } satisfies RoomInfo;
        let setRoomInfo;
        try {
            setRoomInfo = await this.redis.call('json.set', key, '$', JSON.stringify(roomInfo));
        } catch (e) {
            console.error(e)
        }
        if (setRoomInfo == null) throw new Error(`Room info not set for ${roomCode}`);
        return roomInfo;
    }

    async fetchRoomInfo(roomCode: string) {
        const key = getRoomInfoKey(roomCode);
        const result = await this.redis.call('JSON.GET', key);
        if (result == null) throw new Error(`Cannot find roomInfo for room ${roomCode}`);
        if (typeof result !== 'string') {
            throw new Error('roomInfo is not a string')
        }
        const roomInfo = roomInfoSchema.safeParse(JSON.parse(result));
        if (!roomInfo.success) {
            throw new Error(roomInfo.error.toString());
        } else {
            return roomInfo.data;
        }
    }

    async addPlayer(playerInfo: PlayerInfo, roomCode: string) {
        const key = getRoomInfoKey(roomCode);
        const errorStr = `Player ${playerInfo.userId} (${playerInfo.playerName}) not added to room: ${roomCode}`;
        const setPlayerInfo = await this.redis.call('json.arrAppend', key, '$.players', JSON.stringify(playerInfo));
        if (setPlayerInfo == null) throw new Error(errorStr);
    }

    async getPlayers(roomCode: string) {
        const roomInfo = await this.fetchRoomInfo(roomCode);
        const playerInfos = roomInfo.players;
        if (playerInfos == null) throw new Error(`No player infos found for room code: ${roomCode}`);
        return playerInfos;
    }

    async addConfirmedWord(gameId: string, userId: string, word: string, sourceCellIds: number[], score: number,
                           round: number) {
        const key = `game:${gameId}:round:${round}:words`;
        const confirmedWord: ConfirmedWord = {
            userId: userId,
            word: word,
            score: score,
            sourceCellIds: sourceCellIds,
        };
        const confirmedWords = await this.getConfirmedWords(key);
        if (confirmedWords.some(x => x.userId === userId)) {
            throw new Error(`User ${userId} already has confirmed word in gameId ${gameId}`);
        }
        confirmedWords.push(confirmedWord);
        const set = await this.redis.call('json.set', key, '$', JSON.stringify(confirmedWords));
        if (set == null) throw new Error(`Failed to set: ${word}, ${key}`);
        return confirmedWords;
    }

    async getConfirmedWords(key: string) {
        const confirmedWords = await this.redis.call('json.get', key);
        console.log(`confirmedWords: ${JSON.stringify(confirmedWords)}`);
        if (confirmedWords == null) return [];
        if (typeof confirmedWords !== 'string' ) throw new Error(`${key} is not a string`);
        const result = confirmedWordsSchema.safeParse(JSON.parse(confirmedWords));
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error.toString());
        }
    }

    // all players call this on end of round, but only one request will update game and send message
    async processEndOfRound(round: number, roomCode: string, userId: string, gameId: string) {
        const redlock = getRedlock(this.redis);

        redlock.on("error", (error) => {
            // Ignore cases where a resource is explicitly marked as locked on a client.
            if (error instanceof ResourceLockedError) {
                return;
            }
            // Log all other errors.
            console.error(error);
        });

        const confirmedWordsKey = `game:${gameId}:round:${round}:words`;
        const gameInfoKey = getGameInfoKey(roomCode);
        const confirmedWordsResourceKey = `redlock:${confirmedWordsKey}`;
        const gameInfoResourceKey = `redlock:${gameInfoKey}`;

        return await redlock.using([confirmedWordsResourceKey, gameInfoResourceKey], 5000, async (signal) => {
            console.log('acquired lock')
            const confirmedWords = await this.getConfirmedWords(confirmedWordsKey);
            if (signal.aborted) throw signal.error;
            console.log('got confirmed words')
            const game = await this.fetchGameInfo(roomCode, userId);

            if (game.state.round !== round || game.state.isGameFinished) {
                // game state has already been advanced
                console.log('game state has already been advanced')
                return;
            }

            const updatedScores = game.scores.map((score) => {
                const word = confirmedWords.find(word => word.userId === score.userId);
                if (word != undefined) {
                    return {
                        ...score,
                        score: score.score += word.score,
                    } satisfies Score;
                } else {
                    return score;
                }
            });
            game.prevState = _.cloneDeep(game.state); // TODO: need to clone
            game.state.board = rollDice(game.state.board);
            advanceGameState(game.state);
            const gameInfoUpdate: GameInfoUpdate = {
                prevState: game.prevState,
                state: game.state,
                scores: updatedScores,
                timeLastRoundOver: Date.now(),
            }
            const updatedGameInfo = await this.updateGameInfo(game.gameId, roomCode, gameInfoUpdate, userId, game);
            if (signal.aborted) throw signal.error;
            console.log('updated gameInfo')

            if (updatedGameInfo.timeLastRoundOver == null) throw new Error('timeLastRoundOver not set in updatedGameInfo');
            if (updatedGameInfo.prevState == null) throw new Error('prevState not set in gameInfo from BeginIntermission message');
            return {
                state: updatedGameInfo.state,
                prevState: updatedGameInfo.prevState,
                confirmedWords: confirmedWords,
                scores: updatedGameInfo.scores,
                timeRoundOver: updatedGameInfo.timeLastRoundOver,
            };
        });
    }

    async isRoomCodeActive(roomCode: string) {
        try {
            return await this.redis.sismember(RedisObjects.ActiveRoomsSet, roomCode);
        } catch (e) {
            console.error(e);
        }
    }

    async isWordValid(word: string) {
        const isValid = await this.redis.sismember(RedisObjects.Dictionary, word);
        return isValid === 1;
    }

}


