// src/features/love/logic/startRelationship.ts
//
// ============================================================================
//  WHAT IT COSTS TO LEAVE SOMEBODY FOR SOMEBODY ELSE
// ============================================================================
//
//  There are two ways into a relationship in this game and until now only one
//  of them was real. The VIP encounter called `setPartner` and ran a whole
//  cheating settlement; the swipe app set a status flag and stored NOTHING,
//  so a match showed an overlay and evaporated. Reported as "date de
//  eslesince de profilde esin dursun".
//
//  Wiring the swipe app to do the same thing meant either calling the
//  encounter's code or copying it. Copying forty lines of settlement
//  arithmetic into a second file is how two rules that are meant to be one
//  drift the first time either is edited - the same reasoning that put the
//  reach recovery formula in one place and the avatar in one component.
//
//  So the DECISION lives here, pure and testable, and each caller does its
//  own store writes. What is shared is the part that would have drifted.
// ============================================================================

import type { PartnerProfile, PartnerStats } from '../../../data/relationshipTypes';
import type { HookupCandidate } from '../../life/components/hookupData';
import { generatePartner } from './partnerGenerator';

/** How jealous somebody has to be before they are watching. */
export const JEALOUS_ENOUGH_TO_NOTICE = 70;
/** The chance of being caught by a jealous partner, and by an unbothered one. */
export const CATCH_CHANCE_JEALOUS = 50;
export const CATCH_CHANCE_CALM = 10;
/** What an unprotected marriage costs. Half of everything. */
export const DIVORCE_SHARE = 0.5;

export type CheatingOutcome = {
    /** Whether they found out. */
    caught: boolean;
    /** What it costs, in money. Zero unless married without a prenup. */
    settlement: number;
    /** The chance that was rolled against, so a screen can explain itself. */
    catchChance: number;
};

/**
 * What happens when you leave the partner you have for a new one.
 *
 * PURE. `roll` is 0..100 and is passed in rather than drawn here, so a test
 * can ask what happens at 49.9 and at 50.1 instead of running the thing a
 * thousand times and hoping.
 *
 * A MARRIAGE IS ALWAYS FOUND OUT. Not an oversight: the settlement is the
 * whole point of the prenup question the game asks at the altar, and a
 * marriage you could cheat on with a nine in ten chance of getting away with
 * it would make that question meaningless.
 */
export const cheatingOutcome = (
    partner: PartnerProfile | null | undefined,
    money: number,
    roll: number,
): CheatingOutcome => {
    if (!partner) return { caught: false, settlement: 0, catchChance: 0 };

    const settlement = partner.isMarried && !partner.hasPrenup
        ? Math.max(0, money) * DIVORCE_SHARE
        : 0;

    const catchChance = partner.isMarried
        ? 100
        : (partner.stats?.jealousy ?? 0) > JEALOUS_ENOUGH_TO_NOTICE
            ? CATCH_CHANCE_JEALOUS
            : CATCH_CHANCE_CALM;

    return { caught: roll < catchChance, settlement, catchChance };
};

/**
 * Turn a swipe card into somebody the rest of the game can hold.
 *
 * A HookupCandidate carries a name, an age, a gender and very little else -
 * it was built to be looked at once and thrown away. A PartnerProfile needs
 * fifteen more fields, and every screen that shows a partner reads them.
 *
 * Rather than invent those fields here, this borrows a generated partner and
 * keeps only their statistics. That way the swipe app and the VIP encounter
 * produce people of the same SHAPE, and the psychometrics the whole
 * relationship system runs on cannot arrive empty - which is a bug this file
 * is named after avoiding, and one partnerGenerator.ts already carries a note
 * about.
 *
 * The identity is the candidate's: their id, their name, their age, their
 * gender. The age especially, because it is printed beside their face.
 */
export const partnerFromCandidate = (c: HookupCandidate): PartnerProfile => {
    const base = generatePartner();
    return {
        ...base,
        id: c.id,
        name: c.name,
        gender: c.gender,
        stats: {
            ...(base.stats as PartnerStats),
            age: c.age,
            occupation: c.job || base.stats.occupation,
        },
        // A match is the start of something, not the middle of it.
        love: Math.max(35, Math.min(70, 100 - c.difficulty)),
        relationYears: 0,
        isMarried: false,
        hasPrenup: false,
    };
};
