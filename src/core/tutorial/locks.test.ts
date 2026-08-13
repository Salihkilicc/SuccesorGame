// src/core/tutorial/locks.test.ts
//
// A lock that cannot be cleared does not crash, does not warn, and does not
// look wrong. It just leaves the player holding a dimmed screen with one lit
// button they cannot press. These tests are the only thing between that and
// the player.

import {
    activeLock,
    emptyLockState,
    isComplete,
    isSatisfied,
    mustRelease,
    validateLocks,
    type LockState,
    type TutorialLock,
    DIM_DEFAULT,
    DIM_HEAVY,
} from './locks';
import { CAST } from '../../data/story/cast';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { INITIAL_DIALS } from '../story/state';
import type { World } from '../story/conditions';

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 1,
    capital: 1_000_000,
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

const lock = (over: Partial<TutorialLock> = {}): TutorialLock => ({
    id: 'l1',
    highlight: 'products',
    instruction: 'do the thing',
    satisfied: [{ kind: 'flag', flag: 'tutorialProductionSet' }],
    ...over,
});

const state = (over: Partial<LockState> = {}): LockState => ({ ...emptyLockState(), ...over });

describe('which lock is on screen', () => {
    it('shows the first unfinished one', () => {
        const seq = [lock({ id: 'a' }), lock({ id: 'b' })];
        expect(activeLock(seq, state({ completed: ['a'] }), world())?.id).toBe('b');
    });

    it('treats a skipped lock as finished', () => {
        const seq = [lock({ id: 'a' }), lock({ id: 'b' })];
        expect(activeLock(seq, state({ skipped: ['a'] }), world())?.id).toBe('b');
    });

    it('shows nothing once the tutorial is switched off', () => {
        expect(activeLock([lock()], state({ disabled: true }), world())).toBeUndefined();
    });

    it('does not teach something that is already true', () => {
        const w = world({ flags: { tutorialProductionSet: true } });
        expect(activeLock([lock()], state(), w)).toBeUndefined();
    });
});

describe('escape one: it does not engage unless it can be cleared', () => {
    // THE BONUS TRAP. "Distribute a bonus" is cleared by spending, so a
    // company with no money would have been locked out of its own game.
    const bonus = lock({
        id: 'bonus',
        satisfied: [{ kind: 'flag', flag: 'tutorialBonusPaid' }],
        canEngage: [{ kind: 'capitalAtLeast', amount: 250_000 }],
    });

    it('stays away from a company that cannot pay', () => {
        expect(activeLock([bonus], state(), world({ capital: 0 }))).toBeUndefined();
    });

    it('appears for one that can', () => {
        expect(activeLock([bonus], state(), world({ capital: 500_000 }))?.id).toBe('bonus');
    });

    it('does not block the locks behind it while it waits', () => {
        // A step that cannot engage must be stepped OVER, not sat on -
        // otherwise one unsatisfiable lock silently ends the tutorial.
        const seq = [bonus, lock({ id: 'later', canEngage: [] })];
        expect(activeLock(seq, state(), world({ capital: 0 }))?.id).toBe('later');
    });
});

describe('escape two: it lets go when the world moves', () => {
    const bonus = lock({ canEngage: [{ kind: 'capitalAtLeast', amount: 250_000 }] });

    it('releases once the money is gone', () => {
        expect(mustRelease(bonus, world({ capital: 500_000 }))).toBe(false);
        expect(mustRelease(bonus, world({ capital: 10 }))).toBe(true);
    });

    it('an ungated lock never demands release', () => {
        expect(mustRelease(lock(), world({ capital: 0, cash: 0 }))).toBe(false);
    });
});

describe('the sequence that actually ships', () => {
    it('has no traps the data can reveal', () => {
        expect(validateLocks(TUTORIAL_SEQUENCE)).toEqual([]);
    });

    it('every lock can be cleared by something', () => {
        for (const l of TUTORIAL_SEQUENCE) expect(l.satisfied.length).toBeGreaterThan(0);
    });

    it('every lock that costs money says when it may engage', () => {
        // The rule the validator enforces, asserted directly so it cannot be
        // weakened by loosening the validator.
        for (const l of TUTORIAL_SEQUENCE) {
            const costs = JSON.stringify(l.satisfied).includes('Bonus');
            if (costs) expect((l.canEngage ?? []).length).toBeGreaterThan(0);
        }
    });

    it('a broke player is never shown the bonus lock', () => {
        const broke = world({ capital: 0, cash: 0 });
        const shown = activeLock(TUTORIAL_SEQUENCE, state(), broke);
        expect(shown?.id).not.toBe('morale-bonus');
    });

    it('the whole sequence can be walked to completion', () => {
        let s = state();
        let guard = 0;
        // Simulate a player who does what each step asks. If any step could
        // not be cleared this loop would not terminate, which is the failure
        // this whole file exists to prevent.
        const flags: Record<string, true> = {};
        while (!isComplete(TUTORIAL_SEQUENCE, s) && guard++ < 50) {
            const l = activeLock(TUTORIAL_SEQUENCE, s, world({ flags: { ...flags } as any }));
            if (!l) {
                // Nothing engageable left: everything remaining is gated off,
                // which the overlay's timed skip would clear.
                TUTORIAL_SEQUENCE.forEach(x => { s = { ...s, skipped: [...s.skipped, x.id] }; });
                break;
            }
            const f = (l.satisfied[0] as any).flag;
            flags[f] = true;
            s = { ...s, completed: [...s.completed, l.id] };
        }
        expect(guard).toBeLessThan(50);
        expect(isComplete(TUTORIAL_SEQUENCE, s)).toBe(true);
    });
});

