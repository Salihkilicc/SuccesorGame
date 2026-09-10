// src/core/market/controlFloor.test.ts
//
// ============================================================================
//  THE FLOOR UNDER THE CHAIR
// ============================================================================
//
//  Asked for as: if my holding falls below ten per cent the game should end,
//  otherwise a lot of sharp practice becomes possible.
//
//  He is right about the practice. Nothing required the player to hold ANY of
//  it. Dilute yourself to two per cent raising money you never repay, sell
//  every share into a price you have just moved, and go on running the company
//  from a chair the register no longer entitles you to sit in.
//
//  ---------------------------------------------------------------------------
//  THE GRACE IS THE PART WORTH ARGUING ABOUT
//  ---------------------------------------------------------------------------
//  An immediate ending is the obvious rule and it is wrong here, because a
//  player can cross this line WITHOUT ACTING: a dilution the board forced, a
//  rights issue they could not fund, a treasury buyback that moved the
//  denominator. Ending a run on the same tick as an event the player did not
//  choose reads as the game cheating.
// ============================================================================

import {
    reviewControl, CONTROL_FLOOR_PERCENT, CONTROL_GRACE_QUARTERS,
    controlWarningLetter,
} from './controlFloor';

/** Walk a run through a series of registers and report what happened. */
const walk = (percents: number[]) => {
    let below = 0;
    return percents.map(p => {
        const r = reviewControl(p, below);
        below = r.quartersBelow;
        return r;
    });
};

describe('above the floor nothing happens', () => {
    it('at the floor exactly, which is not below it', () => {
        const r = reviewControl(CONTROL_FLOOR_PERCENT, 0);
        expect(r.status).toBe('held');
        expect(r.shouldWarn).toBe(false);
    });

    it('and a founder at thirty five per cent hears nothing for forty quarters', () => {
        const seen = walk(Array(40).fill(35));
        expect(seen.every(r => r.status === 'held')).toBe(true);
        expect(seen.some(r => r.shouldWarn)).toBe(false);
    });
});

describe('and under it there is one quarter', () => {
    it('the quarter it happens is a warning, not an ending', () => {
        const [first] = walk([9.4]);
        expect(first.status).toBe('warned');
        expect(first.shouldWarn).toBe(true);
        expect(CONTROL_GRACE_QUARTERS).toBe(1);
    });

    it('and the quarter after it, if nothing changed, is the end', () => {
        const seen = walk([9.4, 9.1]);
        expect(seen.map(r => r.status)).toEqual(['warned', 'lost']);
    });

    it('and the board writes once rather than every quarter', () => {
        // ------------------------------------------------------------------
        //  A DEADLINE THAT ARRIVES REPEATEDLY IS WALLPAPER
        // ------------------------------------------------------------------
        const seen = walk([9.4, 9.3, 9.2, 9.1]);
        expect(seen.filter(r => r.shouldWarn)).toHaveLength(1);
    });

    it('and climbing back spends nothing', () => {
        // THE WHOLE POINT OF THE GRACE. A player who buys their way back is
        // not left one quarter from an ending for the rest of the run.
        const seen = walk([9.4, 14, 8, 8]);
        expect(seen.map(r => r.status)).toEqual(['warned', 'held', 'warned', 'lost']);
        // Two separate warnings, because there were two separate falls.
        expect(seen.filter(r => r.shouldWarn)).toHaveLength(2);
    });

    it('and the counter really resets rather than merely pausing', () => {
        const seen = walk([9, 14]);
        expect(seen[1].quartersBelow).toBe(0);
    });
});

describe('and the letter says what the rule is', () => {
    it('it names the floor and the deadline', () => {
        const letter = controlWarningLetter(9.4);
        expect(letter.body).toContain(String(CONTROL_FLOOR_PERCENT));
        expect(letter.body).toContain('9.4');
        expect(letter.body.toLowerCase()).toContain('quarter');
    });

    it('and it does not threaten a vote, because there is not going to be one', () => {
        // The distinction this ending is built on: removal is a vote with a
        // brother in it, and this is a register with nobody in it.
        const body = controlWarningLetter(9.4).body.toLowerCase();
        expect(body).toContain('not calling a vote');
    });

    it('and no dash got into it', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        const letter = controlWarningLetter(9.4);
        expect(DASH.test(letter.subject)).toBe(false);
        expect(DASH.test(letter.body)).toBe(false);
    });
});

describe('and nonsense does not end a run', () => {
    it('an unreadable percentage is treated as under the floor', () => {
        // Deliberate and worth stating: a run whose ownership cannot be read
        // is not evidence that the player still owns it.
        expect(reviewControl(NaN, 0).status).toBe('warned');
    });

    it('and a broken counter does not skip the warning', () => {
        expect(reviewControl(5, NaN).status).toBe('warned');
        expect(reviewControl(5, -8).status).toBe('warned');
    });

    it('and a hundred per cent is never in trouble', () => {
        expect(reviewControl(100, 99).status).toBe('held');
    });
});
