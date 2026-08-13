// src/core/tutorial/sequence.test.ts
//
// ============================================================================
//  WHICH STEP IS ON SCREEN, AT WHICH MOMENT OF THE FIRST YEAR
// ============================================================================
//
//  Written after an evening spent asking whether the tutorial was broken. It
//  was not. The Products screen showed nothing because the step had already
//  been satisfied in that save - a production target set in an earlier
//  session - and a finished tutorial and a broken one look exactly the same
//  from the sofa.
//
//  The individual locks were already tested for shape. What was missing was
//  the thing anybody actually wants to know: given a world, what does the
//  player see. That is one function call, and not having it written down cost
//  more time than writing it would have.
// ============================================================================

import { activeLock, emptyLockState, type LockState } from './locks';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { INITIAL_DIALS } from '../story/state';
import type { World } from '../story/conditions';

/** The world a new game starts in. Figures from the stores, not invented. */
const opening = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 1,
    capital: 2_000_000,
    cash: 2_000_000,
    morale: 75,
    marketShare: 0.4,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
} as World);

const showing = (world: World, state: LockState = emptyLockState()) =>
    activeLock(TUTORIAL_SEQUENCE, state, world)?.id;

describe('a new game', () => {
    it('opens on the production step, pointing at the product', () => {
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), opening());
        expect(lock?.id).toBe('q1-production');
        expect(lock?.highlight).toBe('products');
    });
});

describe('after the player sets a target', () => {
    const afterwards = opening({ flags: { tutorialProductionSet: true } });

    it('the tutorial goes quiet, and that is correct', () => {
        // THE ANSWER TO "why is nothing highlighted on Products". Nothing is
        // wrong. There is no step to show until the third quarter.
        expect(showing(afterwards)).toBeUndefined();
    });

    it('and morale is not the next one, because morale has not settled yet', () => {
        // Morale starts at 75 and approaches 70 asymptotically. The bonus
        // step needs 72 or below, which arrives in the second or third
        // quarter - see MORALE_EVENT_THRESHOLD and the note above it.
        expect(showing(opening({
            flags: { tutorialProductionSet: true },
            morale: 72,
        }))).toBe('morale-bonus');
    });

    it('marketing waits for the third quarter AND for money to spend', () => {
        const q3 = { tutorialProductionSet: true, tutorialBonusPaid: true } as const;
        // Right quarter, no money: nothing, rather than a step that cannot
        // be cleared. That is the first of the three ways out.
        expect(showing(opening({
            flags: q3, quarter: 3, capital: 100_000, morale: 75,
        }))).toBeUndefined();

        expect(showing(opening({
            flags: q3, quarter: 3, capital: 2_000_000, morale: 75,
        }))).toBe('q3-marketing');
    });
});

describe('the year ends', () => {
    it('nothing is taught once the father is dead', () => {
        // Every lock carries `noFlag fatherDead`. A tutorial that reappears
        // in year three is a bug, and this is the one line that prevents it.
        expect(showing(opening({ flags: { fatherDead: true } }))).toBeUndefined();
        expect(showing(opening({
            flags: { fatherDead: true, tutorialProductionSet: true },
            quarter: 3,
        }))).toBeUndefined();
    });

    it('a skipped step does not come back', () => {
        const skipped: LockState = { ...emptyLockState(), skipped: ['q1-production'] };
        expect(showing(opening(), skipped)).toBeUndefined();
    });

    it('and switching the tutorial off switches all of it off', () => {
        const off: LockState = { ...emptyLockState(), disabled: true };
        expect(showing(opening(), off)).toBeUndefined();
    });
});
