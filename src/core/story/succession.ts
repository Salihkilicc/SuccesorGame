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
import { successorFor, heirInWaiting, SUCCESSION_AGE } from './mortality';

/** Only what the plan needs, so this is testable without a Child. */
export type Heir = {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female';
    /**
     * Born inside the marriage. Absent means yes.
     *
     * Only affects the stock, and only for a child who is not the heir. See
     * inheritance.ts, `Survivor.legitimate`.
     */
    legitimate?: boolean;
};

export type SuccessionInput = {
    children: readonly Heir[];
    /** The family name, so it can be taken off the heir's. */
    lastName: string;
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
    /**
     * Years the chair stood empty before this one could take it.
     *
     * Zero in the ordinary case. Above zero when the only heir was a child:
     * the company is held, the clock skips, and everybody in the family is
     * that many years older on the other side of it. See `heirInWaiting`.
     */
    yearsHeld: number;
};

/**
 * The heir's first name, with the family name taken off.
 *
 * Strips the surname when it is there and falls back to the first word when
 * it is not, which covers a child named before the family name was settled
 * and a save from an older version. A two word given name survives the first
 * branch and is only cut by the second, which is the right way round: losing
 * half of "Mary Anne" is worse than leaving a stray surname on somebody whose
 * name does not end in it.
 */
export const firstNameOf = (fullName: string, lastName: string): string => {
    const name = (fullName || '').trim();
    if (lastName) {
        const stripped = name.replace(new RegExp(`\\s+${lastName}$`, 'i'), '').trim();
        // Only when it actually took something off. An unchanged string is
        // truthy, so returning it here skipped the fallback entirely and
        // "Elena Vance" came back whole under the family name Hale.
        if (stripped && stripped !== name) return stripped;
    }
    return name.split(/\s+/)[0] || name;
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
    const candidates = input.children.map(c => ({ id: c.id, age: c.age }));
    const now = successorFor(candidates, input.designatedSuccessorId);

    // ------------------------------------------------------------------
    //  NOBODY OLD ENOUGH TODAY IS NOT NOBODY
    // ------------------------------------------------------------------
    //  It used to be: `successorFor` returned null and the run ended on
    //  `diedWithoutAnHeir`, the same ending as dying with no family at all.
    //  A founder who had a son at eighty got the barren ending, which reads
    //  as a punishment for the timing of a death.
    //
    //  The company is held instead, and the years are skipped. See the note
    //  above `heirInWaiting`.
    // ------------------------------------------------------------------
    const waiting = now ? null : heirInWaiting(candidates);
    const heir = now ?? waiting?.heir ?? null;
    if (!heir) return null;

    const yearsHeld = waiting?.years ?? 0;

    const child = input.children.find(c => c.id === heir.id);
    if (!child) return null;

    const survivors: Survivor[] = [
        // `legitimate` decides whether a child who is not the heir takes
        // stock. `readRecord` passes it and this did not, so the estate the
        // player was SHOWN and the estate they were GIVEN disagreed about an
        // illegitimate child. Two readers of one rule is how they drift.
        ...input.children.map(c => ({
            id: c.id, kind: 'child' as const, legitimate: c.legitimate !== false,
        })),
        ...(input.survivingParent ? [{ id: 'parent', kind: 'spouse' as const }] : []),
    ];

    const bequests = divideEstate(input.estate, survivors, heir.id);
    const mine = bequests.find(b => b.kind === 'heir');

    return {
        ceo: {
            id: child.id,
            // FIRST NAME ONLY, and it said so while passing the whole thing.
            // Children are stored as "Elena Hale" (useFamilyStore enforces it
            // on rehydrate) and useIdentityStore holds the first name and the
            // family name separately, so handing over `child.name` put the
            // surname in the first name field and the home screen rendered
            // "Elena Hale Hale".
            firstName: firstNameOf(child.name, input.lastName),
            // Sixteen on the day they take it, whatever they were on the day
            // it fell to them. `yearsHeld` is what the rest of the family
            // ages by - see runSuccession.
            age: yearsHeld > 0 ? SUCCESSION_AGE : child.age,
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
        survivingParent: input.survivingParent
            ? {
                ...input.survivingParent,
                age: input.survivingParent.age + yearsHeld,
            }
            : null,
        generation: input.generation + 1,
        yearsHeld,
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
