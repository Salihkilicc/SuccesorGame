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
    it('opens on the marketing step, pointing at the product', () => {
        // It used to open on a production target, and that read as nonsense
        // on the screen it pointed at: "nothing is real until something is
        // being built", said to a player looking at a phone that has been in
        // production since before they arrived. The budget is the hole they
        // can actually see.
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), opening());
        expect(lock?.id).toBe('q1-marketing');
        expect(lock?.highlight).toBe('products');
    });

    it('and not for a company that cannot afford to clear it', () => {
        // The first of the three ways out: a step that costs money does not
        // engage when there is none.
        expect(showing(opening({ capital: 100_000 }))).toBeUndefined();
    });
});

describe('after the player buys some attention', () => {
    const afterwards = opening({ flags: { tutorialMarketingSet: true } });

    it('the tutorial goes quiet, and that is correct', () => {
        // THE ANSWER TO "why is nothing highlighted on Products". Nothing is
        // wrong. There is no step to show until morale settles.
        expect(showing(afterwards)).toBeUndefined();
    });

    it('and morale is not next until morale has actually settled', () => {
        // Morale starts at 75 and approaches 70 asymptotically. The bonus
        // step needs 72 or below, which arrives in the second or third
        // quarter - see MORALE_EVENT_THRESHOLD and the note above it.
        expect(showing(opening({
            flags: { tutorialMarketingSet: true },
            morale: 72,
        }))).toBe('morale-bonus');
    });

    it('and there is no third step, because its lesson moved to the first', () => {
        // q3-marketing is shelved. It waited on the same flag the opening
        // lock now raises, so it was inert as well as redundant - see the
        // note in data/tutorial/sequence.ts.
        expect(TUTORIAL_SEQUENCE.map(l => l.id)).toEqual(['q1-marketing', 'morale-bonus']);
        expect(showing(opening({
            flags: { tutorialMarketingSet: true, tutorialBonusPaid: true },
            quarter: 3, morale: 75,
        }))).toBeUndefined();
    });
});

describe('the year ends', () => {
    it('nothing is taught once the father is dead', () => {
        // Every lock carries `noFlag fatherDead`. A tutorial that reappears
        // in year three is a bug, and this is the one line that prevents it.
        expect(showing(opening({ flags: { fatherDead: true } }))).toBeUndefined();
        expect(showing(opening({
            flags: { fatherDead: true, tutorialMarketingSet: true },
            quarter: 3,
        }))).toBeUndefined();
    });

    it('a skipped step does not come back', () => {
        const skipped: LockState = { ...emptyLockState(), skipped: ['q1-marketing'] };
        expect(showing(opening(), skipped)).toBeUndefined();
    });

    it('and switching the tutorial off switches all of it off', () => {
        const off: LockState = { ...emptyLockState(), disabled: true };
        expect(showing(opening(), off)).toBeUndefined();
    });
});
