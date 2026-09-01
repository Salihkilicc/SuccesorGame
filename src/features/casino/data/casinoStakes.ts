// src/features/casino/data/casinoStakes.ts
//
// ============================================================================
//  THE TABLE SHOULD KNOW HOW RICH YOU ARE
// ============================================================================
//
//  Reported as "the money amounts are always the same, bring in a percentage
//  system, rising room by room, and in the last casino let us play with five
//  per cent of our money as the maximum. Make it dynamic."
//
//  The old rooms carried fixed ceilings: Athens 1,000,000 and Macau
//  100,000,000,000, written down once and true for exactly one bankroll. Both
//  ends of that fail:
//
//    EARLY   Athens' smallest chip is 1,000 against a starting fortune that
//            is not much larger. The table is a wall.
//    LATE    Macau's ceiling is 100 billion. A player worth a trillion is
//            betting a tenth of a per cent and cannot lose anything that
//            matters; a player worth ten billion cannot cover one chip.
//
//  A fixed ceiling can only be right for one player, and the whole point of
//  the room ladder is that the player changes.
//
//  So the ceiling is a SHARE of what you have, and it widens as you climb:
//
//      Athens        0.5%     you are here to be seen, not to gamble
//      Istanbul        1%
//      Las Vegas       2%
//      Monte Carlo   3.5%
//      Macau           5%     asked for by name
//
//  Which means the last room can take a twentieth of everything on one hand,
//  at every size of fortune, forever. That is the number that was wanted and
//  it is the right shape: the danger scales with the man rather than with the
//  decade.
//
//  ---------------------------------------------------------------------------
//  AND A FLOOR, BECAUSE A PERCENTAGE OF NOTHING IS NOTHING
//  ---------------------------------------------------------------------------
//  A percentage alone breaks worse than a constant does: a broke player gets
//  a maximum bet of zero, four chips worth zero each, and a table that cannot
//  be played at all. Every room therefore carries a small absolute minimum,
//  and the ceiling is whichever is larger. The floors are what the old fixed
//  chips already implied at the bottom of each room, so nothing about the
//  early game moves.
// ============================================================================

import type { CasinoLocation } from './casinoData';
import { VIP_LOCATION_ID, vipChipsFor, vipMaxBet } from './vipRoom';
import { pokerBuyIn } from '../../../core/casino/pokerStakes';

/**
 * A number a casino would actually print on a chip.
 *
 * `money * 0.035` is 3,481,927. Nobody stacks those. This rounds to the
 * nearest 1, 2 or 5 followed by zeros, which is what every chip in every
 * casino in the world is denominated in, and it is why the tables still read
 * as tables once the figures are derived rather than typed.
 */
export const niceChip = (value: number): number => {
    const v = Math.max(0, Math.floor(value || 0));
    if (v < 10) return Math.max(0, v);
    const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
    const lead = v / magnitude;
    const snapped = lead >= 5 ? 5 : lead >= 2 ? 2 : 1;
    return snapped * magnitude;
};

/**
 * The most one hand can cost in this room.
 *
 * The larger of the room's share of your money and the room's floor, so a
 * poor player can still sit at the bottom table and a rich one is never
 * playing for pocket change at the top one.
 */
/**
 * NOT ROUNDED, and that was a bug for one measurement.
 *
 * Snapping the ceiling to 1/2/5 collapsed the rooms into each other: at a
 * five hundred million bankroll, Las Vegas at 2% and Monte Carlo at 3.5% both
 * snapped to ten million, so an entire room's step up was invisible. Measured
 * again at fifty billion and it happened there too.
 *
 * The ceiling is a promise - "up to five per cent of what you have" - and a
 * promise should be exact. The CHIPS are the round numbers, because chips are
 * the thing that gets stacked. See chipsFor.
 */
export const maxBetFor = (location: CasinoLocation, money: number): number => {
    // Everything you have. See vipRoom.vipMaxBet.
    if (location.id === VIP_LOCATION_ID) return vipMaxBet(money);
    const wealth = Math.max(0, Number.isFinite(money) ? money : 0);
    const share = wealth * (location.maxBetPercent ?? 0);
    return Math.floor(Math.max(location.minMaxBet ?? 0, share));
};

/**
 * The four chips on the rail, cheapest first.
 *
 * Derived from the ceiling rather than listed, because a listed set goes
 * stale the moment the ceiling moves - which it now does on every hand.
 *
 * A fiftieth, a tenth, a third and the whole thing. Not even steps: the gap
 * between the smallest chip and the largest is what makes a table feel like a
 * place where different people are playing, and even steps flatten it.
 */
export const CHIP_FRACTIONS = [1 / 50, 1 / 10, 1 / 3, 1] as const;

export const chipsFor = (location: CasinoLocation, money: number): number[] => {
    // ------------------------------------------------------------------
    //  THE VIP ROOM DOES NOT HAVE A RAIL
    // ------------------------------------------------------------------
    //  Four shares of everything you own, up to all of it - not a ladder of
    //  denominations with a ceiling on top. Routed through here rather than
    //  handled at each of the five call sites, so no table can accidentally
    //  offer a Macau rail in the Noir room.
    //  See vipRoom.VIP_BET_FRACTIONS.
    // ------------------------------------------------------------------
    if (location.id === VIP_LOCATION_ID) return vipChipsFor(money);

    const max = maxBetFor(location, money);
    const raw = CHIP_FRACTIONS.map(f => niceChip(max * f));

    // Rounding can collapse two fractions onto the same chip at small
    // ceilings, and a rail with the same denomination twice looks broken.
    // Walk it upwards and keep each one strictly above the last.
    const out: number[] = [];
    for (const c of raw) {
        const previous = out.length > 0 ? out[out.length - 1] : 0;
        out.push(Math.max(c, previous + 1));
    }
    // The top chip is the ceiling itself, whatever the walk did to it.
    out[out.length - 1] = Math.max(max, out[out.length - 1]);
    return out;
};

/** The share of a fortune the last room can take in one hand. Asked for by name. */
export const TOP_ROOM_BET_SHARE = 0.05;

// ============================================================================
//  AND POKER USES THE SAME LADDER FOR A DIFFERENT THING
// ============================================================================
//
//  Asked for as "in poker remove the bets, set a buy-in for each country and
//  for the VIP room, and enter by paying it... in the VIP room let it be ten
//  per cent of your money."
//
//  A poker room posts one number on the wall. The chip rack above answers
//  "how much is this hand worth", which is the right question for roulette
//  and the wrong one at a poker door, where the only question is what it
//  costs to sit down.
//
//  IT IS THE ROOM'S OWN SHARE, not a second ladder. Athens plays for half a
//  per cent of your fortune and its poker door costs half a per cent; Macau
//  five and five. Which lands the VIP room on ten, the number that was asked
//  for, without anybody typing a table of six figures that goes stale the
//  first time a share moves.
// ============================================================================

/** The VIP room's poker door, as a share of everything. Asked for by name. */
export const VIP_POKER_SHARE = 0.10;

/** What it costs to sit down at this room's poker table. */
export const pokerBuyInFor = (location: CasinoLocation, money: number): number => {
    if (location.id === VIP_LOCATION_ID) {
        return pokerBuyIn(money, VIP_POKER_SHARE, 0);
    }
    return pokerBuyIn(money, location.maxBetPercent ?? 0, location.minMaxBet ?? 0);
};
