// src/core/story/nightOutChild.ts
//
// ============================================================================
//  THE GAME PROMISED A CHILD AND NEVER DELIVERED ONE
// ============================================================================
//
//  `nightOutUtils` has rolled a seven per cent pregnancy on every night out
//  since it was written, and `PregnancyRevealModal` says so to the player's
//  face, in as many words:
//
//      "Cilgin gecen kalici bir iz birakti. Ebeveyn oluyorsun."
//      "Your wild night left a permanent mark. You are becoming a parent."
//
//  The modal is fifty one lines: an icon, three sentences and a button that
//  closes it. It does not import the family store. `addChild` is never called.
//  So the game tells you that you are a parent and no child is ever born.
//
//  Correct data with no reader again, and this one is worse than the others
//  because it is a PROMISE rather than a number: the player is told something
//  happened to them and then nothing did. Two of the six long simulation runs
//  ended in `diedWithoutAnHeir`, and this is part of the reason.
//
//  ---------------------------------------------------------------------------
//  WHY THE STATS ARE LOWER THAN A PLANNED CHILD'S
//  ---------------------------------------------------------------------------
//  `FamilyMemberScreen` builds a baby with intellect and charm from 75, and
//  loyalty pinned at 95. That is a child born into a marriage the player
//  chose, raised in the house, with the surname on the door from the first
//  day.
//
//  This one is not that. The floors are lower and, more importantly, LOYALTY
//  is not a certainty: a child who arrives by letter has a reason to be
//  ambivalent about the family that did not expect them. It is still your
//  heir and it can still be the best one you get. It is simply not free.
//
//  PURE. The random is injected so a test can hold it still.
// ============================================================================

import type { Child } from '../store/useFamilyStore';

/**
 * The calendar year the dynasty starts in.
 *
 * Named here because it was a bare 2026 in FamilyMemberScreen and another in
 * useLuxoNetStore, and a third copy in this file would be the point at which
 * they start disagreeing. It is not a fact this module owns; it is a fact
 * nothing owned, and this is the first place that needed to say it out loud.
 */
export const DYNASTY_START_YEAR = 2026;

/** Given names for a child nobody planned. The surname is added by the store. */
export const NIGHT_OUT_CHILD_NAMES: readonly string[] = [
    'Alex', 'Blair', 'Cameron', 'Devon', 'Ellis', 'Frankie',
    'Gray', 'Harper', 'Indigo', 'Jules', 'Kai', 'Lennox',
    'Marlowe', 'Noel', 'Oakley', 'Parker', 'Quinn', 'Reese',
    'Sasha', 'Tatum', 'Vesper', 'Wren',
] as const;

/** Loyalty a child born this way starts with, against 95 for a planned one. */
export const NIGHT_OUT_CHILD_LOYALTY = 60;

/** And how warm they are towards you, against 100 for a planned one. */
export const NIGHT_OUT_CHILD_RELATIONSHIP = 55;

export interface NewbornContext {
    /** Calendar year of the birth, for the family screen's timeline. */
    birthYear: number;
    /** Quarter within that year, 1 to 4. */
    birthQuarter: number;
}

/**
 * The child the modal has already told the player about.
 *
 * Everything the store needs and nothing it does not. The name carries no
 * surname on purpose: `addChild` appends the dynasty name itself, and doing
 * it here as well produced "Alex Hale Hale" the first time round.
 */
export const newbornFromNightOut = (
    ctx: NewbornContext,
    roll: () => number = Math.random,
): Omit<Child, 'id'> => {
    const pick = <T,>(xs: readonly T[]): T =>
        xs[Math.min(xs.length - 1, Math.floor(Math.max(0, roll()) * xs.length))];
    const span = (base: number, spread: number) =>
        base + Math.floor(Math.max(0, roll()) * spread);

    return {
        name: pick(NIGHT_OUT_CHILD_NAMES),
        gender: roll() < 0.5 ? 'Male' : 'Female',
        age: 0,
        birthYear: Math.max(0, Math.floor(ctx.birthYear || 0)),
        birthQuarter: Math.min(4, Math.max(1, Math.floor(ctx.birthQuarter || 1))),
        educationLevel: 'None',
        role: 'Infant',
        stats: {
            intellect: span(55, 35),
            charm: span(55, 35),
            businessAcumen: span(45, 40),
            // NOT the 95 a planned child gets. See the note at the top.
            loyalty: NIGHT_OUT_CHILD_LOYALTY,
            ambition: span(50, 40),
            health: span(85, 15),
            creativity: span(55, 35),
        },
        relationshipWithPlayer: NIGHT_OUT_CHILD_RELATIONSHIP,
        isSuccessorCandidate: false,
        traits: ['Unplanned'],
        allowance: 0,
    };
};
