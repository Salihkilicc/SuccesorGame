// src/features/casino/logic/tableSuitor.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE GAME
// ============================================================================
//
//  tableInterest.ts decides WHO, out of a table and a coin, and knows about no
//  stores at all. This sends the message and holds the interest, and knows
//  nothing about who is eligible.
//
//  Same three way split as the rest of this project, and the reason is the
//  same: the rule can then be measured over ten thousand tables without a game
//  running, which is the only way the rate is ever actually checked.
// ============================================================================

import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useMessageStore } from '../../../core/store/useMessageStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { t } from '../../../core/i18n';
import { translateOccupation } from '../../../data/i18n/profileLoveShopText';
import { suitorFrom } from './tableInterest';
import type { Opponent } from '../../../core/casino/pokerTable';

/**
 * How many lines they might open with. One is picked from their seat id, so
 * the same person always says the same thing - see the note in
 * love/logic/partnerGenerator about why these people must not re-roll.
 */
export const SUITOR_LINES = 4;

/**
 * Somebody stood up from that table and wrote to you. Maybe.
 *
 * Returns whether a message was sent, so a test can measure the rate without
 * reading the store. The game ignores the return.
 *
 * ---------------------------------------------------------------------------
 *  IT REFUSES WHILE THE PLAYER HAS SOMEBODY
 * ---------------------------------------------------------------------------
 *  Not a moral position: a message from a magnate while there is a partner at
 *  home would sit in the inbox as an invitation to cheat that the player never
 *  asked for, and cheating in this game is a decision made on a card with a
 *  settlement figure on it. The door stays where the consequence is.
 */
export const offerTableSuitor = (table: readonly Opponent[]): boolean => {
    const family = useFamilyStore.getState();
    if (family.partner) return false;

    const suitor = suitorFrom(table, useIdentityStore.getState().gender as 'male' | 'female' | undefined);
    if (!suitor) return false;

    family.noteSuitor({
        id: suitor.id,
        name: suitor.name,
        gender: suitor.gender,
        company: suitor.company,
        tier: suitor.tier,
    });

    // The thread is keyed on their SEAT id, so writing twice across two
    // sessions continues one conversation with one person rather than opening
    // a second thread with the same name in it.
    useMessageStore.getState().sendFromCharacter(
        {
            id: `table-${suitor.id}`,
            name: suitor.name,
            role: translateOccupation(suitor.company || ''),
        },
        t(`casino.suitor${lineFor(suitor.id)}`),
        useGameStore.getState().currentMonth,
    );
    return true;
};

/** Which of the four lines this person opens with. Stable, from their id. */
export const lineFor = (id: string): number => {
    let h = 2166136261;
    for (let i = 0; i < (id || '').length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % SUITOR_LINES;
};
