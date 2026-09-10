// src/features/casino/logic/tableInterest.ts
//
// ============================================================================
//  THE PEOPLE YOU ALREADY MET, AND THE PEOPLE YOU ARE OFFERED
// ============================================================================
//
//  These were two unrelated populations. The poker table seats rival chief
//  executives and magnates - sixty one hand written people with faces, with
//  companies, with a history against the player. The dating pool generates a
//  stranger out of 66,040 name combinations who has never existed before and
//  will never exist again.
//
//  So the game had a room full of people the player knows and a door that
//  opened onto nobody in particular, and the two never touched.
//
//  Asked for as "kumarhanedeki herkes": somebody you sat across from should
//  be somebody you can approach.
//
//  ---------------------------------------------------------------------------
//  IT ARRIVES AS A MESSAGE, WHICH IS THE CHOSEN SHAPE
//  ---------------------------------------------------------------------------
//  Not a button on the seat. You leave the table, and one of them writes. The
//  reason that shape is better here is the same reason `runCourtship` sends a
//  refusal as a message: this game says things to the player through the phone,
//  and a person who was interested and said so later reads as a person, where a
//  "court" button under a face reads as a menu.
//
//  What this file decides is WHO, and it decides nothing about what happens
//  next: `courtshipFor` still asks whether they are actually interested when
//  the player goes to find them, and can still say no.
//
//  ---------------------------------------------------------------------------
//  AND ONLY THE NAMED ONES
//  ---------------------------------------------------------------------------
//  Chosen deliberately over "everybody but your own directors":
//
//    a STRANGER is a first name off a regional list with no sex recorded, no
//    company and no story. A card for one would be a generated person wearing
//    a borrowed name, which is what the dating pool already produces.
//
//    a DIRECTOR of your own company has a whole screen already
//    (MemberInteractionModal) and courting one is a governance question rather
//    than a romantic one.
//
//  So: `ceo` and `magnate`. Sixty one people, every one of them written by
//  hand, every one with a face on disk and a line about where their money is.
//
//  PURE. No stores, no clock, and the die is injected.
// ============================================================================

import { seatGender, type Opponent } from '../../../core/casino/pokerTable';
import { SAME_GENDER_CHANCE } from '../../love/logic/partnerGenerator';
import type { SocialTier } from '../../../data/relationshipTypes';

/**
 * How often one eligible seat writes to you.
 *
 * Per PERSON at the table, not per table. A noir table is four named people,
 * so at one in twelve a night out produces a message about a third of the
 * time - often enough to be a thing that happens, rare enough that walking
 * into the room is not a way to farm partners.
 *
 * And it is the only gate on the arithmetic side. What stops a player
 * collecting all sixty one is the rest of the system: `courtshipFor` refuses
 * them, a refusal shuts the room for two quarters, and having a partner at
 * home makes a second one cheating.
 */
export const SUITOR_CHANCE = 1 / 12;

/** Who at this table could ever write. */
export const eligibleSeats = (table: readonly Opponent[]): Opponent[] =>
    (table || []).filter(o =>
        (o.kind === 'ceo' || o.kind === 'magnate') && !!seatGender(o.id));

/**
 * Where a named player at the table sits socially.
 *
 * ---------------------------------------------------------------------------
 *  THEIR ROOM, NOT THE PLAYER'S
 * ---------------------------------------------------------------------------
 *  The tempting version is to give them the tier the player has unlocked, so
 *  the card always looks impressive. That is backwards and it would undo the
 *  whole of the upkeep ladder: a magnate is a magnate whether the player is
 *  worth three million or three trillion, and the card should say so.
 *
 *  What the player's own wealth decides is whether they get anywhere, and
 *  `courtship.reachAbove` already does that - reaching two rooms above
 *  yourself is punished, and being turned down costs you the room for a
 *  couple of quarters.
 *
 *  A MAGNATE outranks a chief executive here, which looks odd for one line
 *  and is right: `MAGNATES` is old money, four generations of shipping and
 *  "never worked a day", where a rival chief executive is somebody running a
 *  listed company. HIGH_SOCIETY is exactly the old money room and
 *  CORPORATE_ELITE is exactly the other. See love/logic/psychometrics.ts,
 *  where those two tiers already carry that distinction in their numbers.
 */
export const tierForSeat = (kind: Opponent['kind']): SocialTier =>
    kind === 'magnate' ? 'HIGH_SOCIETY' : 'CORPORATE_ELITE';

export type Suitor = {
    /** Their seat id. The same person every time, and the key to their face. */
    id: string;
    name: string;
    gender: 'male' | 'female';
    /** What they run, for the message and for the card. */
    company?: string;
    tier: SocialTier;
};

/**
 * Whether anybody from tonight's table writes, and who.
 *
 * `playerGender` steers it the same way `partnerGenderFor` steers the pool:
 * MOSTLY the other one, sometimes not. Written as a filter rather than as a
 * coin because these people have a fixed sex - a coin would produce "the game
 * decided a man should write to you" a fifth of the time whoever was actually
 * sitting there, and then have nobody of that sex at the table to be it.
 *
 * `roll` is injected so the rate can be measured rather than asserted.
 */
export const suitorFrom = (
    table: readonly Opponent[],
    playerGender: 'male' | 'female' | undefined,
    roll: () => number = Math.random,
): Suitor | null => {
    const seats = eligibleSeats(table);
    if (seats.length === 0) return null;

    // Which way this particular night leans. Drawn ONCE, before looking at
    // the table, so a table of four men cannot quietly become four chances
    // to draw a man for a player who mostly meets women.
    const wants: 'male' | 'female' | undefined =
        playerGender === 'male' || playerGender === 'female'
            ? (roll() < SAME_GENDER_CHANCE
                ? playerGender
                : (playerGender === 'female' ? 'male' : 'female'))
            : undefined;

    for (const seat of seats) {
        const gender = seatGender(seat.id)!;
        if (wants && gender !== wants) continue;
        if (roll() >= SUITOR_CHANCE) continue;
        return {
            id: seat.id,
            name: seat.name,
            gender,
            company: seat.company,
            tier: tierForSeat(seat.kind),
        };
    }
    return null;
};
