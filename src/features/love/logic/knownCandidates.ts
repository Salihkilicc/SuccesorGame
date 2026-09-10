// src/features/love/logic/knownCandidates.ts
//
// ============================================================================
//  THE DATE BUTTON ONLY EVER PRODUCED A STRANGER
// ============================================================================
//
//  Asked for as: "kumarhanede kullandigimiz karakterlere partner cardlar
//  yaratip profildeki date e basinca cikan partner cardlarini artirmakti."
//
//  The first version of this got it half right. A magnate who wrote to you
//  after a poker table would turn up when you next went looking - that works
//  and it is worth having - but a player who never touches poker presses Date
//  and gets a person generated on the spot, every single time, for the whole
//  dynasty. The sixty one written characters were reachable through exactly
//  one door, and it was a door in a different feature.
//
//  So the pool itself is wider now. Some of the time the person standing there
//  is somebody who exists: a name that was typed by a person, a face on disk, a
//  line about where their money is, and a seat at a table the player may well
//  have sat at.
//
//  ---------------------------------------------------------------------------
//  WHICH ROOM EACH OF THEM IS IN, AND THE FOUR THAT HAVE NOBODY
//  ---------------------------------------------------------------------------
//  Magnates are HIGH_SOCIETY and rival chief executives are CORPORATE_ELITE,
//  the same split `tierForSeat` makes for the poker table, because it is the
//  same fact and it must not be answered twice.
//
//  GLOBAL_ELITE, ARTISTIC, UNDERGROUND, BLUE_COLLAR and STUDENT_LIFE have no
//  named people at all and always generate. That is not a hole to be filled
//  later: there is nobody written for those rooms, and inventing sixty more
//  names to make the table symmetrical would produce exactly the strangers
//  this file exists to dilute.
//
//  PURE. No stores, no clock, and the die is injected.
// ============================================================================

import {
    CEO_FEMALE, CEO_NAMES, MAGNATES, seatGender,
} from '../../../core/casino/pokerTable';
import { SAME_GENDER_CHANCE } from './partnerGenerator';
import type { KnownPerson } from './partnerGenerator';
import type { SocialTier } from '../../../data/relationshipTypes';

/**
 * How often the person who turns up is somebody who already exists.
 *
 * A third. The number is a balance between two failures that are both easy to
 * fall into:
 *
 *   too LOW and the sixty one stay a curiosity - forty magnates against an
 *   endless generator is a rounding error, and the player never learns that
 *   the people at the table are people they can meet.
 *
 *   too HIGH and the room shrinks. There are forty magnates; at three
 *   quarters, a player who dates through one generation has met most of them
 *   and the pool feels smaller than the one it replaced, not bigger.
 *
 *   And it can only ever apply to two of the seven rooms, so a third of the
 *   time in those two is much less than a third of the time overall.
 */
export const KNOWN_CHANCE = 1 / 3;

/** Everybody the game has written for this room. */
export const namedFor = (tier: SocialTier): KnownPerson[] => {
    if (tier === 'HIGH_SOCIETY') {
        return MAGNATES.map(m => ({
            id: m.id,
            name: m.name,
            gender: (m.female ? 'female' : 'male') as 'male' | 'female',
            tier,
            known: m.of,
        }));
    }
    if (tier === 'CORPORATE_ELITE') {
        return Object.entries(CEO_NAMES).map(([stockId, name]) => ({
            id: stockId,
            name,
            gender: (CEO_FEMALE[stockId] ? 'female' : 'male') as 'male' | 'female',
            tier,
            // Their company is a brand name and stays as it is. The registry
            // returns anything it does not know unchanged.
            known: name,
        }));
    }
    return [];
};

/**
 * Somebody real for this room, or null to generate a stranger.
 *
 * `taken` is who the player must not be offered: the partner they already
 * have and everybody they have already been with. Without it a player who
 * broke up with Sylvie Valmorel meets her again as a brand new candidate with
 * no memory of any of it, which is worse than never meeting her at all.
 *
 * `roll` is injected so the mix can be measured rather than asserted.
 */
export const drawKnown = (
    tier: SocialTier,
    playerGender: 'male' | 'female' | undefined,
    taken: ReadonlySet<string>,
    roll: () => number = Math.random,
): KnownPerson | null => {
    const pool = namedFor(tier);
    if (pool.length === 0) return null;
    if (roll() >= KNOWN_CHANCE) return null;

    // Which way this draw leans, on the same rule the generator uses: mostly
    // the other one, sometimes not. Drawn BEFORE the pool is filtered so a
    // room that happens to be mostly men cannot become mostly men again.
    const wants: 'male' | 'female' | undefined =
        playerGender === 'male' || playerGender === 'female'
            ? (roll() < SAME_GENDER_CHANCE
                ? playerGender
                : (playerGender === 'female' ? 'male' : 'female'))
            : undefined;

    const free = pool.filter(p =>
        !taken.has(p.id) && (!wants || seatGender(p.id) === wants));
    // Everybody in this room is either spoken for or the wrong way round.
    // A stranger is the honest answer; the alternative is offering an ex.
    if (free.length === 0) return null;

    const die = Math.min(0.999999, Math.max(0, roll()));
    return free[Math.floor(die * free.length)];
};
