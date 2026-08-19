// src/core/story/inheritance.test.ts
//
// ============================================================================
//  DIVIDING AN ESTATE, TWICE, DIFFERENTLY
// ============================================================================
//
//  Two kinds of test in here and the second kind is the one that matters.
//
//  The first kind is arithmetic: nothing is created, nothing evaporates, and
//  the share register still balances after four generations of splitting. That
//  sounds like paranoia until you notice that rounding each slice
//  independently loses a share every time three people split a hundred, and
//  that nothing anywhere would ever report it.
//
//  The second kind is the design: the heir is favoured in STOCK and not in
//  CASH, and a sibling can still vote. Those are decisions rather than
//  consequences, and a decision that is not asserted is a decision that gets
//  quietly reversed by somebody tidying up.
// ============================================================================

import {
    divideEstate,
    familyHolding,
    SPOUSE_CASH_SHARE,
    HEIR_STOCK_SHARE,
    type Bequest,
    type Survivor,
} from './inheritance';

const child = (id: string): Survivor => ({ id, kind: 'child' });
const spouse = (id = 'widow'): Survivor => ({ id, kind: 'spouse' });

const estate = { cash: 1_000_000, shares: 6_500_000 };

const totalCash = (bs: Bequest[]) => bs.reduce((a, b) => a + b.cash, 0);
const totalShares = (bs: Bequest[]) => bs.reduce((a, b) => a + b.shares, 0);
const by = (bs: Bequest[], id: string): Bequest => bs.find(b => b.id === id)!;

describe('nothing is created and nothing evaporates', () => {
    it('the cash adds back up', () => {
        const out = divideEstate(estate, [child('a'), child('b'), child('c'), spouse()], 'a');
        expect(totalCash(out)).toBeCloseTo(estate.cash, 6);
    });

    it('and so does the register, to the share', () => {
        // Three people splitting a hundred get 33 each and one share
        // disappears, every generation, and nothing would ever report it.
        for (const n of [1, 2, 3, 7, 11]) {
            const kids = Array.from({ length: n }, (_, i) => child(`c${i}`));
            const out = divideEstate({ cash: 100, shares: 6_500_001 }, kids, 'c0');
            expect(totalShares(out)).toBe(6_500_001);
        }
    });

    it('and nobody owns two fifths of a share', () => {
        const out = divideEstate({ cash: 0, shares: 101 }, [child('a'), child('b'), child('c')], 'a');
        for (const b of out) expect(Number.isInteger(b.shares)).toBe(true);
    });

    it('and an empty estate divides into nothing rather than into NaN', () => {
        const out = divideEstate({ cash: 0, shares: 0 }, [child('a'), spouse()], 'a');
        expect(totalCash(out)).toBe(0);
        expect(totalShares(out)).toBe(0);
    });
});

// ============================================================================
//  THE DECISION
// ============================================================================
describe('the heir is favoured in stock', () => {
    const out = divideEstate(estate, [child('a'), child('b'), child('c')], 'a');

    it('and takes most of the family holding', () => {
        expect(by(out, 'a').shares).toBeCloseTo(estate.shares * HEIR_STOCK_SHARE, -1);
        expect(by(out, 'a').kind).toBe('heir');
    });

    it('while the others split what is left between them', () => {
        expect(by(out, 'b').shares).toBe(by(out, 'c').shares);
        expect(by(out, 'b').shares).toBeLessThan(by(out, 'a').shares);
    });

    it('but they are not decoration', () => {
        // The payoff for twenty years of messages about the annual report:
        // the passed over sibling arrives at the first board meeting with a
        // vote in their hand. An heir who inherits the whole holding makes
        // every one of those scenes retroactively pointless.
        expect(by(out, 'b').shares).toBeGreaterThan(0);
    });

    it('and takes it all when there is nobody to share with', () => {
        const only = divideEstate(estate, [child('a')], 'a');
        expect(by(only, 'a').shares).toBe(estate.shares);
    });
});

