// src/core/story/succession.ts
//
// ============================================================================
//  THE COMPANY STAYS. THE PERSON CHANGES.
// ============================================================================
//
//  newGame.ts wipes everything and says why in three hundred lines: an
//  exception carved into a wipe is the shape of bug that file exists to end.
//  This is the mirror of it, and it is a different operation rather than an
//  option on the same one, which is the whole reason it is its own file.
//
//      A NEW GAME  keeps the person and wipes the company.
//      A SUCCESSION keeps the company and replaces the person.
//
//  The identity store already made that argument. Its header says "who you are
//  is not part of a run, the company is wiped and rebuilt, the person starting
//  it is the same person". A succession is that sentence upside down, and the
//  architecture was ready for it before anybody wrote this.
//
//  ---------------------------------------------------------------------------
//  WHAT ACTUALLY MOVES
//  ---------------------------------------------------------------------------
//  Everything about the COMPANY carries: the capital, the products, the brand,
//  the plant, the market, the subsidiaries, the loans, the board. The heir
//  inherits a going concern with its problems attached, and that is the point.
//  Handing them a clean company would be a new game with a different name on
//  it.
//
//  What changes is one person: the name, the age, the cash, and the block of
//  stock. Everything downstream of those is arithmetic.
//
//  ---------------------------------------------------------------------------
//  AND THE SIBLINGS ARRIVE ON THE REGISTER
//  ---------------------------------------------------------------------------
//  This is the piece the last twenty prompts were building towards without
//  saying so. The children who wrote to you about the annual report inherit
//  stock under inheritance.ts, and stock is a seat: they become entries in
//  useShareholderStore, which is the store that can already remove a chief
//  executive.
//
//  So the sibling who was passed over does not become a grudge in a text file.
//  They become a shareholder with a vote, in the company their brother now
//  runs, using the machinery that has been in the game since the first year.
//  Nothing new had to be invented for the best part of it.
//
//  PURE. No stores, no clock, no random. runSuccession.ts does the writing.
// ============================================================================

import { divideEstate, type Estate, type Survivor } from './inheritance';
import { successorFor } from './mortality';

/** Only what the plan needs, so this is testable without a Child. */
export type Heir = {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female';
};

export type SuccessionInput = {
    children: readonly Heir[];
    designatedSuccessorId: string | null;
    /** The surviving spouse, if there is one. Null when there is not. */
    survivingParent: { name: string; age: number } | null;
    estate: Estate;
    /** Which generation is in the chair now. The founder is 1. */
    generation: number;
};

export type SuccessionPlan = {
    /** Who is in the chair from the next quarter. */
    ceo: { id: string; firstName: string; age: number; gender: 'male' | 'female' };
    /** Their inheritance, which is now the player's personal cash. */
    cash: number;
    /** Their block of stock, which is now `playerShareCount`. */
    shares: number;
    /**
     * The others, and what they hold.
     *
     * Handed to the board rather than kept in the family, because a share is a
     * seat. See the header.
     */
    siblings: { id: string; name: string; cash: number; shares: number }[];
    /** Kept as a person in the new family. Holds no stock, by design. */
    survivingParent: { name: string; age: number } | null;
    generation: number;
};

/**
 * The next generation, as data.
 *
 * `null` when nobody can take over, which is not a failure: it is the
 * `diedWithoutAnHeir` branch, and the caller ends the run instead.
 *
 * Composed out of the two modules that already exist rather than reimplementing
 * either. `successorFor` decides WHO and `divideEstate` decides WHAT, and this
 * file only turns their answers into the shape the stores want. That matters
 * because both of those rules are asserted in their own tests, and a second
 * copy of "the eldest, unless one was named" living in here is exactly how the
 * two would drift.
 */
export const planSuccession = (input: SuccessionInput): SuccessionPlan | null => {
    const heir = successorFor(
        input.children.map(c => ({ id: c.id, age: c.age })),
        input.designatedSuccessorId,
    );
    if (!heir) return null;

    const child = input.children.find(c => c.id === heir.id);
    if (!child) return null;

    const survivors: Survivor[] = [
        ...input.children.map(c => ({ id: c.id, kind: 'child' as const })),
        ...(input.survivingParent ? [{ id: 'parent', kind: 'spouse' as const }] : []),
    ];

    const bequests = divideEstate(input.estate, survivors, heir.id);
    const mine = bequests.find(b => b.kind === 'heir');

    return {
        ceo: {
            id: child.id,
            // FIRST NAME ONLY. The surname is the company's and it does not
            // change hands - see useIdentityStore, where the player is asked
            // for a first name and the family name is fixed.
            firstName: child.name,
            age: child.age,
            gender: child.gender === 'Female' ? 'female' : 'male',
        },
        cash: mine?.cash ?? 0,
        shares: mine?.shares ?? 0,
        siblings: bequests
            .filter(b => b.kind === 'child')
            .map(b => ({
                id: b.id,
                name: input.children.find(c => c.id === b.id)?.name ?? 'A sibling',
                cash: b.cash,
                shares: b.shares,
            }))
            // Somebody who inherited no stock is not a shareholder, and seating
            // them would put a director on the board with nothing to vote.
            .filter(s => s.shares > 0),
        survivingParent: input.survivingParent,
        generation: input.generation + 1,
    };
};

/**
 * How the game refers to a generation out loud.
 *
 * Ordinals rather than a number, because "Generation 3" is a save slot and
 * "the third generation" is a family. The game says this on the closing screen
 * and on the profile, so it is worth it being a sentence.
 */
export const generationName = (generation: number): string => {
    const n = Math.max(1, Math.floor(generation || 1));
    const names = ['the founder', 'the second generation', 'the third generation',
        'the fourth generation', 'the fifth generation'];
    return names[n - 1] ?? `generation ${n}`;
};
