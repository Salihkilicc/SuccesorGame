// src/core/tutorial/locks.ts
//
// ============================================================================
//  A LOCK IS A PROMISE THAT THE PLAYER CAN GET OUT
// ============================================================================
//
//  The teaching layer dims the screen and lights one control. That part is
//  easy. The part that matters is the one that goes wrong:
//
//      "Morale has fallen. Distribute a bonus." - and the player has no cash.
//
//  Now the only lit control cannot be pressed, the screen is dimmed, and the
//  game is over in the worst way: not lost, STUCK. A lock without a way out
//  is not a lock, it is a trap, and the player cannot tell the difference
//  until it is too late to do anything about it.
//
//  So a lock here has THREE ways out, and they are three because each one
//  covers a failure the others do not:
//
//   1) IT DOES NOT ENGAGE UNLESS IT CAN BE CLEARED. `canEngage` is checked
//      before the lock is ever shown. This is prevention, and it handles the
//      cases we thought of - do not demand a bonus from a company with no
//      money to pay one.
//
//   2) IT RELEASES ITSELF IF THAT STOPS BEING TRUE. The world moves while a
//      lock is up: a quarter can close, cash can leave. If `canEngage` fails
//      while the lock is engaged, the lock lifts on its own. This handles the
//      state changing underneath us.
//
//   3) A SKIP APPEARS AFTER A FEW SECONDS, ALWAYS. No condition, no opt-out,
//      no way for a lock to be authored without it. This is the one that
//      handles the cases nobody thought of, which is the only category that
//      actually matters - the trap we ship will be one we did not predict.
//
//  Three is not belt and braces. (1) is quality, (2) is correctness, and (3)
//  is the floor beneath both.
//
//  ---------------------------------------------------------------------------
//  IT REUSES THE STORY'S CONDITIONS
//  ---------------------------------------------------------------------------
//  `satisfied` and `canEngage` are the same closed `Condition` vocabulary the
//  conversations use. That is deliberate: it is already tested, it is already
//  inspectable, and inspectable is what lets the audit ask "can this lock
//  ever clear?" - the exact question a trap fails.
// ============================================================================

import { testAll, type Condition } from '../story/conditions';
import type { World } from '../story/conditions';

/**
 * How long before the skip appears, in milliseconds.
 *
 * Long enough that it is not the first thing the eye lands on - a skip
 * offered instantly teaches the player to skip. Short enough that being stuck
 * is measured in seconds rather than in frustration.
 */
export const ESCAPE_AFTER_MS = 12_000;

export type TutorialLock = {
    id: string;
    /**
     * Which control lights up. Screens register themselves under these keys
     * with <TutorialTarget>; an unknown key dims the screen and lights
     * nothing, which the audit catches.
     */
    highlight: string;
    /** One line. What to do, not why - the why is the character's job. */
    instruction: string;
    /** When it clears and the sequence moves on. */
    satisfied: Condition[];
    /**
     * Do not engage unless this holds. THE FIRST WAY OUT.
     *
     * Optional in the type and effectively mandatory in practice: the audit
     * flags a lock whose `satisfied` needs money or a flag with no matching
     * `canEngage`, because that is the shape of the bonus trap.
     */
    canEngage?: Condition[];
    /**
     * The scene that explains it.
     *
     * A conversation id. When the lock first becomes engageable it is queued,
     * so the father's words and the dimmed screen arrive together.
     *
     * They were unrelated before this. The overlay said "Pay a bonus before
     * the line starts costing you" and nothing anywhere said WHY, which left
     * the teaching layer sounding like a tooltip rather than a person - and
     * left the two halves free to drift into saying different things.
     */
    conversation?: string;
};

export type LockState = {
    /** Ids of locks already cleared, in order. */
    completed: string[];
    /** Locks the player skipped. Kept apart so the audit can see them. */
    skipped: string[];
    /** Whole tutorial turned off - the second-playthrough case. */
    disabled: boolean;
};

export const emptyLockState = (): LockState => ({ completed: [], skipped: [], disabled: false });

const done = (s: LockState, id: string) =>
    s.completed.includes(id) || s.skipped.includes(id);