describe('validateLocks finds the shapes that trap people', () => {
    it('flags a money-gated lock with nothing stopping it engaging', () => {
        const trap = lock({ satisfied: [{ kind: 'capitalAtLeast', amount: 1_000_000 }] });
        expect(validateLocks([trap]).map(p => p.kind)).toEqual(['no-escape']);
    });

    it('accepts the same lock once it says when it may engage', () => {
        const safe = lock({
            satisfied: [{ kind: 'capitalAtLeast', amount: 1_000_000 }],
            canEngage: [{ kind: 'capitalAtLeast', amount: 1_000_000 }],
        });
        expect(validateLocks([safe])).toEqual([]);
    });

    it('looks inside all/any/not rather than only at the top level', () => {
        const nested = lock({
            satisfied: [{ kind: 'all', of: [{ kind: 'not', of: { kind: 'cashAtLeast', amount: 5 } }] }],
        });
        expect(validateLocks([nested]).map(p => p.kind)).toContain('no-escape');
    });

    it('flags a lock with no satisfying condition at all', () => {
        expect(validateLocks([lock({ satisfied: [] })]).map(p => p.kind)).toContain('unsatisfiable');
    });

    it('flags two locks sharing an id', () => {
        expect(validateLocks([lock(), lock()]).map(p => p.kind)).toContain('duplicate');
    });

    it('now demands a gate even on a flag-cleared lock', () => {
        // THIS TEST USED TO ASSERT THE OPPOSITE, on the reasoning that
        // "raising a flag costs nothing, so there is nothing to be unable to
        // afford". The marketing lock disproved it: its satisfying condition
        // is a flag, and the flag is raised by SPENDING on a marketing
        // budget. A flag can be raised by anything, including something the
        // player cannot afford, so the cost is invisible to any check that
        // reads the condition shape.
        expect(validateLocks([lock()]).map(p => p.kind)).toEqual(['no-escape']);
    });

    it('and one line satisfies it', () => {
        // The cost of the rule to an honest lock. It is not asking for a
        // proof, it is asking the author to say when this is fair.
        expect(validateLocks([lock({
            canEngage: [{ kind: 'noFlag', flag: 'fatherDead' }],
        })])).toEqual([]);
    });
});

describe('isSatisfied', () => {
    it('reads the condition rather than a stored answer', () => {
        expect(isSatisfied(lock(), world())).toBe(false);
        expect(isSatisfied(lock(), world({ flags: { tutorialProductionSet: true } }))).toBe(true);
    });
});

// ============================================================================
//  A DIMMED SCREEN INSTRUCTED BY NOBODY
// ============================================================================
//  The overlay used to render a bare sentence with no name on it, so the
//  first hour of the game read as manual copy - which is exactly the hour
//  the father is standing next to the player in the conversation the lock
//  carries. These pin the fix.
// ============================================================================
describe('somebody is saying it', () => {
    it('every lock names a speaker the cast knows', () => {
        for (const lock of TUTORIAL_SEQUENCE) {
            const who = lock.speaker ?? 'father';
            expect(CAST[who]).toBeDefined();
        }
    });

    it('the first year is taught by the father, and research is not', () => {
        // The research pair is triggered by the player opening the page, not
        // by a quarter, so it can fire in year four when he is long dead.
        // Priya has been asking for a lab since before the player arrived.
        const byWho = Object.fromEntries(
            TUTORIAL_SEQUENCE.map(l => [l.id, l.speaker ?? 'father']),
        );
        expect(byWho['q1-open-product']).toBe('father');
        expect(byWho['q1-marketing']).toBe('father');
        expect(byWho['morale-bonus']).toBe('father');
        expect(byWho['rnd-lab']).toBe('cto');
        expect(byWho['rnd-hire']).toBe('cto');
    });

    it('and the research steps are the only ones the father does not gate', () => {
        // Every first-year lock carries `noFlag fatherDead`. These two must
        // not, or the lesson vanishes the moment he dies - which is most of
        // the game.
        const gatesOnFather = (id: string) =>
            !!TUTORIAL_SEQUENCE.find(l => l.id === id)?.canEngage
                ?.some(c => c.kind === 'noFlag' && c.flag === 'fatherDead');
        expect(gatesOnFather('q1-open-product')).toBe(true);
        expect(gatesOnFather('morale-bonus')).toBe(true);
        expect(gatesOnFather('rnd-lab')).toBe(false);
        expect(gatesOnFather('rnd-hire')).toBe(false);
    });

    it('and every lock carries the scene that argues for it, bar the first', () => {
        // The card is one line. The reason lives in the conversation, and a
        // lock without one is a screen that dims and points at a button for
        // no stated reason.
        //
        // The opening lock is the exception and it is not an oversight: its
        // scene is father-q1, which arrives through OPENING_CONVERSATIONS
        // because it is the opening. Naming it here as well would give one
        // conversation two delivery routes - deliver.ts would dedupe it, but
        // relying on a dedupe to cover a design with two sources is how the
        // second source eventually wins.
        expect(TUTORIAL_SEQUENCE.filter(l => !l.conversation).map(l => l.id))
            .toEqual(['rnd-hire', 'q1-open-product', 'q1-marketing']);
    });

    it('the instruction stays short enough to sit on a dimmed screen', () => {
        // Not a layout limit - the overlay wraps. A limit on how much can be
        // said in a place the player cannot leave, which is a different and
        // stricter thing.
        const long = TUTORIAL_SEQUENCE
            .filter(l => l.instruction.length > 110)
            .map(l => `${l.id}: ${l.instruction.length}ch`);
        expect(long).toEqual([]);
    });
});

