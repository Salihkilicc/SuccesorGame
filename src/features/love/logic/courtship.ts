// src/features/love/logic/courtship.ts
//
// ============================================================================
//  WHO SHOWS UP, AND WHETHER THEY SAY YES
// ============================================================================
//
//  `generatePartner` takes a `forcedTier` and NOBODY passed it. So the tier was
//  uniform random: a bankrupt chief executive met dynasty heiresses at exactly
//  the same rate as a billionaire, and the encounter screen was a slot machine
//  with faces on it.
//
//  ---------------------------------------------------------------------------
//  TWO NUMBERS, DOING TWO DIFFERENT JOBS
//  ---------------------------------------------------------------------------
//  The obvious version is one "prestige" score, and it is wrong because it
//  makes the two things the player can build redundant with each other.
//
//    COMPANY VALUE decides WHO SHOWS UP. Money opens rooms. Two million and you
//    are meeting students and shift managers; two billion and you are at the
//    table with old money.
//
//    PUBLIC REPUTATION decides WHETHER THEY SAY YES. Money gets you into the
//    room; being respected gets you a second conversation.
//
//  What that split buys is a story neither number could tell alone: a RICH,
//  DISGRACED chief executive meets heiresses and is refused by all of them.
//  The FBI conviction, the board asking for a written statement, an ex with a
//  high `crazy` talking to a journalist - all of those already move
//  `publicReputation`, so a refusal is the rest of the game arriving rather
//  than a separate system.
//
//  ---------------------------------------------------------------------------
//  AND ONE TIER DOES NOT CARE WHAT YOU ARE WORTH
//  ---------------------------------------------------------------------------
//  UNDERGROUND is open from the first quarter. They will always talk to you,
//  which is exactly what makes them the tier with the reputation penalty
//  attached: the room that is always open is the one it costs to be seen in.
//
//  PURE. No stores, no clock, and the die is injected.
// ============================================================================

import type { SocialTier } from '../../../data/relationshipTypes';
import type { PartnerProfile } from '../../../data/relationshipTypes';

/**
 * What the company has to be worth before a tier will meet you.
 *
 * Read against `companyValue`, which starts at three million - so a new player
 * is in the bottom two rooms and the criminal one, and everything else is
 * something to grow into.
 */
export const TIER_UNLOCK: Record<SocialTier, number> = {
    STUDENT_LIFE: 0,
    BLUE_COLLAR: 0,
    // Open from the first quarter, deliberately. See the note above.
    UNDERGROUND: 0,
    ARTISTIC: 50_000_000,
    CORPORATE_ELITE: 500_000_000,
    HIGH_SOCIETY: 5_000_000_000,
};

/**
 * The rooms in order of standing, worst to best.
 *
 * SEPARATE FROM `TIER_UNLOCK`, and it has to be. `runCourtship` picked the
 * best open room with `open[open.length - 1]`, which is the last key of an
 * object literal rather than the most prestigious tier - and the three
 * zero-cost tiers happen to be listed STUDENT_LIFE, BLUE_COLLAR, UNDERGROUND.
 *
 * So every player below fifty million was introduced to CRIMINALS, every
 * single time, because of the order three keys happened to be typed in.
 *
 * UNDERGROUND ranks at the bottom on purpose. It is the room that is always
 * open, which makes it the fallback rather than the default - and being the
 * default is exactly what it must never be, since it is the one that costs
 * reputation to be seen in.
 */
export const TIER_STANDING: SocialTier[] = [
    'UNDERGROUND',
    'STUDENT_LIFE',
    'BLUE_COLLAR',
    'ARTISTIC',
    'CORPORATE_ELITE',
    'HIGH_SOCIETY',
];

/** Which rooms are open to a company of this size, worst to best. */
export const tiersOpenTo = (companyValue: number): SocialTier[] =>
    TIER_STANDING.filter(tier => (companyValue || 0) >= TIER_UNLOCK[tier]);