/**
 * Which lock, if any, should be on screen.
 *
 * The sequence is walked in order and the first unfinished one wins, so the
 * script reads top to bottom. A lock that cannot engage is SKIPPED OVER
 * rather than blocking the ones behind it - otherwise one unsatisfiable step
 * would silently end the tutorial.
 */
export const activeLock = (
    sequence: TutorialLock[],
    state: LockState,
    world: World,
): TutorialLock | undefined => {
    if (state.disabled) return undefined;
    for (const lock of sequence) {
        if (done(state, lock.id)) continue;
        if (!testAll(lock.canEngage, world)) continue;
        // Already true when we got here - nothing to teach.
        if (testAll(lock.satisfied, world)) continue;
        return lock;
    }
    return undefined;
};

/** Has the lock on screen been cleared by what the player just did? */
export const isSatisfied = (lock: TutorialLock, world: World): boolean =>
    testAll(lock.satisfied, world);

/**
 * WAY OUT NUMBER TWO: the lock is up and the world stopped supporting it.
 *
 * Separate from `activeLock` because the question is different - that one
 * asks "should this start", this asks "must this stop". A lock that engaged
 * legitimately and then became impossible has to lift itself; nobody is
 * coming to check.
 */
export const mustRelease = (lock: TutorialLock, world: World): boolean =>
    !testAll(lock.canEngage, world);

/** Everything cleared or skipped. */
export const isComplete = (sequence: TutorialLock[], state: LockState): boolean =>
    sequence.every(l => done(state, l.id));

// ---------------------------------------------------------------------------
//  VALIDATION — the same idea as the conversation graph
// ---------------------------------------------------------------------------

export type LockProblem = { lock: string; kind: 'duplicate' | 'no-escape' | 'unsatisfiable'; detail: string };

/**
 * Find the traps before a player does.
 *
 * The rule it enforces: if clearing a lock needs MONEY or a FLAG, the lock
 * must say when it may engage. That is exactly the bonus case - "distribute a
 * bonus" is satisfied by spending cash, so it must not engage without cash.
 *
 * It cannot catch everything, which is why the timed skip exists and is not
 * optional. This catches the ones that are visible in the data.
 */
export const validateLocks = (sequence: TutorialLock[]): LockProblem[] => {
    const problems: LockProblem[] = [];
    const seen = new Set<string>();

    const needsResources = (c: Condition): boolean => {
        switch (c.kind) {
            case 'capitalAtLeast':
            case 'cashAtLeast':
                return true;
            case 'all':
            case 'any':
                return c.of.some(needsResources);
            case 'not':
                return needsResources(c.of);
            default:
                return false;
        }
    };

    for (const lock of sequence) {
        if (seen.has(lock.id)) {
            problems.push({ lock: lock.id, kind: 'duplicate', detail: 'two locks share this id' });
        }
        seen.add(lock.id);

        if (lock.satisfied.length === 0) {
            problems.push({
                lock: lock.id,
                kind: 'unsatisfiable',
                detail: 'no satisfying condition, so it can only ever be skipped',
            });
        }

        // ------------------------------------------------------------------
        //  EVERY LOCK DECLARES WHEN IT MAY ENGAGE. NO EXCEPTIONS.
        // ------------------------------------------------------------------
        //  This used to fire only when `satisfied` mentioned money, which
        //  reads well and has a hole you can drive the marketing lock through:
        //  its satisfying condition is a FLAG, and the flag happens to be
        //  raised by spending. The cost is entirely real and entirely
        //  invisible to any check that looks at the condition shape - a flag
        //  can be raised by anything, including something the player cannot
        //  afford.
        //
        //  So the requirement is now unconditional. It costs an honest lock
        //  one line - `canEngage: [{ kind: 'noFlag', flag: 'fatherDead' }]`
        //  is a perfectly good answer - and it makes the author state, every
        //  time, the circumstances in which this is a fair thing to demand.
        //  That question is the whole point of the file.
        // ------------------------------------------------------------------
        if (!(lock.canEngage ?? []).length) {
            problems.push({
                lock: lock.id,
                kind: 'no-escape',
                detail: lock.satisfied.some(needsResources)
                    ? 'clearing it costs money but nothing stops it engaging when there is none'
                    : 'no canEngage: say when this is a fair thing to demand, even if the answer is "always in year one"',
            });
        }
    }

    return problems;
};
