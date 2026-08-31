// src/features/casino/logic/slotsData.ts
//
// ============================================================================
//  THREE MACHINES ABOUT THE COMPANY
// ============================================================================
//
//  What was here: Street Fighter Slots, Poseidon's Fortune and High Roller
//  Deluxe, with thirteen emoji between them, in a game about a succession.
//
//  ---------------------------------------------------------------------------
//  AND THE MULTIPLIER TABLES DECIDED NOTHING
//  ---------------------------------------------------------------------------
//  Every machine carried a `multipliers` map and a `twoKindMultiplier`, five
//  and one per machine, eighteen hand-written numbers - and NOTHING READ ANY OF
//  THEM. The payout in useSlotsLogic was a flat `bet * 3` for a jackpot and
//  `bet * 2` for a mini, whatever landed. So the reels were scenery: what they
//  showed had no bearing on what you won, and the three machines differed only
//  in which pictures went past.
//
//  The same shape as the buyout price and the sponsorship brand gain: careful
//  data, correctly authored, that nothing downstream consults.
//
//  ---------------------------------------------------------------------------
//  AND THE HOUSE TOOK FORTY FIVE PER CENT
//  ---------------------------------------------------------------------------
//  Measured off the old odds: a jackpot at 1/14 paying 3x and a mini at 1/6
//  paying 2x returns 0.548 of the stake. Real machines return between 0.92 and
//  0.96, and even a punishing one does not take half. That was not a
//  difficulty setting, it was an unnoticed arithmetic result - nobody multiplied
//  the two lines together.
//
//  ---------------------------------------------------------------------------
//  SO: THE TICKER, THE BOARDROOM, THE DYNASTY
//  ---------------------------------------------------------------------------
//  Asked for as "bizim oyuna gore, temaya gore". Each machine is one of the
//  three things this game is actually about, the symbols are
//  MaterialCommunityIcons rather than emoji, and the multipliers are now what
//  a line pays.
//
//  The three climb in volatility rather than in generosity: the Ticker pays
//  small and often, the Dynasty pays rarely and enormously, and all three
//  return the same fraction of the stake in the long run. Picking a machine is
//  a choice about the SHAPE of the evening, not about which one is better,
//  because a machine that is simply better makes the other two furniture.
// ============================================================================

import { palette } from '../../../core/theme';

export type SlotVariant = 'ticker' | 'boardroom' | 'dynasty';

export type SlotSymbol = {
    /** Stable key. Used by the reel, the payout table and the tests. */
    id: string;
    /** MaterialCommunityIcons name. */
    icon: string;
    /** What three of them pay, as a multiple of the stake. */
    payout: number;
    /**
     * The colour it is drawn in, from the palette.
     *
     * ------------------------------------------------------------------
     *  COLOUR IS THE PAYOUT TABLE, DRAWN
     * ------------------------------------------------------------------
     *  Every symbol on a reel used to be tinted with the ROOM's colour, so
     *  five different things arrived in one colour and a machine read as a
     *  column of identical blue shapes. Reported as "daha renkli".
     *
     *  More colours would fix the look and waste the opportunity. These
     *  climb with the payout - grey at the bottom, orange and violet at the
     *  top - so a player learns what a good symbol looks like before they
     *  have read a single number, and a near miss on the crown is visible
     *  from across the reel.
     *
     *  Green and red are absent on purpose. They mean profit and loss in
     *  this game and the amount that floats up after a spin is already
     *  using them; a symbol that looked like a signal would be worse than
     *  a symbol with no colour at all. See core/theme.ts.
     * ------------------------------------------------------------------
     */
    colour: string;
};

export type SlotConfig = {
    title: string;
    icon: string;
    subtitle: string;
    /**
     * What three of a kind pays, cheapest face first.
     *
     * The FACES are not here any more. They come from the city - see
     * `slotFaces` in data/casinoData.ts - so the same machine wears seven
     * different sets of symbols without seven copies of this table to keep
     * in step. The maths is the machine, the pictures are the room.
     */
    payouts: readonly [number, number, number, number, number];
    /** What two of a kind pays, as a multiple of the stake. */
    twoKindMultiplier: number;
    /**
     * Chance of three of a kind. This is the machine's CHARACTER: the Ticker
     * hits one spin in nine and the Dynasty one in fifty five.
     *
     * The two-of-a-kind rate is NOT stored beside it. See `miniOdds` below -
     * it is solved for, so that editing a payout cannot silently move the
     * return away from TARGET_RTP the way the old flat 3x and 2x did.
     */
    jackpotOdds: number;
    minBet: number;
    maxBet: number;
};

// ============================================================================
//  THE MATHS LIVES IN core/casino/slots.ts NOW
// ============================================================================
//  `meanJackpot`, `miniOdds`, `expectedReturn` and `isBalanced` were all here,
//  in the same file as the icon names and the subtitles, because the machine's
//  return and the machine's face were never separated. Re-exported rather than
//  re-declared: this file is the CITY, the engine is the MACHINE, and two
//  copies of a payout solver is how the last several bugs happened.
// ============================================================================

