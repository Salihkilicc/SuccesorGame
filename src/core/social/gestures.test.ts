// src/core/social/gestures.test.ts
//
// ============================================================================
//  A BUTTON THAT COSTS NOTHING IS NOT A DECISION
// ============================================================================
//
//  Reported twice in one sentence: the things I do to raise a director's
//  regard change nothing and can be pressed forever, and I can raise my
//  partner's the same way by hammering the button.
//
//  MEASURED through the real store before any of this existed, ten presses:
//
//      #1  delta 18.0   relationship  0 -> 68   money unchanged
//      #4  delta  3.0                83 -> 86   money unchanged
//      #7  delta  0.0                89 -> 89   money unchanged
//
//  Three faults. It was free, in two different ways. Nothing limited it.
//  And the number the screen draws is `trust`, which gestures never touch -
//  so a player watching the bar correctly reported that nothing happened.
//
//  The rule is here because there were TWO handlers with the same hole, and
//  fixing one of them is how it got that way.
// ============================================================================

import {
    canOffer, noteOffered, gestureKey, isWorthOffering,
    BOARD_GIFT_COST, BOARD_DINNER_COST,
    type GestureLedger,
} from './gestures';

describe('once per person per quarter', () => {
    it('the first time is allowed and the second is not', () => {
        let ledger: GestureLedger = {};
        expect(canOffer(ledger, 'marcus', 'gift', 4)).toBe(true);
        ledger = noteOffered(ledger, 'marcus', 'gift', 4);
        expect(canOffer(ledger, 'marcus', 'gift', 4)).toBe(false);
    });

    it('and the next quarter it is allowed again', () => {
        const ledger = noteOffered({}, 'marcus', 'gift', 4);
        expect(canOffer(ledger, 'marcus', 'gift', 5)).toBe(true);
        expect(canOffer(ledger, 'marcus', 'gift', 40)).toBe(true);
    });

    it('and a different person is a different question', () => {
        const ledger = noteOffered({}, 'marcus', 'gift', 4);
        expect(canOffer(ledger, 'elena', 'gift', 4)).toBe(true);
    });

    it('and a different kind is too, because they are different evenings', () => {
        // Taking somebody to dinner and sending them a gift in one quarter is
        // two gestures. A single per person lock would have made the second
        // one impossible for no reason anybody could explain.
        const ledger = noteOffered({}, 'marcus', 'gift', 4);
        expect(canOffer(ledger, 'marcus', 'dinner', 4)).toBe(true);
    });

    it('and it stores a quarter rather than a flag, so nothing has to clear it', () => {
        // A wipe is a step somebody can forget to call, and this project has
        // the scars: `lobbied` is cleared by resetQuarterlyBoard and the new
        // game key list went three versions without being updated.
        const ledger = noteOffered({}, 'marcus', 'gift', 4);
        expect(ledger[gestureKey('marcus', 'gift')]).toBe(4);
        expect(Object.keys(ledger)).toHaveLength(1);
    });

    it('and nonsense does not open a door or close one', () => {
        expect(canOffer(undefined, 'marcus', 'gift', 4)).toBe(true);
        expect(canOffer({}, '', 'gift', 4)).toBe(false);
        expect(canOffer({ 'marcus:gift': NaN }, 'marcus', 'gift', 4)).toBe(true);
        expect(noteOffered(undefined, 'marcus', 'gift', NaN)['marcus:gift']).toBe(0);
    });

    it('and noting one does not mutate what it was given', () => {
        const before: GestureLedger = { 'elena:gift': 2 };
        const after = noteOffered(before, 'marcus', 'gift', 4);
        expect(before).toEqual({ 'elena:gift': 2 });
        expect(after).toEqual({ 'elena:gift': 2, 'marcus:gift': 4 });
    });
});

describe('and it costs money, which it did not', () => {
    it('a dinner is dearer than a gift, and both are real numbers', () => {
        expect(BOARD_GIFT_COST).toBeGreaterThan(0);
        expect(BOARD_DINNER_COST).toBeGreaterThan(BOARD_GIFT_COST);
    });

    it('and a fee for a guaranteed nothing is refused', () => {
        // Fatigue takes the effect to zero by the seventh press. Charging for
        // that would be the button lying a second time.
        expect(isWorthOffering(18)).toBe(true);
        expect(isWorthOffering(0.5)).toBe(true);
        expect(isWorthOffering(0)).toBe(false);
        expect(isWorthOffering(-3)).toBe(false);
        expect(isWorthOffering(NaN)).toBe(false);
    });
});
