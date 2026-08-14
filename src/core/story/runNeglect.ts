// src/core/story/runNeglect.ts
//
// ============================================================================
//  THE THIRD FILE IN THE SPLIT: THE ONE THAT TOUCHES THE GAME
// ============================================================================
//
//  neglect.ts decides who was ignored (pure). data/story/neglect.ts holds what
//  each of them says (data). This sends the message and moves the dial, and it
//  is the only part that needs a running app.
//
//  Called once a quarter from the tick, AFTER the inbox drains. The ordering is
//  not decoration: `runInbox` delivers this quarter's scenes, and a scene that
//  arrives this morning has not been ignored. Chasing before the drain would
//  have people complaining about silence in the same tick that they broke it.
// ============================================================================

import { useMessageStore } from '../store/useMessageStore';
import { useGameStore } from '../store/useGameStore';
import { useStoryStore } from '../store/useStoryStore';
import { CAST } from '../../data/story/cast';
import { NEGLECT_LINES } from '../../data/story/neglect';
import { whoWasIgnored, NEGLECT_STEP } from './neglect';

/**
 * Let everybody who has been ignored for a quarter say so.
 *
 * Returns the ids it chased, so the tick's test can assert on them without
 * reading three stores.
 */
export const runNeglect = (): string[] => {
    const month = useGameStore.getState().currentMonth;
    const store = useMessageStore.getState();

    const ignored = whoWasIgnored(store.threads, month)
        // Only the people who have something written for it. A thread from
        // somebody with no line stays unread and costs nothing, which is the
        // correct outcome: a mechanic that fires without any writing behind it
        // is a notification, and this exists precisely because a notification
        // was the wrong answer.
        .filter(id => !!NEGLECT_LINES[id]);

    for (const id of ignored) {
        const line = NEGLECT_LINES[id];
        const who = CAST[id];
        if (!who) continue;

        // The message first. If anything below throws, the player has still
        // been told - a silent dial move would be exactly the hidden counter
        // this design exists to avoid.
        store.sendFromCharacter(
            { id: who.id, name: who.name, role: who.role },
            line.text,
            month,
        );
        store.markChased(id, month);

        if (line.dial) {
            useStoryStore.getState().nudge(
                line.dial,
                line.direction === 'up' ? NEGLECT_STEP : -NEGLECT_STEP,
            );
        }
    }

    if (__DEV__ && ignored.length) {
        console.log(`[story] chased for silence: ${ignored.join(', ')}`);
    }
    return ignored;
};