export {
    TARGET_RTP,
    meanJackpot,
    expectedReturn,
    isBalanced,
} from '../../../core/casino/slots';

/** Kept under its old name because the tests and the tuning notes use it. */
export { secondOdds as miniOdds } from '../../../core/casino/slots';

/**
 * The colour of each rung, cheapest first.
 *
 * ------------------------------------------------------------------------
 *  COLOUR IS THE PAYOUT TABLE, DRAWN
 * ------------------------------------------------------------------------
 *  Every symbol on a reel used to be tinted with the ROOM's colour, so five
 *  different things arrived in one colour and a machine read as a column of
 *  identical shapes. Reported as "daha renkli".
 *
 *  More colours alone would fix the look and waste the chance. These climb
 *  with the payout, so a player learns what a good face looks like before
 *  they have read a number and a near miss on the jackpot face is visible
 *  from across the reel. The ramp is the same in every city, which is what
 *  lets a player carry that reading from Athens to Macau.
 *
 *  Green and red are absent on purpose. They mean profit and loss in this
 *  game and the amount that floats up after a spin is already using them; a
 *  symbol that looked like a signal would be worse than one with no colour.
 * ------------------------------------------------------------------------
 */
export const VALUE_COLOURS: readonly [string, string, string, string, string] = [
    palette.grey,
    palette.greyLight,
    palette.blueLight,
    palette.violet,
    palette.orange,
] as const;

/**
 * The machine's maths and the city's faces, zipped.
 *
 * This is the whole "her sehre ayri slot" change in one function: the
 * payouts come from the variant, the icons come from the room, and the
 * colour comes from the rung. Nothing has to agree with anything by hand.
 */
export const symbolsFor = (
    config: SlotConfig,
    faces: readonly string[],
): SlotSymbol[] =>
    config.payouts.map((payout, i) => ({
        id: `${i}`,
        icon: faces[i] ?? faces[faces.length - 1] ?? 'help-circle-outline',
        payout,
        colour: VALUE_COLOURS[i] ?? VALUE_COLOURS[VALUE_COLOURS.length - 1],
    }));

export const SLOT_CONFIG: Record<SlotVariant, SlotConfig> = {
    // ------------------------------------------------------------------
    //  THE TICKER - small, frequent, and nearly always something
    // ------------------------------------------------------------------
    //  The grinder. A jackpot better than one spin in nine, and the payouts
    //  are correspondingly modest. This is the machine to sit at when what
    //  you want is to still be sitting there in an hour.
    // ------------------------------------------------------------------
    ticker: {
        title: 'The Ticker',
        icon: 'chart-line',
        subtitle: 'Small print, small margins, all night long',
        payouts: [3, 4, 5, 6, 9] as const,
        // RESHAPED. See core/casino/slots.ts: x1.5 was your stake back with a
        // tip, not a win. Doubling it costs nothing - `miniOdds` re-solves -
        // and the machine goes from 34% tiny wins to 28% real ones.
        twoKindMultiplier: 2,
        jackpotOdds: 0.11,
        minBet: 10,
        maxBet: 30_000,
    },

    // ------------------------------------------------------------------
    //  THE BOARDROOM - the middle of the three, in every sense
    // ------------------------------------------------------------------
    boardroom: {
        title: 'The Boardroom',
        icon: 'gavel',
        subtitle: 'Motions carried, seats taken, minutes kept',
        payouts: [4, 6, 8, 11, 16] as const,
        twoKindMultiplier: 2.5,
        jackpotOdds: 0.06,
        minBet: 10,
        maxBet: 60_000,
    },

    // ------------------------------------------------------------------
    //  THE DYNASTY - rare, and worth waiting for
    // ------------------------------------------------------------------
    //  The one that pays a hundred times the stake and almost never does.
    //  Same return as the other two over a long enough night, which is the
    //  point of a volatility ladder: you are choosing the shape of the
    //  variance, not buying a better deal.
    // ------------------------------------------------------------------
    dynasty: {
        title: 'The Dynasty',
        icon: 'crown',
        subtitle: 'Rings, wills, and the name on the building',
        payouts: [8, 14, 22, 40, 100] as const,
        twoKindMultiplier: 3,
        jackpotOdds: 0.018,
        minBet: 10,
        maxBet: 100_000,
    },
};

export const VARIANTS: readonly SlotVariant[] = ['ticker', 'boardroom', 'dynasty'] as const;

/** Every icon name a machine can show, for the reel strip. */
export const iconStrip = (symbols: SlotSymbol[]): string[] => symbols.map(s => s.icon);

/** What colour an icon is drawn in. Falls back to plain white. */
export const colourOfIcon = (symbols: SlotSymbol[], icon: string): string =>
    symbols.find(s => s.icon === icon)?.colour ?? '#FFFFFF';

/** The symbol behind an icon name, for turning a landed reel into money. */
export const symbolByIcon = (symbols: SlotSymbol[], icon: string): SlotSymbol | undefined =>
    symbols.find(s => s.icon === icon);