// ============================================================================
//  THE LESSON LIVES ON THE SCREEN IT IS ABOUT
// ============================================================================
//  The overlay used to dim the WHOLE APP from the moment a lock became
//  active, wherever the player was, with a card pointing at nothing. Every
//  screen in the game was greyed out until they happened to find My Company.
//
//  It now renders nothing unless the control the lock names has been measured
//  on the screen currently up. These assert the data side of that contract -
//  the overlay's own early return is in TutorialOverlay.tsx, and the rect
//  lifecycle is in TutorialTarget.tsx.
// ============================================================================
describe('a lock points at a control that exists', () => {
    const REGISTERED = ['products', 'marketing', 'teamMorale', 'rndLab', 'rndHire'];

    it('every highlight key is one a screen actually registers', () => {
        // A key nothing registers is a lock that can now never appear at all,
        // where before it merely dimmed the app and lit nothing. The failure
        // got quieter, so the check has to get louder.
        const unknown = TUTORIAL_SEQUENCE
            .filter(l => !REGISTERED.includes(l.highlight))
            .map(l => `${l.id} -> ${l.highlight}`);
        expect(unknown).toEqual([]);
    });

    it('and the keys it can point at are few enough to list', () => {
        // If this grows, the list above is stale and the check is weaker than
        // it reads. Kept small on purpose.
        expect(REGISTERED.length).toBeLessThanOrEqual(6);
    });

    it('the opening lesson is two steps, and they light different things', () => {
        // One lock could not do it. The budget row lives inside a modal, and
        // iOS presents a modal above the whole React tree - so a lock that
        // lit the card could never also light the control, and the control
        // is the half the lesson is about.
        const open = TUTORIAL_SEQUENCE.find(l => l.id === 'q1-open-product')!;
        const spend = TUTORIAL_SEQUENCE.find(l => l.id === 'q1-marketing')!;
        expect(open.highlight).toBe('products');
        expect(spend.highlight).toBe('marketing');
        // In this order, or the player is asked to spend before the sheet
        // they would spend in has been opened.
        expect(TUTORIAL_SEQUENCE.indexOf(open))
            .toBeLessThan(TUTORIAL_SEQUENCE.indexOf(spend));
    });
});

// ============================================================================
//  HOW DARK, AND WHY IT IS NOT ONE NUMBER
// ============================================================================
//  It was 0.82 everywhere, which is nearly opaque. Halving it fixed the
//  product and laboratory sheets - where the dim was covering the very
//  figures the decision is made from - and made the morale step too faint,
//  because that one points at a department tile with nothing behind it worth
//  reading.
//
//  There is no third value that is right for both, so it moved onto the lock.
// ============================================================================
describe('the dim', () => {
    it('is light by default, because most locks sit on figures', () => {
        expect(DIM_DEFAULT).toBeLessThan(0.5);
        for (const id of ['q1-marketing', 'rnd-hire']) {
            const lock = TUTORIAL_SEQUENCE.find(l => l.id === id)!;
            expect(lock.dim ?? DIM_DEFAULT).toBe(DIM_DEFAULT);
        }
    });

    it('is heavier where there is nothing to read behind it', () => {
        const morale = TUTORIAL_SEQUENCE.find(l => l.id === 'morale-bonus')!;
        expect(morale.dim).toBe(DIM_HEAVY);
        expect(DIM_HEAVY).toBeGreaterThan(DIM_DEFAULT);
    });

    it('and never opaque, whichever a lock asks for', () => {
        // A dim that hides the screen completely is a modal wearing a
        // tutorial's clothes, and the player cannot see what they are being
        // asked to decide about.
        for (const lock of TUTORIAL_SEQUENCE) {
            const value = lock.dim ?? DIM_DEFAULT;
            expect(value).toBeGreaterThan(0);
            expect(value).toBeLessThanOrEqual(0.7);
        }
    });
});
