// src/core/luxury/upkeep.ts
//
// ============================================================================
//  OWNING SOMETHING HAD NO CONSEQUENCE, AND REPAIRING IT PRINTED MONEY
// ============================================================================
//
//  Asked for as "there is a maintenance cost on the houses, it is not active
//  at the moment, should we turn it on" and "if we buy a house, its value
//  drops, and we repair it and sell it, is that not more profitable".
//
//  The answer to the second one turned out to be yes, by five times, and it
//  had been sitting in the code the whole time.
//
//  ---------------------------------------------------------------------------
//  WHAT WAS THERE
//  ---------------------------------------------------------------------------
//  `useAssetPortfolio` priced an asset and repaired it with two lines that
//  were never compared to each other:
//
//      conditionFactor = 0.5 + 0.5 * (condition / 100)
//      repairCost      = price * (100 - condition) / 1000
//
//  Take a $100M house down to 50 condition. It is now worth $75M. Restoring
//  it to 100 costs $5M and it is worth $100M again.
//
//      SPEND  5% of the price
//      GAIN  25% of the price
//
//  A five to one return, repeatable, on any item in the catalogue. The only
//  reason it is not currently being farmed is that NOTHING DECAYS CONDITION -
//  no code path anywhere reduces it, so every owned asset sits at 100 forever
//  and the repair button never appears. The exploit was waiting for the decay
//  to be switched on, which is exactly what this file does.
//
//  So the rule here is written as an inequality rather than as a pair of
//  tuned numbers: REPAIR COSTS MORE THAN IT RESTORES, always, by construction.
//  A repair is loss mitigation. It is never an investment.
//
//  ---------------------------------------------------------------------------
//  THEN WHY WOULD ANYBODY EVER REPAIR
//  ---------------------------------------------------------------------------
//  Because the alternative is worse and keeps getting worse. Condition falls
//  every quarter whether you act or not, and it falls FOUR TIMES FASTER on an
//  asset whose upkeep you did not pay. Doing nothing is not free; it is the
//  most expensive option, paid slowly. That is the shape a maintenance system
//  should have, and it is the opposite of the shape it had.
//
//  ---------------------------------------------------------------------------
//  WHERE THE RATES COME FROM
//  ---------------------------------------------------------------------------
//  Not invented. `useLuxoNetStore`'s shelved catalogue is the only place in
//  this project where anybody wrote a per-item maintenance figure, and four of
//  the six categories have an anchor there:
//
//      hypercar     85,000 / 3,900,000    2.18%
//      mansion     420,000 / 48,500,000   0.87%
//      private jet 1,400,000 / 78,000,000 1.79%
//      watch        12,000 / 4,200,000    0.29%
//
//  Marine and jewellery had none and are placed against their neighbours: a
//  yacht is the classic money pit and sits above an aircraft, and a stone in a
//  vault costs a little more than a watch in a drawer because it is bulkier to
//  insure and to keep.
//
//  MEASURED against the whole catalogue, which is what makes these numbers
//  answerable rather than a matter of taste:
//
//      CATEGORY        N      VALUE      UPKEEP/YR
//      REAL_ESTATE    17   $23,410M       $210.7M
//      MARINE         10    $8,085M       $202.1M
//      AIRCRAFT        9    $1,718M        $30.9M
//      VEHICLE        23      $384M         $8.4M
//      JEWELRY        13      $208M         $1.0M
//      WATCH          13      $149M         $0.4M
//      ALL            85   $33,954M       $453.7M   (1.34% a year)
//
//  And against what the player earns, which is the number that matters:
//
//      a CEO salary is           $45,000 a quarter
//      the MEDIAN item is $30M       $165,000 a quarter to keep
//
//  So one median purchase costs nearly four times the founder's entire salary
//  to hold. That is deliberate and it is the point: at this end of the game
//  the salary is not what buys these things - the CEO bonus, dividends and
//  share sales are - and upkeep is what turns a purchase into a commitment
//  rather than a receipt. A yacht you cannot afford to run is a decision you
//  got wrong, and until now there was no way to get it wrong.
//
//  PURE. No stores, no React. The caller decides what is owned and whether
//  the bill was paid.
// ============================================================================

/** The six departments of the shop. */
export type LuxuryCategory =
    | 'REAL_ESTATE' | 'VEHICLE' | 'MARINE' | 'AIRCRAFT' | 'WATCH' | 'JEWELRY';

/** What a thing costs to keep for a year, as a share of its sticker price. */
export const UPKEEP_RATE: Record<LuxuryCategory, number> = {
    REAL_ESTATE: 0.009,
    VEHICLE: 0.022,
    MARINE: 0.025,
    AIRCRAFT: 0.018,
    WATCH: 0.003,
    JEWELRY: 0.005,
};

