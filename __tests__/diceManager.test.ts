import {it, describe, expect} from 'vitest';
import {BoggleDice, rollAndShuffleDice} from "~/server/diceManager.tsx";

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

