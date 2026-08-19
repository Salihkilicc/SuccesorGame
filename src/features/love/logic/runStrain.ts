// src/features/love/logic/runStrain.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE GAME
// ============================================================================
//
//  strain.ts decides (pure). data/strainLines.ts holds what they say. This
//  sends it, moves the number, and handles them leaving. Same three-way split
//  as the story, for the same reason: the rule is the part worth testing
//  without a device.
//
//  Called once a quarter from the tick, AFTER the neglect pass - it reads the
//  same "has this thread gone a quarter unanswered" fact, and reading it
//  before the chase would mean the partner complaining about a silence in the
//  same tick it was broken.
// ============================================================================

import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useMessageStore } from '../../../core/store/useMessageStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { whoWasIgnored } from '../../../core/story/neglect';
import { STRAIN_LINES, DEPARTURE_LINES, VOICE_FOR_PERSONALITY } from '../data/strainLines';
import { strainFor, hasLeft, leavesLoudly, SCANDAL_REPUTATION } from './strain';

/**
 * The thread id a partner's messages land on.
 *
 * A constant rather than the partner's own id, because the partner CHANGES and
 * the thread is a place rather than a person - the same way the CFO's thread
 * survives him being replaced. It also means an ex does not leave a thread
 * behind with somebody else's name at the top of the list.
 */
export const PARTNER_THREAD_ID = 'partner';

const say = (name: string, text: string, month: number) =>
    useMessageStore.getState().sendFromCharacter(
        { id: PARTNER_THREAD_ID, name, role: 'Partner' }, text, month,
    );

/**
 * One quarter of the relationship.
 *
 * Returns what it did, so the tick's test can assert on it without reading
 * three stores.
 */
export const runStrain = (conduct: {
    overtime: boolean;
    casinoStreak: number;
}): { loveChange: number; left: boolean; reason: string | null } => {
    const family = useFamilyStore.getState();
    const partner = family.partner;
    if (!partner) return { loveChange: 0, left: false, reason: null };

    const month = useGameStore.getState().currentMonth;

    // The same fact core/story/neglect.ts acts on, read from the same place.
    // Two systems agreeing by construction rather than by coincidence.
    const ignored = whoWasIgnored(useMessageStore.getState().threads, month)
        .includes(PARTNER_THREAD_ID);

    const { loveChange, reason } = strainFor(partner, {
        overtime: conduct.overtime,
        casinoStreak: conduct.casinoStreak,
        ignored,
    });

    if (loveChange < 0) {
        family.updateLove(loveChange);
        if (reason) {
            const voice = VOICE_FOR_PERSONALITY[partner.personality?.id ?? ''] ?? 'measured';
            say(partner.name, STRAIN_LINES[voice][reason], month);
        }
    }

    // ------------------------------------------------------------------
    //  AND WHEN IT RUNS OUT
    // ------------------------------------------------------------------
    //  Read AFTER the change above, from the store rather than from the local
    //  copy: `updateLove` clamps at zero and this has to see the clamped
    //  number, or a partner at 2 losing 8 would be at -6 here and gone next
    //  quarter instead of this one.
    // ------------------------------------------------------------------
    const after = useFamilyStore.getState().partner;
    if (!hasLeft(after)) return { loveChange, left: false, reason };

    const loud = leavesLoudly(after!);
    say(after!.name, DEPARTURE_LINES[loud ? 'loud' : 'quiet'], month);
    family.breakup('drifted');

    if (loud) {
        // `crazy`'s one job, and it costs the thing a CEO cannot buy back
        // quickly. Somebody with nothing left to lose talks to people who ask.
        useStoryStore.getState().nudge('publicReputation', -SCANDAL_REPUTATION);
    }

    if (__DEV__) console.log(`[partner] left, ${loud ? 'loudly' : 'quietly'}.`);
    return { loveChange, left: true, reason };
};
