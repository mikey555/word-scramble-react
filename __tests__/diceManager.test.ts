import {it, describe, expect} from 'vitest';
import {BoggleDice, LetterDieSchema, rollAndShuffleDice, rollDice, rollDie,} from "~/server/diceManager.tsx";
import {BoardLetterDie} from "~/components/Types.tsx";



describe('rollAndShuffleDice', () => {
    it('increments roll count', () => {
        const result = rollAndShuffleDice(BoggleDice);
        expect(result.length).equal(BoggleDice.length);

        const numTimesRolledBefore = BoggleDice.map(x => x.numTimesRolled)
        const numTimesRolledAfter = result.map(x => x.letterBlock.numTimesRolled);
        expect(numTimesRolledBefore).to.be.deep.equal(new Array(16).fill(0));
        expect(numTimesRolledAfter).to.be.deep.equal(new Array(16).fill(1));
    });
});

describe('rollDie', () => {
    it('increments roll count', () => {
        const testLetterBlock: LetterDieSchema = {
            letters: "ASDFGH",
            id: 0,
            numTimesRolled: 0
        }
        const boardLetterDie: BoardLetterDie = {cellId: 0, letterBlock: testLetterBlock};
        const numTimesRolledBefore = boardLetterDie.letterBlock.numTimesRolled;
        rollDie(boardLetterDie);
        const numTimesRolledAfter = testLetterBlock.numTimesRolled;
        expect(numTimesRolledBefore).to.be.equal(0);
        expect(numTimesRolledAfter).to.be.equal(1);
    });
});

describe('rollDice', () => {
    it('rolls dice', () => {
        const board = rollAndShuffleDice(BoggleDice);
        const lettersBefore = board.map(l => l.letterBlock.letters);
        const result = rollDice(board);
        const lettersAfter = result.map(l => l.letterBlock.letters);
        expect(lettersBefore).to.be.not.deep.equal(lettersAfter);
    });
});