describe('and NOT in cash', () => {
    it('every child gets the same, the heir included', () => {
        // The whole split. The others get paid, the heir gets control, and
        // the two currencies say different things. Favouring the heir twice
        // would make the succession screen a button marked "give this one
        // more of everything".
        const out = divideEstate(estate, [child('a'), child('b'), child('c')], 'a');
        expect(by(out, 'a').cash).toBeCloseTo(by(out, 'b').cash, 6);
        expect(by(out, 'b').cash).toBeCloseTo(by(out, 'c').cash, 6);
    });

    it('so the sibling who was passed over is not also poorer', () => {
        const out = divideEstate(estate, [child('a'), child('b')], 'a');
        expect(by(out, 'b').cash).toBeCloseTo(estate.cash / 2, 6);
    });
});

describe('the widow', () => {
    it('takes her share off the top, before the children see any of it', () => {
        const out = divideEstate(estate, [child('a'), child('b'), spouse()], 'a');
        expect(by(out, 'widow').cash).toBeCloseTo(estate.cash * SPOUSE_CASH_SHARE, 6);
        expect(by(out, 'a').cash)
            .toBeCloseTo((estate.cash * (1 - SPOUSE_CASH_SHARE)) / 2, 6);
    });

    it('and no stock, deliberately', () => {
        // A second large holder arriving on the register at the moment the
        // company can least afford one is a different game. The interesting
        // version of her is somebody on the board rather than a rival for it.
        const out = divideEstate(estate, [child('a'), spouse()], 'a');
        expect(by(out, 'widow').shares).toBe(0);
        expect(by(out, 'a').shares).toBe(estate.shares);
    });

    it('and everything when there are no children', () => {
        const out = divideEstate(estate, [spouse()], null);
        expect(by(out, 'widow').cash).toBe(estate.cash);
    });
});

describe('when nobody is old enough to take over', () => {
    it('the children still inherit', () => {
        // They are not disinherited for being nine. They simply inherit
        // without anybody taking control, which is the shape of
        // diedWithoutAnHeir and the reason the company gets absorbed.
        const out = divideEstate(estate, [child('a'), child('b')], null);
        expect(totalShares(out)).toBe(estate.shares);
    });

    it('and nobody is favoured, because nobody is in charge', () => {
        const out = divideEstate(estate, [child('a'), child('b')], null);
        expect(by(out, 'a').shares).toBe(by(out, 'b').shares);
        expect(out.every(b => b.kind !== 'heir')).toBe(true);
    });

    it('and a named heir who is not in the family is ignored', () => {
        const out = divideEstate(estate, [child('a'), child('b')], 'gone');
        expect(by(out, 'a').shares).toBe(by(out, 'b').shares);
    });
});

describe('nobody at all', () => {
    it('inherits nothing, which is not an error', () => {
        expect(divideEstate(estate, [], null)).toEqual([]);
        expect(divideEstate(estate, [], 'a')).toEqual([]);
    });
});

// ============================================================================
//  AND WHAT IT DOES OVER A DYNASTY
// ============================================================================
//  The thing the whole design is for. It needs no extra mechanism: it falls
//  out of dividing an estate honestly, twice, and then again.
// ============================================================================
describe('three generations', () => {
    const TOTAL = 10_000_000;

    it('leave the family holding a company somebody else controls', () => {
        let held = 5_500_000;    // 55 per cent, the founder
        const fractions: number[] = [];

        for (let generation = 0; generation < 3; generation++) {
            const kids = [child('heir'), child('b'), child('c'), child('d')];
            const out = divideEstate({ cash: 0, shares: held }, [...kids, spouse()], 'heir');
            fractions.push(by(out, 'heir').shares / TOTAL);
            // The next founder is the heir, holding only their own slice.
            held = by(out, 'heir').shares;
        }

        // One generation and the heir still runs it comfortably.
        expect(fractions[0]).toBeGreaterThan(0.3);
        // Two and they do not.
        expect(fractions[1]).toBeLessThan(0.25);
        // Three and the family name is on a building somebody else owns.
        expect(fractions[2]).toBeLessThan(0.15);
    });

    it('while the family between them holds on rather longer', () => {
        // The other half of it, and the reason the siblings matter: the
        // BLOCK survives even as the individual does not, which is what
        // makes a family that can agree with each other worth something.
        const out = divideEstate(
            { cash: 0, shares: 5_500_000 },
            [child('heir'), child('b'), child('c'), spouse()],
            'heir',
        );
        expect(familyHolding(out, TOTAL)).toBeCloseTo(0.55, 6);
    });
});
