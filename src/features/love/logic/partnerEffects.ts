// src/features/love/logic/partnerEffects.ts
//
// ============================================================================
//  A FIELD THAT TOUCHES NO NUMBER IS NOT A FIELD
// ============================================================================
//
//  `PartnerStats` has fifteen entries. Before this file, four of them did
//  anything at all: `looks` and `style` are drawn, `intelligence` decides
//  whether somebody will sign a prenup, and `monthlyCost` is charged.
//
//  The rest - social class, family wealth, jealousy, crazy, libido, reputation,
//  financial aid, network - were read by nothing. Fifteen labels on a card, and
//  the card was the whole mechanic.
//
//  This is the first three of them, and they are the three that plug into
//  machinery the game already has rather than needing scenes written for them:
//
//    NETWORK POWER lowers the resistance of a board you write to. Somebody at
//    your table knows somebody at theirs, and the letter lands on a warmer
//    desk. It is the same axis `GOODWILL_FLOOR` sits on and it is capped well
//    below what a signed partnership buys, because who you are married to
//    should not beat what you have actually done.
//
//    REPUTATION BUFF moves `publicReputation` every quarter, up or down. It is
//    the only stat in the set that is allowed to be negative: being seen with
//    some people costs you, and that is the trade the criminal tier exists to
//    offer.
//
//    FINANCIAL AID is an offer of money when the player is short, and it
//    arrives as a MESSAGE rather than as a deposit - see the note on it below.
//
//  Jealousy and crazy are deliberately not here. They are event triggers and
//  an event needs a scene, and a mechanic without writing behind it is the
//  thing this project keeps having to undo.
//
//  ---------------------------------------------------------------------------
//  PURE. It reads no stores and writes nothing.
//  ---------------------------------------------------------------------------
// ============================================================================

import type { PartnerProfile } from '../../../data/relationshipTypes';

/**
 * The most a partner can take off a board's resistance.
 *
 * 0.08 against a refusal threshold that sits under one, and against
 * SECOND_APPROACH_PENALTY of 0.12 - so the best-connected partner in the game
 * is worth two thirds of what one signed partnership is worth. Deliberately.
 * Who you married should not beat what you did.
 */
export const MAX_NETWORK_RELIEF = 0.08;

/**
 * How much of `reputationBuff` lands each quarter.
 *
 * A tenth. The field runs -25 to +30, so a philanthropist moves public
 * standing about three points a quarter and a criminal takes two and a half
 * off. Slow on purpose: it is a drift, not an event, and a player should
 * notice it over a year rather than in a tick.
 */
export const REPUTATION_RATE = 0.1;

/**
 * How short the player has to be before anybody offers.
 *
 * Somebody who is comfortable does not get handed money by their partner, and
 * a partner who offers every quarter is an income rather than a relationship.
 */
export const AID_CASH_FLOOR = 250_000;

/** And what they put up, as a share of what their family has. */
export const AID_SHARE_OF_WEALTH = 4_000;

/**
 * What a board sees when they look you up.
 *
 * Returned as a POSITIVE number to be subtracted, because `resistance` adds
 * its terms and a negative-that-is-good is the kind of sign error that
 * survives review.
 */
export const networkRelief = (partner: PartnerProfile | null | undefined): number => {
    const power = partner?.stats?.networkPower ?? 0;
    if (!(power > 0)) return 0;
    return (power / 100) * MAX_NETWORK_RELIEF;
};

/** What being seen with them does to public standing, per quarter. */
export const reputationDrift = (partner: PartnerProfile | null | undefined): number => {
    const buff = partner?.stats?.reputationBuff ?? 0;
    if (!buff) return 0;
    return buff * REPUTATION_RATE;
};

export type AidOffer = {
    /** What they are putting up. */
    amount: number;
    /** Their name, because the offer arrives from a person. */
    from: string;
};

/**
 * Whether the player's partner offers to help this quarter.
 *
 * IT RETURNS AN OFFER, NOT A TRANSFER, and that is the whole design of it.
 * Money appearing in the player's account because a hidden percentage came up
 * is the shape this project has spent weeks removing from other systems: the
 * player cannot connect a number to a cause they never saw.
 *
 * So the caller posts it as a message and the money moves when the player
 * answers. `financialAidChance` decides whether the offer is made; the player
 * decides whether to take it.
 */
export const aidOffer = (
    partner: PartnerProfile | null | undefined,
    personalCash: number,
    roll: () => number = Math.random,
): AidOffer | null => {
    if (!partner) return null;
    if (personalCash >= AID_CASH_FLOOR) return null;

    const chance = partner.stats?.financialAidChance ?? 0;
    if (!(chance > 0)) return null;
    if (roll() * 100 >= chance) return null;

    // What their family has, not what they earn. A partner from nothing who
    // would give you everything still has nothing to give.
    const amount = Math.round((partner.stats?.familyWealth ?? 0) * AID_SHARE_OF_WEALTH);
    if (amount <= 0) return null;

    return { amount, from: partner.name };
};
