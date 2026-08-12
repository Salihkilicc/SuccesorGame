// src/core/events/runQuarter.ts
//
// ============================================================================
//  THE ONLY PLACE EVENTS TOUCH THE GAME
// ============================================================================
//
//  Same split as the story: engine.ts decides, this performs. The decision is
//  pure and tested with fixed dice; everything below is stores.
//
//  ORDER MATTERS AND IT IS NOT OBVIOUS.
//
//    1. roll        - against the world as it stands after the quarter's maths
//    2. publish     - the headline, immediately
//    3. schedule    - the conversation, at afterQuarters 0
//    4. runInbox    - drains the queue, honouring the two-a-quarter allowance
//
//  The headline goes out even when the inbox is full and the conversation
//  waits. That is on purpose and it is the whole reason news exists: the world
//  finds out on its own schedule, not on the player's. Reading a headline
//  about your own recall before your COO has got to you is a better quarter
//  than either half alone.
// ============================================================================

import { EVENTS } from '../../data/events';
import { useStoryStore } from '../store/useStoryStore';
import { useNewsStore } from '../store/useNewsStore';
import { useGameStore } from '../store/useGameStore';
import { readWorld, currentQuarter } from '../story/world';
import { rollQuarter } from './engine';
import type { EventHistory } from './types';

/**
 * Roll the quarter's events and set them in motion.
 *
 * Called from the tick immediately before runInbox, so anything that fires can
 * be delivered in the same quarter if there is room for it.
 */
export const runEvents = (): void => {
    const quarter = currentQuarter();
    const world = readWorld();
    const story = useStoryStore.getState();
    const history: EventHistory = story.eventHistory ?? { lastFired: {} };

    const { fired } = rollQuarter(EVENTS, world, history, quarter);
    if (fired.length === 0) return;

    const month = useGameStore.getState().currentMonth;
    const lastFired = { ...history.lastFired };

    for (const e of fired) {
        useNewsStore.getState().publish(e.headline, 'company', month);
        useStoryStore.getState().schedule({
            conversationId: e.conversation.id,
            dueQuarter: quarter,
            queuedAtQuarter: quarter,
            // Not urgent. An event that bypassed the allowance could push a
            // story beat out of the quarter, and the spine outranks the dice.
            // If the inbox is busy this waits, and the headline has already
            // told the player something is coming.
            expiresAfter: 4,
        });
        lastFired[e.id] = quarter;
    }

    useStoryStore.getState().setEventHistory({ lastFired });
};
