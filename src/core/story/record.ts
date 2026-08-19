// src/core/story/record.ts
//
// ============================================================================
//  THE SECOND SCREEN, WHICH IS NOT THE ENDING
// ============================================================================
//
//  data/story/endings.ts says, in a comment on the `body` field, that an
//  ending is "not an epilogue and not a scorecard, the point is what it FELT
//  like, and a page of consequences dilutes that". That is right and the
//  player also wants their numbers, and both can be true because they are two
//  screens.
//
//    FIRST, the ending. A title and three paragraphs. Not one digit on it.
//    THEN, one tap later, the record.
//
//  Put them on one screen and the prose dies: the eye finds the figures, and
//  the last thing the game says becomes a caption over a results table. Put
//  them in that order and each does its own job.
//
//  ---------------------------------------------------------------------------
//  A RECORD, NOT A STAT DUMP
//  ---------------------------------------------------------------------------
//  The test for a row is whether the player would say it out loud to somebody
//  describing the run. "I was in the chair for sixty-two quarters and I died
//  at eighty-one" is that. Inventory turns is not, and the quarterly report
//  already exists for anybody who wants those.
//
//  So there are eight rows and there is a reason for each. Every one of them
//  is a fact about the WHOLE RUN rather than the last quarter of it, which is
//  what makes this different from the report.
//
//  PURE. No stores, no clock. readRecord.ts is the file that knows the app
//  exists - same split as conditions.ts and world.ts, for the same reason.
// ============================================================================

import { formatMoney, formatNumber } from '../utils';

export type RecordRow = {
    /** Left column. Written as a sentence fragment the value completes. */
    label: string;
    /** Right column, already formatted. */
    value: string;
};

export type RecordInput = {
    /** Quarters in the chair, 1-based, from `currentQuarter()`. */
    quarters: number;
    /** Age at the end, not at the start. */
    age: number;
    companyValue: number;
    /** The player's own worth, cash plus their share of the company. */
    netWorth: number;
    employees: number;
    /** Products still on sale at the end. Retired ones do not count. */
    products: number;
    /** Companies acquired and still owned. */
    subsidiaries: number;
    children: number;
    /** Whether a successor was ever named. */
    heirNamed: boolean;
};

/**
 * Quarters as "N quarters" or, past a year, "N years, N quarters".
 *
 * Sixty-two quarters is a number nobody can feel. Fifteen years and two
 * quarters is a life, and this row is the one the whole screen is about.
 */
export const asTime = (quarters: number): string => {
    const q = Math.max(0, Math.floor(quarters));
    const years = Math.floor(q / 4);
    const rest = q % 4;
    if (years <= 0) return q === 1 ? '1 quarter' : `${q} quarters`;
    const y = years === 1 ? '1 year' : `${years} years`;
    if (rest === 0) return y;
    return `${y}, ${rest === 1 ? '1 quarter' : `${rest} quarters`}`;
};

/**
 * The family row, which is one row rather than two on purpose.
 *
 * "Children: 0" followed by "Heir: none" is two lines of nothing, and the
 * second is only interesting BECAUSE of the first. Whether somebody with four
 * children never named one of them is the most damning line available to this
 * screen, and it earns its place only when it can sit next to the four.
 */
export const asFamily = (children: number, heirNamed: boolean): string => {
    if (children <= 0) return 'None';
    const n = children === 1 ? '1 child' : `${children} children`;
    return heirNamed ? `${n}, one of them named` : `${n}, none of them named`;
};

/**
 * The whole run, in eight lines.
 *
 * Order is deliberate: time first because it is the one that lands, money in
 * the middle because it is what the player came for, and the family last
 * because it is the one they will still be thinking about on the new game
 * screen.
 */
export const buildRecord = (input: RecordInput): RecordRow[] => [
    { label: 'In the chair for', value: asTime(input.quarters) },
    { label: 'You were', value: `${Math.max(0, Math.floor(input.age))}` },
    { label: 'The company was worth', value: formatMoney(input.companyValue) },
    { label: 'You were worth', value: formatMoney(input.netWorth) },
    { label: 'On the payroll', value: formatNumber(input.employees) },
    { label: 'Products on sale', value: formatNumber(input.products) },
    { label: 'Companies bought', value: formatNumber(input.subsidiaries) },
    { label: 'Family', value: asFamily(input.children, input.heirNamed) },
];

/**
 * The line under the record: how many of the endings this player has found.
 *
 * The only thing on either screen that reaches outside the run, and the reason
 * `endingsSeen` sits in useIdentityStore rather than in the story store. A run
 * is wiped by a new game; what the PERSON has seen is not, in the same way and
 * for the same reason as their name and whether they have been taught.
 *
 * It says the total out loud, which is a choice. Hiding it would be more
 * mysterious and would leave a player who has found two of three with no way
 * of knowing they are nearly done - and the point of the line is to be a
 * reason to press New Game.
 */
export const endingsProgress = (seen: readonly string[], all: readonly string[]): string => {
    const known = new Set(all);
    // Filtered rather than counted: an id that no longer exists, because the
    // ending was renamed between versions, would otherwise report 4 of 3.
    const found = new Set(seen.filter(id => known.has(id))).size;
    return `${found} of ${all.length} endings found`;
};
