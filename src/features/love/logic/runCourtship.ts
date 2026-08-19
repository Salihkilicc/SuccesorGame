// src/features/love/logic/runCourtship.ts
//
// ============================================================================
//  THE HALF THAT TOUCHES THE GAME
// ============================================================================
//
//  courtship.ts decides who is in the room and whether they are interested.
//  This picks the room, generates the person, and - when they say no - sends
//  the refusal as a message and shuts that room for a while.
//
//  Same three-way split as everything else in this feature.
// ============================================================================

import { useFamilyStore } from '../../../core/store/useFamilyStore';
import { useMessageStore } from '../../../core/store/useMessageStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useStoryStore } from '../../../core/store/useStoryStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { currentQuarter } from '../../../core/story/world';
import { generatePartner } from './partnerGenerator';
import { REFUSAL_LINES, VOICE_FOR_PERSONALITY } from '../data/strainLines';
import {
    tiersOpenTo, courtshipFor, REFUSAL_COOLDOWN_QUARTERS,
} from './courtship';
import type { PartnerProfile, SocialTier } from '../../../data/relationshipTypes';

export type CourtshipResult =
    /** Somebody is interested. The screen shows the card. */
    | { kind: 'candidate'; candidate: PartnerProfile; tier: SocialTier }
    /** They were not. The message has already been sent. */
    | { kind: 'refused'; candidate: PartnerProfile; tier: SocialTier }
    /** Every room the player can reach has recently said no. */
    | { kind: 'nobody' };

/**
 * Which rooms will see the player right now.
 *
 * Money opens them; a recent refusal shuts one for a couple of quarters. If
 * every open room is cooling off the answer is nobody, and that is a better
 * answer than producing a card the player cannot act on.
 */
export const availableTiers = (): SocialTier[] => {
    const value = useStatsStore.getState().companyValue || 0;
    const cooldown = useFamilyStore.getState().courtshipCooldown ?? {};
    const now = currentQuarter();
    return tiersOpenTo(value).filter(t => (cooldown[t] ?? 0) <= now);
};

/**
 * Look for somebody.
 *
 * `roll` is injected so the whole thing can be tested without a coin. The game
 * passes nothing.
 */
export const runCourtship = (roll: () => number = Math.random): CourtshipResult => {
    const open = availableTiers();
    if (open.length === 0) return { kind: 'nobody' };

    // The best room open to them. A player who can reach old money is not
    // introduced to students - that is what the money was for.
    const tier = open[open.length - 1];
    const candidate = generatePartner(tier);

    const { accepted } = courtshipFor(candidate, {
        publicReputation: useStoryStore.getState().dials.publicReputation ?? 0,
        companyValue: useStatsStore.getState().companyValue || 0,
    }, tier, roll);

    if (accepted) return { kind: 'candidate', candidate, tier };

    // ------------------------------------------------------------------
    //  A REFUSAL ARRIVES FROM THE PERSON
    // ------------------------------------------------------------------
    //  Rather than a card quietly not coming back. It costs a thread on the
    //  phone for somebody the player has not met properly, and it buys the
    //  thing silence cannot: they find out they were turned down, from the
    //  person who turned them down, in the app where everything else in this
    //  game happens.
    // ------------------------------------------------------------------
    const voice = VOICE_FOR_PERSONALITY[candidate.personality?.id ?? ''] ?? 'measured';
    useMessageStore.getState().sendFromCharacter(
        { id: `courtship-${candidate.id}`, name: candidate.name, role: candidate.stats.occupation },
        REFUSAL_LINES[voice],
        useGameStore.getState().currentMonth,
    );

    useFamilyStore.getState().noteRefusal(tier, currentQuarter() + REFUSAL_COOLDOWN_QUARTERS);

    if (__DEV__) console.log(`[courtship] refused at ${tier}; that room is shut for ${REFUSAL_COOLDOWN_QUARTERS} quarters.`);
    return { kind: 'refused', candidate, tier };
};
