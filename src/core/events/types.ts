// src/core/events/types.ts
//
// ============================================================================
//  AN EVENT IS DATA
// ============================================================================
//
//  Three parts, and the third is the one that matters:
//
//      when   - the world state that makes it possible at all
//      chance - how likely it is per quarter once it is possible
//      scene  - a conversation, in the same graph format every other scene uses
//
//  WHY NOT THE EXISTING EVENT SYSTEM. There is one, in src/event/. It picks a
//  random string from a pool and applies a flat bag of stat deltas. It cannot
//  ask a question, cannot branch, cannot check whether the situation it
//  describes is actually true, and its output is a line of text that appears
//  in a field nobody displays. It works for the shelved life/love modules it
//  was written for and it is left alone.
//
//  This one reuses the story machinery wholesale: the `Condition` vocabulary
//  for triggers, `Conversation` for the scene, `Effect` for consequences, and
//  the inbox queue for delivery. That is not laziness - it is what makes the
//  audit able to check an event at all. A trigger written as a FUNCTION can
//  only be verified by running the game; written as data it can be read.
//
//  ---------------------------------------------------------------------------
//  THE FAILURE THIS SHAPE IS GUARDING AGAINST
//  ---------------------------------------------------------------------------
//  A random event system's characteristic bug is not crashing. It is firing
//  the wrong thing at the wrong time and looking fine: the supplier crisis
//  that arrives before you have a supplier, the scandal about a product you
//  discontinued. Every one of those is a trigger that was never checked
//  because checking it meant reproducing the state by hand.
// ============================================================================

import type { Condition } from '../story/conditions';
import type { Conversation } from '../story/graph';

export interface GameEvent {
    id: string;

    /**
     * Everything that must hold before this can happen at all.
     *
     * Separate from the conversation's own `when` on purpose. This gates the
     * ROLL; the conversation's gate is checked again at DELIVERY, a quarter or
     * more later, and by then the world may have moved. Both are needed and
     * they answer different questions.
     */
    when: Condition[];

    /**
     * Chance per quarter, 0..1, once `when` holds.
     *
     * Not a weight and not a one-in-N: a plain probability, because that is
     * the only form a writer can reason about without knowing what else is in
     * the pool. The audit refuses anything outside (0, 1].
     */
    chance: number;

    /**
     * Quarters that must pass before it can fire again.
     *
     * Omitted means ONCE PER GAME, which is the right default: most events
     * worth writing are things that happen to a company once. Repeatable ones
     * have to say so, so a repeat is always a decision somebody made.
     */
    cooldown?: number;

    /** The scene. Registered in data/story/index.ts like any other. */
    conversation: Conversation;

    /**
     * What the world reads about it.
     *
     * Required, and that is the point of the whole prompt: an event the player
     * only learns about through a private message is indistinguishable from a
     * scripted beat. The wire is what makes it feel like something that
     * happened rather than something aimed at them.
     */
    headline: string;

    /**
     * Higher wins when several fire in the same quarter. Default 0.
     *
     * Ties break by the order in the file, so a pack of equal-priority events
     * fires in a stable sequence rather than whatever order the roll produced.
     */
    priority?: number;
}

/** What the roller decides. */
export interface EventRoll {
    /** Passed `when` and survived the dice. Ordered by priority, then file order. */
    fired: GameEvent[];
    /** Passed `when` but lost the roll or the quarter's budget. For tests and dev. */
    eligible: GameEvent[];
}

/** One line per firing, so a repeat can be refused and a cooldown measured. */
export interface EventHistory {
    /** Event id -> the last quarter it fired in. */
    lastFired: Record<string, number>;
}

export const emptyHistory = (): EventHistory => ({ lastFired: {} });
