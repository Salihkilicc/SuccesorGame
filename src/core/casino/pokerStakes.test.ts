// src/core/casino/pokerStakes.test.ts
//
// ============================================================================
//  A POKER ROOM HAS A DOOR PRICE, NOT A CHIP RACK
// ============================================================================
//
//  Asked for as: "in poker remove the bets, set a buy-in for each country and
//  for the VIP room, and you enter by paying it. Once you are in, the bets
//  should show as percentages, 5 10 20 25 with plus and minus, like normal
//  poker. And in the VIP room let it be ten per cent of your money."
//
//  ---------------------------------------------------------------------------
//  WHY THE RACK NEVER FITTED HERE
//  ---------------------------------------------------------------------------
//  It was borrowed from the other three games, and the other three are ONE
//  SHOT: choose a stake, play it, it resolves. Choosing the stake IS the
//  decision. Poker is a session - you buy in once and every real decision
//  happens inside the hand - so four chips outside the table were answering a
//  question a poker door does not ask. Every real room posts one number on the
//  wall instead.
//
//  ---------------------------------------------------------------------------
//  AND THE PRICE IS THE ROOM'S OWN SHARE, NOT A SECOND LADDER
//  ---------------------------------------------------------------------------
//  Every location already carries the fraction of your fortune it plays for,
//  and it exists so the danger scales with the man rather than with the decade.
//  Reusing it means the poker door moves when the room does, and the VIP room
//  lands on ten per cent - the figure that was asked for - without anybody
//  typing a table of six numbers that goes stale.
//
//  ---------------------------------------------------------------------------
//  AND THE RAISE IS A SHARE OF YOUR STACK, WHICH WAS A REAL CHOICE
//  ---------------------------------------------------------------------------
//  Pot fractions are the language poker players actually use, and they were
//  the obvious reading of "5 10 20 25". They break at the bottom: five per
//  cent of a pot is almost always below the minimum raise, so it clamps, and
//  two of the four buttons produce the same number. A player pressing 5% and
//  10% and seeing one figure would reasonably conclude the game was broken.
//
//  A share of your own chips is always legal, always distinct, and shrinks by
//  itself when you are short - which is exactly when sizing starts to matter.
// ============================================================================

import {
    BLINDS_PER_BUY_IN, RAISE_MAX_PCT, RAISE_MIN_PCT, RAISE_NUDGE, RAISE_STEPS,
    blindFor, canAffordBuyIn, isAllIn, nudgeRaise, pokerBuyIn, raiseAmount,
} from './pokerStakes';

