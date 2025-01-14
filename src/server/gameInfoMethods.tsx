import {BoggleDice, rollAndShuffleDice} from "~/server/diceManager.tsx";
import type {GameInfo, Score} from "~/components/Types.tsx";
import {BAD_FOUR_LETTER_WORDS} from "~/server/Constants.tsx";

export function getGameInfoKey(roomCode: string) {
    return `room:${roomCode}:gameInfo`;
}

export function generateGameInfo(roomCode: string, playersOrdered: {
    userId: string;
    playerName: string
}[], gameId: string) {
    const key = getGameInfoKey(roomCode);
    const newBoard = rollAndShuffleDice(BoggleDice);
    const newScores: Score[] = playersOrdered.map(p => {
        return {userId: p.userId, score: 0};
    })
    const gameInfo = {
        state: {
            round: 0,
            board: newBoard,
            isGameFinished: false,
        },
        prevState: null,
        scores: newScores,
        words: undefined,
        gameId: gameId,
        roomCode: roomCode,
        dateTimeStarted: Date.now(),
        timeLastRoundOver: null
    } satisfies GameInfo;
    return {key, gameInfo};
}

export function generateRoomCode(length = 4): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (BAD_FOUR_LETTER_WORDS.find(w => w === result)) {
        return generateRoomCode(length);
    }
    return result;
}