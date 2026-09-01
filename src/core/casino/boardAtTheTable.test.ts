// src/core/casino/boardAtTheTable.test.ts
//
// ============================================================================
//  MEETING ONE OF YOUR OWN DIRECTORS ACROSS A POKER TABLE
// ============================================================================
//
//  I reported this as possibly dead and I was wrong, which is worth writing
//  down rather than quietly correcting.
//
//  The measurement that raised the alarm ran in a bare jest process, where the
//  shareholder store has never been initialised and `members` is an empty
//  array. `boardOpponents()` returned nothing, twenty thousand tables produced
//  zero directors, and it looked exactly like a rule nothing feeds.
//
//  In a real game `initializeGame(true)` runs from core/newGame.ts and the
//  store is persisted, so the board is there. Measured again with the store
//  initialised, which is the state the player is actually in:
//
//      directors in the register            5
//      city tables with one of them     29.9%   (designed: 29.4%)
//
//  It works. The lesson is about the MEASUREMENT rather than the code: an
//  engine function that reaches into a store through `require` behaves
//  differently depending on who booted the app, and a number taken without
//  that setup is not evidence of anything. This file does the setup, so the
//  rule is finally measured in the condition it runs in.
//
//  ---------------------------------------------------------------------------
//  AND THE RATE DISAGREES WITH ITS OWN DESCRIPTION
//  ---------------------------------------------------------------------------
//  CITY_BOARD_CHANCE carries this note:
//
//      "Rarer than a rival, because it is a stranger thing to walk into.
//       Meeting the man who controls seventeen per cent of your company
//       across a poker table is not a coincidence you want twice a year."
//
//  One in twelve per seat across four seats is 29.4% of tables. That is not
//  twice a year, it is nearly every third visit - about three times what the
//  comment describes. The tests below pin the rule as BUILT; whether the rate
//  should be built differently is a question for the person whose game it is,
//  and it is asked rather than answered here.
// ============================================================================

import {
    CITY_BOARD_CHANCE, CITY_CEO_CHANCE, TABLE_SEATS, boardOpponents, seatTable,
} from './pokerTable';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';

/** The state a player is actually in. Without this the register is empty. */
beforeAll(() => {
    useShareholderStore.getState().initializeGame(true);
});

const share = (n: number, chance: number) =>
    1 - Math.pow(1 - chance, n);

describe('the register really does reach the poker table', () => {
    it('the directors are there once the game has been started', () => {
        // THE THING I GOT WRONG. Empty in a bare process, full in a game.
        const board = boardOpponents();
        expect(board.length).toBeGreaterThan(0);
        for (const o of board) {
            expect(o.kind).toBe('board');
            expect(typeof o.name).toBe('string');
            expect(o.name.length).toBeGreaterThan(0);
        }
    });

    it('and they are the same people who sit on your board', () => {
        const names = new Set(useShareholderStore.getState().members.map(m => m.name));
        for (const o of boardOpponents()) expect(names.has(o.name)).toBe(true);
    });

    it('and one of them turns up at about the designed rate', () => {
        // Which is the assertion that would have caught a genuinely dead rule,
        // and did not exist until now. That is why nobody noticed either the
        // silence or the rate.
        let withBoard = 0;
        const N = 20_000;
        for (let i = 0; i < N; i++) {
            if (seatTable(false).some(o => o.kind === 'board')) withBoard++;
        }
        const seen = withBoard / N;
        const expected = share(TABLE_SEATS - 1, CITY_BOARD_CHANCE);
        expect(Math.abs(seen - expected)).toBeLessThan(0.02);
    });

    it('and a director is rarer than a rival, which is the design', () => {
        expect(CITY_BOARD_CHANCE).toBeLessThan(CITY_CEO_CHANCE);
        expect(share(TABLE_SEATS - 1, CITY_BOARD_CHANCE))
            .toBeLessThan(share(TABLE_SEATS - 1, CITY_CEO_CHANCE));
    });

    it('and the VIP room has none of them, because it is all rivals', () => {
        for (let i = 0; i < 500; i++) {
            for (const o of seatTable(true)) expect(o.kind).not.toBe('board');
        }
    });

    it('and a director never appears twice at one table', () => {
        for (let i = 0; i < 5_000; i++) {
            const t = seatTable(false);
            expect(new Set(t.map(o => o.id)).size).toBe(t.length);
        }
    });
});

describe('and an empty register degrades quietly rather than breaking', () => {
    it('the seat falls back to a stranger', () => {
        // Which is correct behaviour and is also what hid the false alarm:
        // there is no hole in the table and no error, so a dead rule looks
        // exactly like a rule that simply did not fire this time.
        const before = useShareholderStore.getState().members;
        useShareholderStore.setState({ members: [] });
        try {
            for (let i = 0; i < 2_000; i++) {
                const t = seatTable(false);
                expect(t).toHaveLength(TABLE_SEATS - 1);
                for (const o of t) expect(o.kind).not.toBe('board');
            }
        } finally {
            useShareholderStore.setState({ members: before });
        }
    });
});
