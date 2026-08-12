// src/data/market/founders.ts
//
// ============================================================================
//  THE PEOPLE WHO COME WITH THE COMPANY
// ============================================================================
//
//  Buying a company was, from the board's point of view, buying a temperament
//  at random: `TRAIT_BY_RISK` derived the incoming director's character from
//  the target's risk rating. Every 'High' risk company produced the same
//  Aggressive stranger with the same generated name, so no acquisition was
//  memorable and none was a decision about WHO you would be sitting across
//  from for the rest of the game.
//
//  Named companies get named people. The risk mapping stays for everyone
//  else, because forty listed companies do not each need a biography, and a
//  generic director is a perfectly good outcome for a generic purchase.
//
//  A NOTE ON WHY THESE THREE. They are the ones written into
//  data/AcquisitionData.ts - a file whose data is imported by nothing, so
//  SkyNet, VoltMotors and Streamify have never been buyable in a shipped
//  game. Their entries in the market list are new; this is where their people
//  live.
// ============================================================================

import type { TraitType } from '../../core/market/governanceTypes';
import type { Motivation, PetIssue } from '../../core/market/governance';

export interface NamedFounder {
    /** The person, not the company. */
    name: string;
    trait: TraitType;
    /**
     * Trust on a FRIENDLY deal - he sold to you and meant it.
     *
     * The generic rollover director starts at 60. These are set individually
     * because the number is characterisation: a man who has been looking for
     * an exit arrives warmer than one who was talked into it.
     */
    trust: number;
    /**
     * Trust on a HOSTILE deal.
     *
     * A generic founder does not appear at all after a hostile takeover -
     * `directorFromAcquisition` returns null and the premium is the price of
     * that. These three DO appear, because a named antagonist across the
     * table is worth more to the game than a clean board, and because a man
     * who lost his company and had to keep working for you is a better story
     * than one who took the cheque and left.
     *
     * Low enough to sit near `isHostile`, which the board treats as a
     * standing threat rather than a mood.
     */
    hostileTrust: number;
    motivation: Motivation;
    petIssue: PetIssue;
    /** One line, in his voice, for the announcement. */
    line: string;
    hostileLine: string;
}

/**
 * Keyed by the MARKET ID, not the company name.
 *
 * Names are displayed and translated; ids are not. Keying on the name would
 * break the moment anyone touched a label.
 */
export const FOUNDER_BY_COMPANY: Record<string, NamedFounder> = {
    // ------------------------------------------------------------------
    //  SKYNET AI — the Visionary
    // ------------------------------------------------------------------
    //  He burns money and does not consider that a criticism. On a board he
    //  is the one arguing for the thing that pays off in six years, which is
    //  useful exactly as often as it is dangerous. His pet issue is R&D, so
    //  taking him on means you will be asked about research every quarter
    //  for the rest of the game.
    // ------------------------------------------------------------------
    tech_skynet: {
        name: 'Dr. Marisol Vane',
        trait: 'Visionary',
        // Warm, but she sold because she ran out of runway and both of you
        // know it. Not gratitude.
        trust: 65,
        hostileTrust: 22,
        motivation: 'legacy',
        petIssue: 'rnd',
        line: 'I did not build it to be owned. I built it to be finished. Fund it.',
        hostileLine: 'You bought the building and the badge. The idea was never for sale.',
    },

    // ------------------------------------------------------------------
    //  VOLTMOTORS — the Conservative
    // ------------------------------------------------------------------
    //  Twenty years of batteries. Profitable, unexciting, and he would like
    //  it kept that way. He is the brake on the board: he will vote against
    //  leverage and against your bolder quarters, and about a third of the
    //  time he will turn out to have been right.
    //
    //  The player asked specifically that a hostile purchase seat him with
    //  low trust. It fits him better than the other two: he did not want to
    //  sell, he is still here, and he remembers.
    // ------------------------------------------------------------------
    ind_voltmotors: {
        name: 'Anders Køhl',
        trait: 'Conservative',
        trust: 58,
        // The lowest of the three. He is not a schemer; he is simply a man
        // who was taken, and he does not pretend otherwise.
        hostileTrust: 15,
        motivation: 'safety',
        petIssue: 'debt',
        line: 'Forty years without a bad quarter. I would like to keep that record.',
        hostileLine: 'I signed because the vote went against me. Do not mistake that for agreement.',
    },

    // ------------------------------------------------------------------
    //  STREAMIFY — the Shark
    // ------------------------------------------------------------------
    //  He sold at the top and he knows it. The most dangerous of the three
    //  precisely because he is the friendliest: a Shark reads a weak quarter
    //  as an opening. Buying him is buying a rival a seat.
    // ------------------------------------------------------------------
    tech_streamify: {
        name: 'Rui Okonjo',
        trait: 'Shark',
        // The lowest FRIENDLY trust of the three, and he was smiling when he
        // signed. He did not join you; he took a position.
        trust: 45,
        hostileTrust: 18,
        motivation: 'money',
        petIssue: 'dividend',
        line: 'Good price. Congratulations to us both — one of us more than the other.',
        hostileLine: 'You overpaid to humiliate me. I can work with a man who does that.',
    },

    // ------------------------------------------------------------------
    //  PLANORA — the friend
    // ------------------------------------------------------------------
    //  He is here for a narrow reason. `directorFromAcquisition` seats a
    //  GENERIC "Founder of Planora" when the deal is at least 3% of the
    //  buyer's value - which happens if the player buys him early, while
    //  they are still small. Without an entry here, the one person in the
    //  cast the player has a history with would arrive at their own board
    //  as a placeholder with a generated name.
    //
    //  Most players will not trigger that path: by the time Planora is
    //  affordable it is usually under 3% of the company, and he gets no
    //  automatic seat at all. That gap is deliberate and it is what
    //  `friendBoardSeat` in data/story/friendBoard.ts is for.
    //
    //  NO HOSTILE LINE THAT MEANS ANYTHING. You cannot take Planora
    //  hostile in practice - he sells to you at eighty per cent and asks
    //  first - but the field is required, so it says the only thing he
    //  would say.
    // ------------------------------------------------------------------
    tech_planora: {
        name: 'Marco Alvarez',
        trait: 'Visionary',
        // The highest trust of anybody who joins this board, and the only
        // one whose number is about the person rather than the deal.
        trust: 88,
        hostileTrust: 40,
        motivation: 'legacy',
        petIssue: 'rnd',
        line: 'ok so do i have to wear a suit to these',
        hostileLine: 'i didnt think you would do it like that. thats all',
    },
};

export const founderOf = (companyId: string): NamedFounder | undefined =>
    FOUNDER_BY_COMPANY[companyId];