/**
 * Condition points lost per quarter while the upkeep IS being paid.
 *
 * Salt water first, then things with engines, then things that just sit. A
 * car at 0.8 a quarter is worth 68% of its condition after ten years, which
 * is roughly what a garaged car does.
 */
export const DECAY_PER_QUARTER: Record<LuxuryCategory, number> = {
    MARINE: 1.2,
    AIRCRAFT: 1.0,
    VEHICLE: 0.8,
    REAL_ESTATE: 0.6,
    JEWELRY: 0.15,
    WATCH: 0.1,
};

/**
 * How much faster it falls apart when the bill went unpaid.
 *
 * The whole reason the player cares about the upkeep line. At four times, a
 * neglected car is scrap inside eight years, and the choice between paying
 * and not paying is a real one rather than a rounding error.
 */
export const NEGLECT_MULTIPLE = 4;

/**
 * What a wreck is still worth, as a share of the sticker price.
 *
 * Kept at the value the shop already used. A ruined mansion is still land and
 * a ruined hypercar is still a rare hypercar; condition moves the top half of
 * the price and cannot take the whole of it.
 */
export const CONDITION_FLOOR = 0.5;

/**
 * How much more a repair costs than the value it puts back.
 *
 * THE CONSTANT THAT MATTERS. Anything at or below 1 is a money printer, which
 * is what was there. At 1.4 a restoration is always a loss of forty per cent
 * of the value it recovers, so nobody repairs to profit, and the reason to
 * repair is that neglect costs more.
 */
export const REPAIR_LOSS = 1.4;

export const QUARTERS_PER_YEAR = 4;

const clampCondition = (c: number): number =>
    Number.isFinite(c) ? Math.max(0, Math.min(100, c)) : 100;

const price = (p: number): number => (Number.isFinite(p) ? Math.max(0, p) : 0);

const rateFor = (category: string): number =>
    UPKEEP_RATE[category as LuxuryCategory] ?? 0;

const decayFor = (category: string): number =>
    DECAY_PER_QUARTER[category as LuxuryCategory] ?? 0;

/** What one thing costs to keep for a year. */
export const annualUpkeep = (item: { price: number; category: string }): number =>
    price(item?.price) * rateFor(item?.category);

/** And per quarter, which is the unit the game moves money in. */
export const quarterlyUpkeep = (item: { price: number; category: string }): number =>
    annualUpkeep(item) / QUARTERS_PER_YEAR;

/** What a whole collection costs to keep for one quarter. */
export const portfolioUpkeepQuarterly = (
    items: Array<{ price: number; category: string }>,
): number => (items || []).reduce((sum, i) => sum + quarterlyUpkeep(i), 0);

/**
 * What a thing in this condition is worth.
 *
 * The shop's own curve, moved here so that the price and the repair bill are
 * finally derived from the same function. That they were not is the whole
 * defect at the top of this file.
 */
export const valueAt = (p: number, condition: number): number =>
    price(p) * (CONDITION_FLOOR
        + (1 - CONDITION_FLOOR) * (clampCondition(condition) / 100));

/**
 * Where the condition ends up after some quarters.
 *
 * `paid` is whether the upkeep was met. Deliberately a plain flag rather than
 * an amount: partial payment of a maintenance bill is not a thing the player
 * can express, and inventing a proportion here would be inventing a mechanic.
 */
export const decayed = (
    condition: number,
    category: string,
    quarters: number,
    paid: boolean,
): number => {
    const q = Number.isFinite(quarters) ? Math.max(0, quarters) : 0;
    const rate = decayFor(category) * (paid ? 1 : NEGLECT_MULTIPLE);
    return clampCondition(clampCondition(condition) - rate * q);
};

/**
 * What it costs to bring something from one condition up to another.
 *
 * Priced off the value it restores rather than off a separate formula, which
 * is the fix: two formulas that were never compared to each other is how a
 * five to one return goes unnoticed for months.
 *
 * Repairing downwards is free and does nothing, so the caller cannot make
 * money by asking for a worse asset.
 */
export const repairCost = (p: number, from: number, to = 100): number => {
    const gain = valueAt(p, to) - valueAt(p, from);
    return gain > 0 ? gain * REPAIR_LOSS : 0;
};

/**
 * What repairing actually costs you, net of the value it puts back.
 *
 * Always positive for a real repair. Exists so the screen can tell the player
 * the truth - "this restores $25M of value and costs $35M" - rather than
 * showing a bill and letting them assume it is an investment.
 */
export const repairNetLoss = (p: number, from: number, to = 100): number => {
    const gain = valueAt(p, to) - valueAt(p, from);
    return gain > 0 ? repairCost(p, from, to) - gain : 0;
};
