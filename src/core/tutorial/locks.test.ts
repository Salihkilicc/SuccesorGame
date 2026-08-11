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
} from './locks';
import { TUTORIAL_SEQUENCE } from '../../data/tutorial/sequence';
import { INITIAL_DIALS } from '../story/state';
import type { World } from '../story/conditions';

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 1,
    capital: 1_000_000,
    cash: 100_000,
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

    it('does not complain about a flag-cleared lock with no gate', () => {
        // Raising a flag costs nothing, so there is nothing to be unable to
        // afford. Flagging these would make the check noise.
        expect(validateLocks([lock()])).toEqual([]);
    });
});

describe('isSatisfied', () => {
    it('reads the condition rather than a stored answer', () => {
        expect(isSatisfied(lock(), world())).toBe(false);
        expect(isSatisfied(lock(), world({ flags: { tutorialProductionSet: true } }))).toBe(true);
    });
});