describe('the door price is the room"s own share', () => {
    it('a room that plays for half a per cent charges half a per cent', () => {
        expect(pokerBuyIn(10_000_000, 0.005, 0)).toBe(50_000);
    });

    it('and the VIP room charges a tenth, which is what was asked for', () => {
        expect(pokerBuyIn(10_000_000, 0.10, 0)).toBe(1_000_000);
    });

    it('and the floor keeps a broke player out rather than seating them free', () => {
        // A percentage alone breaks worse than a constant: nothing times a
        // share is nothing, and a table with a zero buy-in is not a table.
        expect(pokerBuyIn(0, 0.05, 10_000_000)).toBe(10_000_000);
        expect(pokerBuyIn(1, 0.05, 250_000)).toBe(250_000);
    });

    it('and the ladder rises across the rooms without crossing itself', () => {
        // The five city shares, in order, at one fortune.
        const money = 1_000_000_000;
        const shares = [0.005, 0.01, 0.02, 0.035, 0.05, 0.10];
        const prices = shares.map(sh => pokerBuyIn(money, sh, 0));
        for (let i = 1; i < prices.length; i++) {
            expect(prices[i]).toBeGreaterThan(prices[i - 1]);
        }
        expect(prices[prices.length - 1]).toBe(money * 0.10);
    });

    it('and nonsense cannot conjure a free seat or an infinite one', () => {
        for (const bad of [NaN, -1, Infinity]) {
            const v = pokerBuyIn(bad as number, 0.05, 0);
            expect(Number.isFinite(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
        }
        expect(Number.isFinite(pokerBuyIn(1000, NaN as number, 0))).toBe(true);
    });
});

describe('and the blind falls out of the buy-in', () => {
    it('a hundred blinds to a stack, so there is one figure to reason about', () => {
        expect(BLINDS_PER_BUY_IN).toBe(100);
        expect(blindFor(1_000_000)).toBe(10_000);
    });

    it('and it is never zero, or nobody can post', () => {
        // A buy-in below a hundred would floor to nothing and the hand would
        // start with an empty pot and no bet to match.
        for (const tiny of [0, 1, 50, 99]) {
            expect(blindFor(tiny)).toBeGreaterThanOrEqual(1);
        }
    });

    it('and the door refuses when the wallet cannot cover it', () => {
        expect(canAffordBuyIn(999, 1000)).toBe(false);
        expect(canAffordBuyIn(1000, 1000)).toBe(true);
        expect(canAffordBuyIn(1e9, 0)).toBe(false);
    });
});

describe('and the raise ladder is what was asked for', () => {
    it('five, ten, twenty and twenty five', () => {
        expect([...RAISE_STEPS]).toEqual([5, 10, 20, 25]);
    });

    it('and plus and minus move by five, staying inside the ladder', () => {
        expect(RAISE_NUDGE).toBe(5);
        expect(nudgeRaise(10, 5)).toBe(15);
        expect(nudgeRaise(10, -5)).toBe(5);
        expect(nudgeRaise(RAISE_MIN_PCT, -5)).toBe(RAISE_MIN_PCT);
        expect(nudgeRaise(RAISE_MAX_PCT, 5)).toBe(RAISE_MAX_PCT);
    });

    it('and it snaps to the ladder from anywhere', () => {
        expect(nudgeRaise(13, 0)).toBe(15);
        expect(nudgeRaise(NaN as number, 0)).toBe(RAISE_MIN_PCT);
    });
});

describe('and every size it produces is a real bet', () => {
    const STACK = 10_000;

    it('it is a share of YOUR STACK, not of the pot', () => {
        // THE DECISION, and the reason is in the header: pot fractions collapse
        // at the bottom of the ladder.
        expect(raiseAmount(10, STACK, 0, 0)).toBe(1_000);
        expect(raiseAmount(25, STACK, 0, 0)).toBe(2_500);
    });

    it('and the four buttons never give the same number', () => {
        // Which is exactly what pot fractions would have done. Four presses,
        // four different bets, at every stack size worth playing.
        const seen = new Set(RAISE_STEPS.map(p => raiseAmount(p, STACK, 0, 200)));
        expect(seen.size).toBe(RAISE_STEPS.length);
    });

    it('and it is always actually a raise', () => {
        // Below the current bet plus one it is a call wearing a raise's label,
        // and the street would never close.
        for (const p of RAISE_STEPS) {
            expect(raiseAmount(p, STACK, 0, 9_000)).toBeGreaterThan(9_000);
        }
    });

    it('and it never promises more than you have', () => {
        for (const p of [5, 25, 100]) {
            expect(raiseAmount(p, STACK, 500, 0)).toBeLessThanOrEqual(STACK + 500);
        }
    });

    it('and a short stack"s buttons shrink with them', () => {
        // The property pot fractions do not have: sizing stays meaningful
        // exactly when it starts to matter.
        const deep = raiseAmount(25, 100_000, 0, 0);
        const short = raiseAmount(25, 2_000, 0, 0);
        expect(short).toBeLessThan(deep);
        expect(short).toBeGreaterThan(0);
    });

    it('and the top of the ladder is all in, and says so', () => {
        expect(isAllIn(100, STACK, 0, 0)).toBe(true);
        expect(isAllIn(10, STACK, 0, 0)).toBe(false);
    });

    it('and a player with nothing left cannot be asked to raise', () => {
        const v = raiseAmount(25, 0, 500, 500);
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeLessThanOrEqual(500);
    });

    it('and nonsense inputs produce a number rather than a crash', () => {
        for (const bad of [NaN, Infinity, -5]) {
            const v = raiseAmount(bad as number, STACK, 0, 0);
            expect(Number.isFinite(v)).toBe(true);
        }
        expect(Number.isFinite(raiseAmount(25, NaN as number, NaN as number, NaN as number))).toBe(true);
    });
});
