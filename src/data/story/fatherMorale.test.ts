// src/data/story/fatherMorale.test.ts
//
// ============================================================================
//  THE ONE THAT NEARLY DID NOT FIRE FOR ANYBODY
// ============================================================================
//
//  This event was specified as "morale drops below 70", on the reasoning that
//  70 is MORALE_ANCHOR - where market pay parks morale - so almost every
//  player would see it.
//
//  Morale never goes below 70. It approaches it from above and never arrives:
//  75, then 30% of the remaining gap each quarter, forever. `moraleAtMost: 70`
//  would have fired for nobody, and nothing about that failure is visible -
//  the event simply never happens and the tutorial quietly has a hole in it.
//
//  These pin the number to what it has to do rather than to what it is. If
//  someone rebalances MORALE_APPROACH or the anchor, the arithmetic below
//  fails and says which way it moved.
// ============================================================================

import { fatherMorale } from './fatherMorale';
import { CONVERSATIONS } from './index';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { TUTORIAL_SEQUENCE, MORALE_EVENT_THRESHOLD } from '../tutorial/sequence';
import { activeLock, emptyLockState } from '../../core/tutorial/locks';
import {
    MORALE_ANCHOR, updateMorale, wageMoraleTarget,
} from '../../core/market/workforce';
import { INITIAL_DIALS } from '../../core/story/state';
import type { World } from '../../core/story/conditions';

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 4,
    capital: 5_000_000,
    cash: 100_000,
    morale: 75,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

/** Morale quarter by quarter for a company paying exactly the market rate. */
const walkMorale = (quarters: number, salaryRatio = 1.0): number[] => {
    const out: number[] = [];
    let m = 75;
    for (let q = 0; q < quarters; q++) {
        m = updateMorale({ currentMorale: m, salaryRatio }).newMorale;
        out.push(m);
    }
    return out;
};

describe('the arithmetic the threshold depends on', () => {
    it('market pay targets the anchor exactly', () => {
        expect(wageMoraleTarget(1.0)).toBe(MORALE_ANCHOR);
    });

    it('and morale STOPS at 70.1, which is not the same as approaching 70', () => {
        // THE REASON THE SPECIFIED NUMBER COULD NOT WORK, and it is sharper
        // than "asymptotic". updateMorale rounds to one decimal every
        // quarter, so 70.1 is a FIXED POINT: 70.1 + (70 - 70.1) * 0.3 = 70.07,
        // which rounds back to 70.1. Ten years of market pay, or a hundred,
        // and it is still 70.1. Morale cannot reach 70 even in principle.
        const path = walkMorale(40);
        expect(path[39]).toBe(70.1);
        expect(Math.min(...path)).toBe(70.1);
    });

    it('so a threshold AT the anchor would fire for nobody', () => {
        expect(walkMorale(40).some(m => m <= MORALE_ANCHOR)).toBe(false);
    });

    it('while the threshold actually used is crossed early', () => {
        // The intent was "most players see this, in the tutorial year".
        const path = walkMorale(4);
        expect(path.some(m => m <= MORALE_EVENT_THRESHOLD)).toBe(true);
    });

    it('and is not crossed by a company that pays above market', () => {
        // The one group that has earned skipping the lesson.
        expect(walkMorale(40, 1.15).some(m => m <= MORALE_EVENT_THRESHOLD)).toBe(false);
    });
});

describe('the lock', () => {
    const lock = () => TUTORIAL_SEQUENCE.find(l => l.id === 'morale-bonus')!;
    // The opening lock, cleared. It was 'q1-production' and is now
    // 'q1-marketing' - the first lesson changed, this one did not.
    const state = () => ({ ...emptyLockState(), completed: ['q1-open-product', 'q1-marketing'] });

    it('does not engage while morale is still healthy', () => {
        // It had NO morale condition at all before this - it would have
        // engaged in quarter one, on a workforce at 75, telling the player to
        // fix something that was not wrong.
        //
        // Asserted as "not this lock" rather than "no lock at all". It used
        // to be the Q3 marketing lock stepping over it; that lock is shelved
        // now, so at healthy morale there is simply nothing to show - which
        // is the same assertion and a stronger outcome.
        expect(activeLock(TUTORIAL_SEQUENCE, state(), world({ morale: 75 }))?.id)
            .not.toBe('morale-bonus');
    });

    it('engages once morale has settled', () => {
        expect(activeLock(TUTORIAL_SEQUENCE, state(), world({ morale: 71 }))?.id)
            .toBe('morale-bonus');
    });

    it('still refuses to engage for a company that cannot pay', () => {
        // The original escape, unchanged: this is the trap the whole lock
        // design exists for.
        expect(activeLock(TUTORIAL_SEQUENCE, state(), world({ morale: 71, capital: 0 })))
            .toBeUndefined();
    });

    it('and carries the scene that explains it', () => {
        expect(lock().conversation).toBe(fatherMorale.id);
    });

    it('whose instruction does not contradict the screen', () => {
        // It said "morale is slipping". It is not slipping - it has settled,
        // and the player can go and look. A tutorial that describes something
        // the player can see is untrue teaches them to stop reading it.
        expect(lock().instruction.toLowerCase()).not.toContain('slipping');
    });
});

describe('the scene', () => {
    it('is registered and valid', () => {
        const known = new Set(CONVERSATIONS.map(c => c.id));
        expect(known.has(fatherMorale.id)).toBe(true);
        expect(validate(fatherMorale, CAST, known)).toEqual([]);
    });

    it('sends the player to the control the lock lights up', () => {
        const lock = TUTORIAL_SEQUENCE.find(l => l.id === 'morale-bonus')!;
        expect(lock.highlight).toBe('teamMorale');
        expect(fatherMorale.nodes.map(n => n.text).join(' ')).toContain('Team Morale');
    });

    it('is honest that a bonus is temporary', () => {
        // The tick treats it as a one-off and so does he. A scene that sold
        // it as a fix would be the game lying about its own arithmetic.
        const text = fatherMorale.nodes.map(n => n.text).join(' ').toLowerCase();
        expect(text).toContain('fades');
    });

    it('offers the wage route as well, with its real ceiling', () => {
        const text = fatherMorale.nodes.map(n => n.text).join(' ').toLowerCase();
        expect(text).toContain('eighty-five');
    });
});