/**
 * How far above the player's own standing a room is.
 *
 * Zero for the rooms they belong in, rising for the ones they have only just
 * unlocked. It is what stops the moment a threshold is crossed from being a
 * light switch: you can get into the room a quarter after you can afford it,
 * and be told no for a while longer.
 */
export const reachAbove = (tier: SocialTier, companyValue: number): number => {
    const bar = TIER_UNLOCK[tier];
    if (bar <= 0) return 0;
    const ratio = (companyValue || 0) / bar;
    if (ratio >= 3) return 0;      // comfortably one of them
    if (ratio >= 1.5) return 6;    // recently arrived
    return 15;                     // just through the door
};

/** Below this, nobody is interested whatever the room. */
export const REPUTATION_FLOOR = 15;

// ---------------------------------------------------------------------------
//  THE NUMBERS, AND WHAT THEY WERE BEFORE
// ---------------------------------------------------------------------------
//  The first draft ran at 10 to 21 per cent across the whole game, so finding
//  anybody took four or five taps. Worse, it got HARDER as the company grew -
//  13 per cent at a hundred million, 10 at a billion - because `reachAbove`
//  bit the moment a threshold was crossed. Growing the company made dating
//  worse, which is backwards from the entire design.
//
//  Measured rather than guessed, and the fault was that `looks` was the
//  DOMINANT term: at 0.35 a striking candidate took 35 points off a
//  reputation that starts at 50. The number that is supposed to decide this
//  was the second largest thing in the sum.
//
//  Now: reputation is most of it, everything else is a trim, and there is a
//  base so that being nobody in particular is not the same as being disliked.
// ---------------------------------------------------------------------------

/** Where everybody starts before their standing is counted. */
export const COURTSHIP_BASE = 35;

/** How much of `publicReputation` carries into the answer. */
export const REPUTATION_WEIGHT = 0.7;

/** What a partner's own standards add. Somebody impressive is harder work. */
export const LOOKS_RESISTANCE = 0.15;

/** And somebody who does not need your money is harder to impress with it. */
export const WEALTH_RESISTANCE = 0.05;

export type Courtship = {
    accepted: boolean;
    /** 0-100, for the log and for the test. */
    chance: number;
};

/**
 * Whether this person is interested.
 *
 * `publicReputation` is the whole of the player's side of it. Money already
 * decided that this person is standing in front of them; what happens next is
 * about whether being with them is a good idea.
 */
export const courtshipFor = (
    candidate: PartnerProfile,
    world: { publicReputation: number; companyValue: number },
    tier: SocialTier,
    roll: () => number = Math.random,
): Courtship => {
    const standing = Math.max(0, world.publicReputation ?? 0);

    const chance = Math.max(0, Math.min(100,
        COURTSHIP_BASE
        + standing * REPUTATION_WEIGHT
        - reachAbove(tier, world.companyValue)
        // Their own standards. `looks` is otherwise cosmetic and this is the
        // one place it is allowed to decide anything, because it is the one
        // thing about them the player can see before asking. A TRIM, not the
        // deciding term - see the note above.
        - (candidate.stats?.looks ?? 50) * LOOKS_RESISTANCE
        - (candidate.stats?.familyWealth ?? 0) * WEALTH_RESISTANCE,
    ));

    if (standing < REPUTATION_FLOOR) return { accepted: false, chance: 0 };
    return { accepted: roll() * 100 <= chance, chance };
};

/**
 * How long a room stays shut after it has said no.
 *
 * Two quarters. A refusal that costs nothing is a re-roll, and a player who
 * can tap again immediately will tap until it lands - which is the slot
 * machine this file exists to replace.
 *
 * The COOLDOWN IS ON THE TIER, not on the person. Candidates are generated
 * fresh every time and their ids mean nothing, so remembering an individual
 * would remember nobody. Being knocked back at a level and finding that level
 * cooler for a while is also the truer version: word gets around a small room.
 */
export const REFUSAL_COOLDOWN_QUARTERS = 2;
