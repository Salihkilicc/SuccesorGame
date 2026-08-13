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

describe('research, which the player asks for', () => {
    it('is invisible until they open the page', () => {
        // First in the array and gated on a trigger flag, so it costs the
        // opening lesson nothing while it waits.
        expect(showing(opening())).toBe('q1-open-product');
    });

    it('and takes priority the moment they do, even mid-tutorial', () => {
        // The point of putting it first. A player who taps into research
        // during the first quarter gets the lesson they just asked for,
        // rather than the one the calendar had queued.
        expect(showing(opening({ flags: { rndOpened: true } }))).toBe('rnd-lab');
    });

    it('then points at hiring, once the laboratory is open', () => {
        expect(showing(opening({
            flags: { rndOpened: true, rndLabOpened: true },
        }))).toBe('rnd-hire');
    });

    it('does not come back once the player has read it', () => {
        // The last step is ACKNOWLEDGE: cleared by a tap, recorded in the
        // lock state rather than in the world. So the thing that ends the
        // lesson is not a purchase - see the note in data/tutorial/
        // sequence.ts about why insisting on one was the wrong shape.
        const read: LockState = {
            ...emptyLockState(), completed: ['rnd-lab', 'rnd-hire'],
        };
        const id = showing(opening({ flags: { rndOpened: true } }), read);
        expect(id).not.toBe('rnd-lab');
        expect(id).not.toBe('rnd-hire');
    });

    it('and it never demands a purchase to get out of it', () => {
        // A player who correctly decides research is the wrong call this
        // quarter must not be left standing in front of an instruction they
        // have already understood and rejected.
        const hire = TUTORIAL_SEQUENCE.find(l => l.id === 'rnd-hire')!;
        expect(hire.acknowledge).toBe(true);
        expect(hire.satisfied).toBeUndefined();
        // And it says the price out loud rather than selling.
        expect(hire.instruction).toMatch(/expensive/i);
    });

    it('and once it is over the first year picks up where it left off', () => {
        // Interrupted, not cancelled. The marketing lesson was mid-flight
        // when the player wandered into research.
        const read: LockState = {
            ...emptyLockState(), completed: ['rnd-lab', 'rnd-hire'],
        };
        expect(showing(opening({ flags: { rndOpened: true } }), read))
            .toBe('q1-open-product');
    });

    it('still teaches it long after the father is dead', () => {
        // Every other lock is gated on him. This one is the reason the
        // gate is per-lock rather than global.
        expect(showing(opening({
            quarter: 17,
            flags: { fatherDead: true, rndOpened: true },
        }))).toBe('rnd-lab');
    });

    it('and a company with no money still gets the explanation', () => {
        // It used to be gated on capital, because clearing it meant buying
        // something. Reading costs nothing, so the poorest company in the
        // game is still allowed to be told what a laboratory is for - and is
        // arguably the one that most needs to know.
        expect(showing(opening({
            capital: 100_000,
            flags: { rndOpened: true, rndLabOpened: true },
        }))).toBe('rnd-hire');
    });
});

describe('a new game', () => {
    it('opens on the step that gets the player into the product', () => {
        // It used to open on a production target, and that read as nonsense
        // on the screen it pointed at: "nothing is real until something is
        // being built", said to a player looking at a phone that has been in
        // production since before they arrived. The budget is the hole they
        // can actually see.
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), opening());
        expect(lock?.id).toBe('q1-open-product');
        expect(lock?.highlight).toBe('products');
    });

    it('then points at the budget row, once the sheet has been opened', () => {
        const after = opening({ flags: { tutorialProductOpened: true } });
        const lock = activeLock(TUTORIAL_SEQUENCE, emptyLockState(), after);
        expect(lock?.id).toBe('q1-marketing');
        expect(lock?.highlight).toBe('marketing');
    });

    it('and not for a company that cannot afford to clear it', () => {
        // The first of the three ways out: a step that costs money does not
        // engage when there is none.
        expect(showing(opening({ capital: 100_000 }))).toBeUndefined();
    });
});

describe('after the player buys some attention', () => {
    const afterwards = opening({ flags: { tutorialProductOpened: true, tutorialMarketingSet: true } });

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
            flags: { tutorialProductOpened: true, tutorialMarketingSet: true },
            morale: 72,
        }))).toBe('morale-bonus');
    });

    it('and there is no third step, because its lesson moved to the first', () => {
        // q3-marketing is shelved. It waited on the same flag the opening
        // lock now raises, so it was inert as well as redundant - see the
        // note in data/tutorial/sequence.ts.
        expect(TUTORIAL_SEQUENCE.map(l => l.id)).toEqual([
            // Research first in the ARRAY, invisible until triggered - see
            // the note at the top of data/tutorial/sequence.ts.
            'rnd-lab', 'rnd-hire',
            'q1-open-product', 'q1-marketing', 'morale-bonus',
        ]);
        expect(showing(opening({
            flags: {
                tutorialProductOpened: true,
                tutorialMarketingSet: true,
                tutorialBonusPaid: true,
            },
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
            flags: { fatherDead: true, tutorialProductOpened: true, tutorialMarketingSet: true },
            quarter: 3,
        }))).toBeUndefined();
    });

    it('a skipped step does not come back', () => {
        const skipped: LockState = { ...emptyLockState(), skipped: ['q1-open-product', 'q1-marketing'] };
        expect(showing(opening(), skipped)).toBeUndefined();
    });

    it('and switching the tutorial off switches all of it off', () => {
        const off: LockState = { ...emptyLockState(), disabled: true };
        expect(showing(opening(), off)).toBeUndefined();
    });
});
