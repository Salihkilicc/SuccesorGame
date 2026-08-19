// src/core/story/record.test.ts
//
// ============================================================================
//  THE SCREEN AFTER THE ENDING
// ============================================================================
//
//  The ending is prose and the record is figures, and the whole design is that
//  they are two screens in that order. What is tested here is the second one:
//  that it reads as a record of a life rather than as a results table, and
//  that it cannot throw on the one screen in the game with nothing after it.
// ============================================================================

import { asTime, asFamily, buildRecord, endingsProgress, type RecordInput } from './record';

const run = (over: Partial<RecordInput> = {}): RecordInput => ({
    quarters: 40, age: 35, companyValue: 1_200_000_000, netWorth: 400_000_000,
    employees: 900, products: 4, subsidiaries: 2, children: 2,
    heirNamed: true, ...over,
});

describe('how long you were in the chair', () => {
    it('is quarters while that is still a number anybody can feel', () => {
        expect(asTime(1)).toBe('1 quarter');
        expect(asTime(3)).toBe('3 quarters');
    });

    it('and years once it is not', () => {
        // Sixty-two quarters is a number nobody can feel. Fifteen years and
        // two quarters is a life, and this is the row the screen is about.
        expect(asTime(4)).toBe('1 year');
        expect(asTime(8)).toBe('2 years');
        expect(asTime(62)).toBe('15 years, 2 quarters');
    });

    it('and it does not say "0 years" on the way past a boundary', () => {
        expect(asTime(5)).toBe('1 year, 1 quarter');
        expect(asTime(0)).toBe('0 quarters');
    });

    it('and a nonsense number does not reach the player', () => {
        // This screen runs in bankruptcy, removal and death. It cannot throw.
        expect(asTime(-4)).toBe('0 quarters');
        expect(asTime(4.9)).toBe('1 year');
    });
});

describe('the family row', () => {
    it('is one row, because the second half is only interesting next to the first', () => {
        // "Children: 0" then "Heir: none" is two lines of nothing.
        expect(asFamily(0, false)).toBe('None');
        expect(asFamily(0, true)).toBe('None');
    });

    it('and says whether anybody was ever chosen', () => {
        expect(asFamily(1, true)).toBe('1 child, one of them named');
        expect(asFamily(4, false)).toBe('4 children, none of them named');
    });
});

describe('the record itself', () => {
    it('is eight rows and every one of them is about the whole run', () => {
        // The guard against this becoming a stat dump. A row has to earn its
        // place; the quarterly report exists for everything else.
        expect(buildRecord(run())).toHaveLength(8);
    });

    it('opens with the time and closes with the family', () => {
        // Deliberate: time lands hardest, and the family is what the player
        // should still be thinking about on the new game screen.
        const rows = buildRecord(run());
        expect(rows[0].label).toBe('In the chair for');
        expect(rows[rows.length - 1].label).toBe('Family');
    });

    it('and formats money as money rather than as 11.382938', () => {
        const rows = buildRecord(run({ companyValue: 1_234_567_890 }));
        expect(rows.find(r => r.label === 'The company was worth')?.value)
            .toBe('$1.2B');
    });

    it('and survives a run where nothing happened', () => {
        const rows = buildRecord(run({
            quarters: 0, age: 0, companyValue: 0, netWorth: 0,
            employees: 0, products: 0, subsidiaries: 0, children: 0,
            heirNamed: false,
        }));
        expect(rows).toHaveLength(8);
        for (const row of rows) expect(row.value.length).toBeGreaterThan(0);
    });

    it('and has no duplicate labels, since they key the list', () => {
        const labels = buildRecord(run()).map(r => r.label);
        expect(new Set(labels).size).toBe(labels.length);
    });
});

// ============================================================================
//  AND THE ONE LINE THAT REACHES OUTSIDE THE RUN
// ============================================================================
describe('how many endings this person has found', () => {
    const all = ['soldToPear', 'removedByBoard', 'wentBankrupt'];

    it('counts what they have seen against what exists', () => {
        expect(endingsProgress([], all)).toBe('0 of 3 endings found');
        expect(endingsProgress(['wentBankrupt'], all)).toBe('1 of 3 endings found');
        expect(endingsProgress(all, all)).toBe('3 of 3 endings found');
    });

    it('and never reports more than there are', () => {
        // `endingsSeen` persists across every run and across versions. An id
        // from an ending that was renamed would otherwise read "4 of 3", on
        // the last screen of the game, for ever.
        expect(endingsProgress(['wentBankrupt', 'anOldName'], all))
            .toBe('1 of 3 endings found');
        expect(endingsProgress(['wentBankrupt', 'wentBankrupt'], all))
            .toBe('1 of 3 endings found');
    });
});
