import { BoardConfiguration, BoardLetterDie } from "~/components/Types";
import shuffleArrayCopy, { shuffleString } from "~/components/helpers";

export type LetterDieSchema = {
    letters: string,
    id: number,
    numTimesRolled: number
}

export interface BoardSchema {
    dice: LetterDieSchema[]
}

export const BoggleDice: LetterDieSchema[] =
    [
        { letters: "AACIOT", id: 0, numTimesRolled: 0 },
        { letters: "ABILTY", id: 1, numTimesRolled: 0 },
        { letters: "ABJMOQ", id: 2, numTimesRolled: 0 },
        { letters: "ACDEMP", id: 3, numTimesRolled: 0 },
        { letters: "ACELRS", id: 4, numTimesRolled: 0 },
        { letters: "ADENVZ", id: 5, numTimesRolled: 0 },
        { letters: "AHMORS", id: 6, numTimesRolled: 0 },
        { letters: "BIFORX", id: 7, numTimesRolled: 0 },
        { letters: "DENOSW", id: 8, numTimesRolled: 0 },
        { letters: "DKNOTU", id: 9, numTimesRolled: 0 },
        { letters: "EEFHIY", id: 10, numTimesRolled: 0 },
        { letters: "EGKLUY", id: 11, numTimesRolled: 0 },
        { letters: "EGINTV", id: 12, numTimesRolled: 0 },
        { letters: "EHINPS", id: 13, numTimesRolled: 0 },
        { letters: "ELPSTU", id: 14, numTimesRolled: 0 },
        { letters: "GILRUW", id: 15, numTimesRolled: 0 },
    ]

export function rollAndShuffleDice(dice: LetterDieSchema[]): BoardConfiguration {
    const shuffledDice = shuffleArrayCopy<LetterDieSchema>(dice);
    let board: BoardConfiguration = [];
    shuffledDice.forEach((die, i) => {
        const boardLetterDie = {
            cellId: i,
            letterBlock: { letters: shuffleString(die.letters), id: die.id, numTimesRolled: die.numTimesRolled + 1 }
        } satisfies BoardLetterDie;
        board = [...board, boardLetterDie];
    });
    return board;
}

// TODO: should this roll dice by ID or position in array?
export function rollDice(board: BoardConfiguration, cellsToRoll?: number[]) {

    if (cellsToRoll != undefined) {
        board.filter(die => cellsToRoll.includes(die.cellId))
            .map(die => rollDie(die));
    } else {
        board.map(die => rollDie(die))
    }
    return board;
}

export function rollDie(die: BoardLetterDie) {
    die.letterBlock.letters = shuffleString(die.letterBlock.letters);
    die.letterBlock.numTimesRolled += 1;
}


export function toStoredDiceRoll(dice: string[]) {
    return dice.join(',');
}

export function toFaceUpValues(dice: LetterDieSchema[]) {
    let letters = '';
    dice.forEach((v, i) => {
        letters += dice[i]?.letters[0];
    })
    return letters;
}

