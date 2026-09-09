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
import { currentQuarter, readStanding } from '../../../core/story/world';
import { generatePartner } from './partnerGenerator';
import { refusalLine, VOICE_FOR_PERSONALITY } from '../data/strainLines';
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

// ============================================================================
//  A REFUSAL COST THE PLAYER A RUNG, AND THEN ANOTHER
// ============================================================================
//
//  Reported as the partners not getting richer as the company does. The rule
//  looked right and the arithmetic was right: `tiersOpenTo` tracks the money
//  exactly, and one tap in a clean quarter always produced the best room.
//
//  The DEMOTION was in the search. It took the best room NOT COOLING OFF, and
//  a refusal shuts a room - so the second tap after a no got the next room
//  down, and the third got the one below that. Measured over one quarter of
//  ordinary tapping at a billion dollars:
//
//      refused -> ARTISTIC -> ARTISTIC -> ARTISTIC -> refused
//              -> BLUE_COLLAR -> refused -> STUDENT_LIFE
//
//  Eight taps from old money to a student bar, with the company untouched.
//  From the seat that is indistinguishable from the wealth doing nothing,
//  because the FIRST card is the one that sets the expectation and every one
//  after it is worse.
//
//  It also explains something that never made sense: UNDERGROUND is bottom of
//  TIER_STANDING and is therefore never the best room at ANY wealth, so the
//  cascade was the only way anybody ever reached it. A fallback that can only
//  be found by being turned down twice is not a design, it is a leak.
//
//  So the room you have EARNED is the room you get. If it is shut, the answer
//  is nobody and you come back next quarter, which is what the cooldown was
//  written to mean: "tapping again is not a re-roll".
// ============================================================================

/** The best room this company can walk into, cooling off or not. */
export const earnedTier = (): SocialTier | null => {
    const open = tiersOpenTo(useStatsStore.getState().companyValue || 0);
    return open.length > 0 ? open[open.length - 1] : null;
};

/**
 * Look for somebody.
 *
 * `roll` is injected so the whole thing can be tested without a coin. The game
 * passes nothing.
 */
export const runCourtship = (roll: () => number = Math.random): CourtshipResult => {
    // THE ROOM THEY EARNED, not the best one that happens to be open. See
    // the note above: taking the best OPEN room turned every refusal into a
    // demotion, and a billion dollar company reached students in eight taps.
    const tier = earnedTier();
    if (!tier) return { kind: 'nobody' };

    // Shut means shut. Being turned down by old money on Tuesday does not
    // make anybody want to be introduced to a student on Wednesday.
    if (!availableTiers().includes(tier)) return { kind: 'nobody' };
    const candidate = generatePartner(tier);

    const { accepted } = courtshipFor(candidate, {
        // What you did PLUS what you are worth. See core/story/standing.ts:
        // the dial is what the story made it and the money is added on top,
        // capped at 100.
        publicReputation: readStanding(),
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
        refusalLine(voice, roll),
        useGameStore.getState().currentMonth,
    );

    useFamilyStore.getState().noteRefusal(tier, currentQuarter() + REFUSAL_COOLDOWN_QUARTERS);

    if (__DEV__) console.log(`[courtship] refused at ${tier}; that room is shut for ${REFUSAL_COOLDOWN_QUARTERS} quarters.`);
    return { kind: 'refused', candidate, tier };
};
