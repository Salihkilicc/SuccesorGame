// src/core/events/engine.ts
//
// ============================================================================
//  ROLLING THE QUARTER
// ============================================================================
//
//  Pure. Takes the pool, the world, the history and a source of randomness;
//  returns what fires. Touches no store, so the whole of it can be tested by
//  handing it a fixed dice sequence - which is the only way a probability is
//  ever actually checked rather than assumed.
//
//  ---------------------------------------------------------------------------
//  ONE EVENT A QUARTER
//  ---------------------------------------------------------------------------
//  Not a balance knob, a structural limit. The inbox already allows two
//  deliveries a quarter (core/story/inbox.ts), and the story owns those: a
//  father's letter and a CFO's warning are the spine, and random events must
//  not be able to push them out of the way. One event leaves room and keeps
//  the quarter legible - if two unrelated things happen at once, the player
//  cannot tell which of their decisions caused what.
//
//  The ones that lose are NOT deferred. They roll again next quarter with the
//  same odds, which is what "probability per quarter" means. Queuing losers
//  would turn a 10% event into a certainty with a delay.
// ============================================================================

import { testAll, type World } from '../story/conditions';
import type { EventHistory, EventRoll, GameEvent } from './types';

export const MAX_EVENTS_PER_QUARTER = 1;

/**
 * Has enough time passed?
 *
 * No cooldown means once per game. The distinction is deliberate: `undefined`
 * and `0` mean opposite things, and reading `cooldown ?? 0` - the obvious
 * shorthand - would silently make every event repeatable every quarter.
 */
export const isReady = (e: GameEvent, history: EventHistory, quarter: number): boolean => {
    const last = history.lastFired[e.id];
    if (last === undefined) return true;
    if (e.cooldown === undefined) return false;
    return quarter - last >= e.cooldown;
};

/** Priority first, then the order they were written. Stable. */
const byPriority = (pool: GameEvent[]) => (a: GameEvent, b: GameEvent) =>
    (b.priority ?? 0) - (a.priority ?? 0) || pool.indexOf(a) - pool.indexOf(b);

export const rollQuarter = (
    pool: GameEvent[],
    world: World,
    history: EventHistory,
    quarter: number,
    /** Injected so a test can hand it a known sequence. */
    random: () => number = Math.random,
): EventRoll => {
    // Order the POOL before rolling, not the winners after.
    //
    // Rolling in pool order and then sorting looks equivalent and is not: it
    // spends a die on every eligible event, so adding a low-priority event to
    // the file changes which dice the important ones get. Sorting first makes
    // the sequence depend on the event, not on its neighbours.
    const eligible = pool
        .filter(e => isReady(e, history, quarter) && testAll(e.when, world))
        .sort(byPriority(pool));

    const fired: GameEvent[] = [];
    for (const e of eligible) {
        if (fired.length >= MAX_EVENTS_PER_QUARTER) break;
        if (random() < e.chance) fired.push(e);
    }

    return { fired, eligible };
};

// ---------------------------------------------------------------------------
//  VALIDATION — the same bargain as the conversation graph
// ---------------------------------------------------------------------------
//  Triggers are data, so they can be read without running the game. These are
//  the mistakes that data can reveal.

export type EventProblem = {
    event: string;
    kind:
    | 'duplicate'
    | 'impossible-chance'
    | 'never-fires'
    | 'unregistered-conversation'
    | 'silent';
    detail: string;
};

export const validateEvents = (
    pool: GameEvent[],
    /** Every conversation id the game knows about. */
    known?: Set<string>,
): EventProblem[] => {
    const problems: EventProblem[] = [];
    const at = (event: string, kind: EventProblem['kind'], detail: string) =>
        problems.push({ event, kind, detail });

    const seen = new Set<string>();
    for (const e of pool) {
        if (seen.has(e.id)) {
            at(e.id, 'duplicate', 'two events share this id, so the cooldown history collides');
        }
        seen.add(e.id);

        // 0 never fires and is almost always a placeholder somebody meant to
        // come back to. Above 1 is not "very likely", it is a misunderstanding
        // of the unit, and it fires every quarter forever.
        if (!(e.chance > 0) || e.chance > 1) {
            at(e.id, 'impossible-chance', `chance is ${e.chance}; it must be greater than 0 and at most 1`);
        }

        // An event whose trigger can never hold is a scene nobody will read.
        // Only the flatly self-contradictory can be caught here - `not` around
        // a condition that is also required - but that is the shape a
        // copy-paste produces.
        for (const c of e.when) {
            if (c.kind === 'not' && e.when.some(o => JSON.stringify(o) === JSON.stringify(c.of))) {
                at(e.id, 'never-fires', `requires ${JSON.stringify(c.of)} and its negation`);
            }
        }

        if (known && !known.has(e.conversation.id)) {
            at(e.id, 'unregistered-conversation',
                `"${e.conversation.id}" is not in data/story/index.ts, so nothing can deliver it`);
        }

        // The whole point of the system: an event nobody hears about is
        // indistinguishable from a scripted beat.
        if (!e.headline || !e.headline.trim()) {
            at(e.id, 'silent', 'no headline - the world would never know this happened');
        }
    }

    return problems;
};
